package com.sellez.auth;

import com.sellez.audit.AuditService;
import com.sellez.common.AliasGenerator;
import com.sellez.common.ApiException;
import com.sellez.community.Community;
import com.sellez.community.CommunityService;
import com.sellez.config.SellezProperties;
import com.sellez.email.NotificationService;
import com.sellez.moderation.Ban;
import com.sellez.moderation.BanRepository;
import com.sellez.security.CookieService;
import com.sellez.security.JwtService;
import com.sellez.security.UserPrincipal;
import com.sellez.user.UserAccount;
import com.sellez.user.UserAccountRepository;
import com.sellez.user.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    private final OtpChallengeRepository otps;
    private final RefreshTokenRepository refreshTokens;
    private final UserAccountRepository users;
    private final CommunityService communityService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notifications;
    private final JwtService jwtService;
    private final CookieService cookieService;
    private final SellezProperties properties;
    private final AuditService auditService;
    private final BanRepository bans;
    private final SecureRandom random = new SecureRandom();

    public AuthService(OtpChallengeRepository otps, RefreshTokenRepository refreshTokens, UserAccountRepository users,
                       CommunityService communityService, PasswordEncoder passwordEncoder, NotificationService notifications,
                       JwtService jwtService, CookieService cookieService, SellezProperties properties,
                       AuditService auditService, BanRepository bans) {
        this.otps = otps;
        this.refreshTokens = refreshTokens;
        this.users = users;
        this.communityService = communityService;
        this.passwordEncoder = passwordEncoder;
        this.notifications = notifications;
        this.jwtService = jwtService;
        this.cookieService = cookieService;
        this.properties = properties;
        this.auditService = auditService;
        this.bans = bans;
    }

    @Transactional
    public void sendOtp(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        Instant windowStart = Instant.now().minusSeconds(properties.getAuth().getOtpSendWindowMinutes() * 60L);
        if (otps.countByEmailAndCreatedAtAfter(email, windowStart) >= properties.getAuth().getOtpSendLimit()) {
            throw ApiException.tooMany("Too many codes requested. Please wait a few minutes.");
        }
        otps.findByEmailAndConsumedFalse(email).forEach(existing -> {
            existing.setConsumed(true);
            otps.save(existing);
        });
        String code = properties.getAuth().getOtpFixedCode() != null && !properties.getAuth().getOtpFixedCode().isBlank()
                ? properties.getAuth().getOtpFixedCode()
                : AliasGenerator.otp();
        OtpChallenge challenge = new OtpChallenge();
        challenge.setEmail(email);
        challenge.setCodeHash(passwordEncoder.encode(code));
        challenge.setExpiresAt(Instant.now().plusSeconds(properties.getAuth().getOtpTtlMinutes() * 60L));
        otps.save(challenge);
        notifications.sendOtp(email, code);
        auditService.log(null, null, "LOGIN_OTP_SENT", "otp", challenge.getId().toString(), Map.of("emailDomain", CommunityService.domainOf(email)));
    }

    @Transactional
    public MeResponse verifyOtp(String rawEmail, String code, HttpServletResponse response) {
        String email = normalizeEmail(rawEmail);
        OtpChallenge challenge = otps.findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> ApiException.unauthorized("No active code. Request a new one."));
        if (challenge.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.unauthorized("That code has expired.");
        }
        if (challenge.getAttempts() >= properties.getAuth().getOtpMaxAttempts()) {
            throw ApiException.tooMany("Too many attempts. Request a new code.");
        }
        challenge.setAttempts(challenge.getAttempts() + 1);
        if (!passwordEncoder.matches(code, challenge.getCodeHash())) {
            otps.save(challenge);
            throw ApiException.unauthorized("Incorrect code.");
        }
        challenge.setConsumed(true);
        otps.save(challenge);

        UserAccount user = users.findByEmailIgnoreCase(email).orElseGet(() -> createUser(email));
        if (properties.getSuperAdmin().emailList().contains(email)) {
            user.setRole(UserRole.SUPER_ADMIN);
            users.save(user);
        }
        issueSession(user, response);
        auditService.log(user.getId(), user.getCommunity().getId(), "OTP_VERIFIED", "user", user.getId().toString(), Map.of());
        auditService.log(user.getId(), user.getCommunity().getId(), "LOGIN", "user", user.getId().toString(), Map.of());
        return toMe(user);
    }

    @Transactional
    public MeResponse onboard(UserPrincipal principal, String name) {
        UserAccount user = users.findWithCommunityById(principal.getId()).orElseThrow();
        if (name != null && !name.isBlank()) {
            user.setName(com.sellez.common.TextSanitizer.sanitize(name));
        }
        user.setOnboarded(true);
        users.save(user);
        return toMe(user);
    }

    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String refresh = cookieService.read(request.getCookies(), properties.getSecurity().getRefreshCookieName());
        if (refresh != null) {
            refreshTokens.findByTokenHash(hash(refresh)).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokens.save(token);
            });
        }
        cookieService.clearAuthCookies(response);
    }

    @Transactional
    public MeResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String refresh = cookieService.read(request.getCookies(), properties.getSecurity().getRefreshCookieName());
        if (refresh == null) {
            throw ApiException.unauthorized("Session expired.");
        }
        RefreshToken token = refreshTokens.findByTokenHash(hash(refresh))
                .orElseThrow(() -> ApiException.unauthorized("Session expired."));
        if (token.isRevoked() || token.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.unauthorized("Session expired.");
        }
        token.setRevoked(true);
        refreshTokens.save(token);
        UserAccount user = token.getUser();
        issueSession(user, response);
        return toMe(user);
    }

    public MeResponse me(UserPrincipal principal) {
        UserAccount user = users.findWithCommunityById(principal.getId()).orElseThrow();
        return toMe(user);
    }

    private UserAccount createUser(String email) {
        Community community = communityService.findOrCreate(email);
        UserAccount user = new UserAccount();
        user.setEmail(email);
        user.setAlias(AliasGenerator.alias());
        user.setAvatarColor(AliasGenerator.color());
        user.setCommunity(community);
        user.setRole(UserRole.MEMBER);
        return users.save(user);
    }

    private void issueSession(UserAccount user, HttpServletResponse response) {
        String access = jwtService.createAccessToken(user.getId());
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String refresh = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        RefreshToken entity = new RefreshToken();
        entity.setUser(user);
        entity.setTokenHash(hash(refresh));
        entity.setExpiresAt(Instant.now().plusSeconds(properties.getSecurity().getRefreshTokenDays() * 86400));
        refreshTokens.save(entity);
        cookieService.setAuthCookies(response, access, refresh);
    }

    private String hash(String value) {
        try {
            var digest = java.security.MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank() || !email.contains("@")) {
            throw ApiException.badRequest("Enter a valid work or school email.");
        }
        return email.trim().toLowerCase();
    }

    public MeResponse toMe(UserAccount user) {
        Optional<Ban> active = bans.findFirstByUser_IdAndExpiresAtAfterOrderByExpiresAtDesc(user.getId(), Instant.now());
        BanView banView = active.map(ban -> new BanView(
                ban.getId(),
                ban.isBanPosting(),
                ban.isBanChat(),
                ban.getExpiresAt(),
                DateTimeFormatter.ofPattern("d MMM yyyy").withZone(ZoneId.systemDefault()).format(ban.getExpiresAt())
        )).orElse(null);
        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAlias(),
                user.getAvatarColor(),
                user.getRole().name(),
                user.isOnboarded(),
                user.getRatingAvg(),
                user.getRatingCount(),
                new CommunityView(user.getCommunity().getId(), user.getCommunity().getDomain(), user.getCommunity().getDisplayName()),
                banView
        );
    }

    public record SendOtpRequest(@NotBlank @Email String email) {}
    public record VerifyOtpRequest(@NotBlank @Email String email, @NotBlank String code) {}
    public record OnboardRequest(String name) {}
    public record CommunityView(UUID id, String domain, String displayName) {}
    public record BanView(UUID id, boolean banPosting, boolean banChat, Instant expiresAt, String untilLabel) {}
    public record MeResponse(UUID id, String email, String name, String alias, String avatarColor, String role,
                             boolean onboarded, java.math.BigDecimal ratingAvg, int ratingCount,
                             CommunityView community, BanView ban) {}
}
