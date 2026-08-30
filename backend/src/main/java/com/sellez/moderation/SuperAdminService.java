package com.sellez.moderation;

import com.sellez.audit.AuditLog;
import com.sellez.audit.AuditLogRepository;
import com.sellez.audit.AuditService;
import com.sellez.common.ApiException;
import com.sellez.community.Community;
import com.sellez.community.CommunityRepository;
import com.sellez.email.NotificationService;
import com.sellez.listing.ListingRepository;
import com.sellez.listing.ListingStatus;
import com.sellez.security.UserPrincipal;
import com.sellez.storage.StorageService;
import com.sellez.user.UserAccount;
import com.sellez.user.UserAccountRepository;
import com.sellez.user.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SuperAdminService {
    private final BanService banService;
    private final CommunityRepository communities;
    private final UserAccountRepository users;
    private final ListingRepository listings;
    private final AppealRepository appeals;
    private final AuditLogRepository auditLogs;
    private final BanRepository bans;
    private final NotificationService notifications;
    private final AuditService auditService;
    private final StorageService storage;

    public SuperAdminService(BanService banService, CommunityRepository communities, UserAccountRepository users,
                             ListingRepository listings, AppealRepository appeals, AuditLogRepository auditLogs,
                             BanRepository bans, NotificationService notifications, AuditService auditService,
                             StorageService storage) {
        this.banService = banService;
        this.communities = communities;
        this.users = users;
        this.listings = listings;
        this.appeals = appeals;
        this.auditLogs = auditLogs;
        this.bans = bans;
        this.notifications = notifications;
        this.auditService = auditService;
        this.storage = storage;
    }

    public GlobalDashboard dashboard(UserPrincipal principal) {
        banService.requireSuperAdmin(principal);
        return new GlobalDashboard(
                communities.count(),
                users.count(),
                listings.count(),
                listings.countByStatus(ListingStatus.ACTIVE),
                appeals.findByStatusOrderByCreatedAtDesc(AppealStatus.PENDING).size(),
                0
        );
    }

    public List<CommunityHealth> communities(UserPrincipal principal) {
        banService.requireSuperAdmin(principal);
        return communities.findAll().stream().map(c -> new CommunityHealth(
                c.getId(), c.getDomain(), c.getDisplayName(), c.getCreatedAt(),
                users.findByCommunityId(c.getId()).size(),
                listings.countByCommunityAndStatus(c, ListingStatus.ACTIVE)
        )).toList();
    }

    @Transactional
    public void promote(UserPrincipal principal, UUID communityId, UUID userId) {
        banService.requireSuperAdmin(principal);
        UserAccount user = users.findWithCommunityById(userId).orElseThrow(() -> ApiException.notFound("User not found."));
        if (!user.getCommunity().getId().equals(communityId)) {
            throw ApiException.badRequest("User is not in that community.");
        }
        user.setRole(UserRole.COMMUNITY_ADMIN);
        users.save(user);
        auditService.log(principal.getId(), communityId, "ADMIN_PROMOTION", "user", user.getId().toString(), Map.of());
    }

    @Transactional
    public void demote(UserPrincipal principal, UUID communityId, UUID userId) {
        banService.requireSuperAdmin(principal);
        UserAccount user = users.findWithCommunityById(userId).orElseThrow(() -> ApiException.notFound("User not found."));
        if (user.getRole() == UserRole.SUPER_ADMIN) {
            throw ApiException.badRequest("Cannot demote a super admin.");
        }
        user.setRole(UserRole.MEMBER);
        users.save(user);
        auditService.log(principal.getId(), communityId, "ADMIN_REMOVED", "user", user.getId().toString(), Map.of());
    }

    public List<AppealView> appeals(UserPrincipal principal) {
        banService.requireSuperAdmin(principal);
        return appeals.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toAppeal)
                .toList();
    }

    @Transactional
    public AppealView resolve(UserPrincipal principal, UUID appealId, boolean approve, String note) {
        banService.requireSuperAdmin(principal);
        Appeal appeal = appeals.findById(appealId).orElseThrow(() -> ApiException.notFound("Appeal not found."));
        appeal.setStatus(approve ? AppealStatus.APPROVED : AppealStatus.DENIED);
        appeal.setReviewedBy(users.getReferenceById(principal.getId()));
        appeal.setResolutionNote(com.sellez.common.TextSanitizer.sanitize(note));
        if (approve) {
            Ban ban = appeal.getBan();
            ban.setExpiresAt(Instant.now());
            bans.save(ban);
        }
        appeals.save(appeal);
        notifications.appealResolved(appeal.getUser().getEmail(), appeal.getStatus().name(), appeal.getResolutionNote());
        auditService.log(principal.getId(), appeal.getUser().getCommunity().getId(), "APPEAL_RESOLVED", "appeal", appeal.getId().toString(), Map.of("status", appeal.getStatus().name()));
        return toAppeal(appeal);
    }

    public Page<AuditView> audit(UserPrincipal principal, String event, int page, int size) {
        banService.requireSuperAdmin(principal);
        Page<AuditLog> result = (event == null || event.isBlank())
                ? auditLogs.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size))
                : auditLogs.findByEventTypeContainingIgnoreCaseOrderByCreatedAtDesc(event, PageRequest.of(page, size));
        return result.map(log -> new AuditView(log.getId(), log.getEventType(), log.getEntityType(), log.getEntityId(),
                log.getMetadata(), log.getCreatedAt()));
    }

    @Transactional
    public AppealView createAppeal(UserPrincipal principal, String message, MultipartFile evidence) {
        Ban ban = bans.findFirstByUser_IdAndExpiresAtAfterOrderByExpiresAtDesc(principal.getId(), Instant.now())
                .orElseThrow(() -> ApiException.badRequest("You do not have an active restriction to appeal."));
        Appeal appeal = new Appeal();
        appeal.setBan(ban);
        appeal.setUser(users.getReferenceById(principal.getId()));
        appeal.setMessage(com.sellez.common.TextSanitizer.sanitize(message));
        if (evidence != null && !evidence.isEmpty()) {
            appeal.setEvidenceKey(storage.store(evidence));
        }
        appeals.save(appeal);
        auditService.log(principal.getId(), principal.getCommunityId(), "APPEAL", "appeal", appeal.getId().toString(), Map.of());
        return toAppeal(appeal);
    }

    private AppealView toAppeal(Appeal appeal) {
        return new AppealView(
                appeal.getId(),
                appeal.getStatus().name(),
                appeal.getMessage(),
                storage.publicUrl(appeal.getEvidenceKey()),
                appeal.getCreatedAt(),
                appeal.getBan().getExpiresAt(),
                appeal.getUser().getAlias(),
                appeal.getResolutionNote()
        );
    }

    public record GlobalDashboard(long communities, long users, long listings, long activeListings, long pendingAppeals, long revenue) {}
    public record CommunityHealth(UUID id, String domain, String displayName, Instant createdAt, long members, long activeListings) {}
    public record AppealView(UUID id, String status, String message, String evidenceUrl, Instant createdAt, Instant banExpiresAt, String userAlias, String resolutionNote) {}
    public record AuditView(UUID id, String eventType, String entityType, String entityId, Map<String, Object> metadata, Instant createdAt) {}
    public record ResolveRequest(boolean approve, String note) {}
}
