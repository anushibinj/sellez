package com.sellez.moderation;

import com.sellez.audit.AuditService;
import com.sellez.common.ApiException;
import com.sellez.common.TextSanitizer;
import com.sellez.community.Community;
import com.sellez.community.CommunityRepository;
import com.sellez.email.NotificationService;
import com.sellez.listing.Listing;
import com.sellez.listing.ListingCategory;
import com.sellez.listing.ListingRepository;
import com.sellez.listing.ListingStatus;
import com.sellez.report.Report;
import com.sellez.report.ReportRepository;
import com.sellez.report.ReportStatus;
import com.sellez.security.UserPrincipal;
import com.sellez.storage.StorageService;
import com.sellez.user.UserAccount;
import com.sellez.user.UserAccountRepository;
import com.sellez.user.UserRole;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AdminService {
    private final BanService banService;
    private final ListingRepository listings;
    private final UserAccountRepository users;
    private final BanRepository bans;
    private final ReportRepository reports;
    private final NotificationService notifications;
    private final AuditService auditService;
    private final CommunityRepository communities;
    private final StorageService storage;
    private final ListingAppealRepository listingAppeals;

    public AdminService(BanService banService, ListingRepository listings, UserAccountRepository users, BanRepository bans,
                        ReportRepository reports, NotificationService notifications, AuditService auditService,
                        CommunityRepository communities, StorageService storage, ListingAppealRepository listingAppeals) {
        this.banService = banService;
        this.listings = listings;
        this.users = users;
        this.bans = bans;
        this.reports = reports;
        this.notifications = notifications;
        this.auditService = auditService;
        this.communities = communities;
        this.storage = storage;
        this.listingAppeals = listingAppeals;
    }

    public Dashboard dashboard(UserPrincipal principal) {
        banService.requireCommunityAdmin(principal);
        Community community = communities.findById(principal.getCommunityId()).orElseThrow();
        Instant startOfDay = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        return new Dashboard(
                listings.countByCommunityAndStatus(community, ListingStatus.ACTIVE),
                listings.countByCommunityAndStatus(community, ListingStatus.UNDER_REVIEW),
                listings.countByCommunityAndStatusAndSoldAtAfter(community, ListingStatus.SOLD, startOfDay),
                reports.countByStatus(ReportStatus.OPEN),
                bans.countByCommunity_IdAndExpiresAtAfter(community.getId(), Instant.now()),
                listingAppeals.countByListing_Community_IdAndStatus(community.getId(), ListingAppealStatus.PENDING)
        );
    }

    @Transactional(readOnly = true)
    public List<ListingServiceView> queue(UserPrincipal principal, ListingStatus status) {
        banService.requireCommunityAdmin(principal);
        // No status filter means "every listing in my community" — used by the admin's all-listings view.
        return listings.findAll().stream()
                .filter(l -> l.getCommunity().getId().equals(principal.getCommunityId()))
                .filter(l -> status == null || l.getStatus() == status)
                .sorted(Comparator.comparing(Listing::getUpdatedAt).reversed())
                .map(this::toView)
                .toList();
    }

    @Transactional
    public ListingServiceView approve(UserPrincipal principal, String publicId) {
        Listing listing = moderate(principal, publicId);
        listing.setStatus(ListingStatus.ACTIVE);
        listing.setUpdatedAt(Instant.now());
        listings.save(listing);
        notifications.listingApproved(listing.getSeller().getEmail(), listing.getTitle());
        auditService.log(principal.getId(), principal.getCommunityId(), "LISTING_APPROVED", "listing", listing.getId().toString(), Map.of());
        return toView(listing);
    }

    @Transactional
    public ListingServiceView reject(UserPrincipal principal, String publicId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw ApiException.badRequest("A rejection reason is required.");
        }
        Listing listing = moderate(principal, publicId);
        listing.setStatus(ListingStatus.REJECTED);
        listing.setUpdatedAt(Instant.now());
        listings.save(listing);
        String sanitized = TextSanitizer.sanitize(reason);
        notifications.listingRejected(listing.getSeller().getEmail(), listing.getTitle(), sanitized);
        auditService.log(principal.getId(), principal.getCommunityId(), "LISTING_REJECTED", "listing", listing.getId().toString(), Map.of("reason", sanitized));
        return toView(listing);
    }

    @Transactional
    public ListingServiceView returnListing(UserPrincipal principal, String publicId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw ApiException.badRequest("A return reason is required.");
        }
        Listing listing = moderate(principal, publicId);
        listing.setStatus(ListingStatus.DRAFT);
        listing.setUpdatedAt(Instant.now());
        listings.save(listing);
        String sanitized = TextSanitizer.sanitize(reason);
        notifications.listingReturned(listing.getSeller().getEmail(), listing.getTitle(), sanitized);
        auditService.log(principal.getId(), principal.getCommunityId(), "LISTING_RETURNED", "listing", listing.getId().toString(), Map.of("reason", sanitized));
        return toView(listing);
    }

    @Transactional
    public ListingServiceView takeDown(UserPrincipal principal, String publicId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw ApiException.badRequest("A takedown reason is required.");
        }
        Listing listing = moderate(principal, publicId);
        if (listing.getStatus() != ListingStatus.ACTIVE && listing.getStatus() != ListingStatus.SOLD) {
            throw ApiException.badRequest("Only active or sold listings can be taken down.");
        }
        String sanitized = TextSanitizer.sanitize(reason);
        listing.setStatus(ListingStatus.TAKEN_DOWN);
        listing.setTakedownReason(sanitized);
        listing.setUpdatedAt(Instant.now());
        listings.save(listing);
        String priceLabel = listing.getCurrency() + " " + listing.getPrice();
        notifications.listingTakenDown(listing.getSeller().getEmail(), listing.getTitle(), priceLabel, sanitized);
        auditService.log(principal.getId(), principal.getCommunityId(), "LISTING_TAKEN_DOWN", "listing", listing.getId().toString(), Map.of("reason", sanitized));
        return toView(listing);
    }

    @Transactional
    public ListingServiceView restore(UserPrincipal principal, String publicId) {
        Listing listing = moderate(principal, publicId);
        if (listing.getStatus() != ListingStatus.TAKEN_DOWN) {
            throw ApiException.badRequest("Only taken-down listings can be restored.");
        }
        listing.setStatus(ListingStatus.ACTIVE);
        listing.setTakedownReason(null);
        listing.setUpdatedAt(Instant.now());
        listings.save(listing);
        notifications.listingRestored(listing.getSeller().getEmail(), listing.getTitle());
        auditService.log(principal.getId(), principal.getCommunityId(), "LISTING_RESTORED", "listing", listing.getId().toString(), Map.of());
        return toView(listing);
    }

    @Transactional
    public ListingServiceView updateCategory(UserPrincipal principal, String publicId, ListingCategory category) {
        Listing listing = moderate(principal, publicId);
        listing.setCategory(category);
        listing.setUpdatedAt(Instant.now());
        listings.save(listing);
        auditService.log(principal.getId(), principal.getCommunityId(), "LISTING_CATEGORY_UPDATED", "listing", listing.getId().toString(), Map.of("category", category.name()));
        return toView(listing);
    }

    @Transactional
    public void ban(UserPrincipal principal, UUID userId, BanRequest request) {
        banService.requireCommunityAdmin(principal);
        UserAccount target = users.findWithCommunityById(userId).orElseThrow(() -> ApiException.notFound("User not found."));
        if (!target.getCommunity().getId().equals(principal.getCommunityId()) && principal.getRole() != UserRole.SUPER_ADMIN) {
            throw ApiException.forbidden("You can only moderate members of your community.");
        }
        if (target.getId().equals(principal.getId())) {
            throw ApiException.badRequest("You cannot ban yourself.");
        }
        boolean posting = "POST".equalsIgnoreCase(request.type()) || "BOTH".equalsIgnoreCase(request.type());
        boolean chat = "CHAT".equalsIgnoreCase(request.type()) || "BOTH".equalsIgnoreCase(request.type());
        if (!posting && !chat) {
            throw ApiException.badRequest("Choose POST, CHAT, or BOTH.");
        }
        Ban ban = new Ban();
        ban.setUser(target);
        ban.setCommunity(target.getCommunity());
        ban.setBanPosting(posting);
        ban.setBanChat(chat);
        ban.setReason(TextSanitizer.sanitize(request.reason()));
        ban.setExpiresAt(Instant.now().plusSeconds(request.days() * 86400L));
        ban.setCreatedBy(users.getReferenceById(principal.getId()));
        bans.save(ban);
        String until = DateTimeFormatter.ofPattern("d MMM yyyy").withZone(java.time.ZoneId.systemDefault()).format(ban.getExpiresAt());
        String type = posting && chat ? "posting and chat" : posting ? "posting" : "chat";
        notifications.banned(target.getEmail(), until, type);
        auditService.log(principal.getId(), principal.getCommunityId(), "BAN", "user", target.getId().toString(), Map.of("days", request.days(), "type", request.type()));
    }

    @Transactional(readOnly = true)
    public List<MemberView> members(UserPrincipal principal) {
        banService.requireCommunityAdmin(principal);
        return users.findByCommunityId(principal.getCommunityId()).stream()
                .map(u -> new MemberView(u.getId(), u.getAlias(), u.getAvatarColor(), u.getRole().name(), u.getRatingAvg(), u.getRatingCount()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ListingAppealView> listingAppeals(UserPrincipal principal) {
        banService.requireCommunityAdmin(principal);
        return listingAppeals.findAllByOrderByCreatedAtDesc().stream()
                .filter(a -> principal.getRole() == UserRole.SUPER_ADMIN
                        || a.getListing().getCommunity().getId().equals(principal.getCommunityId()))
                .map(this::toAppealView)
                .toList();
    }

    @Transactional
    public ListingAppealView resolveListingAppeal(UserPrincipal principal, UUID appealId, boolean approve, String note) {
        banService.requireCommunityAdmin(principal);
        ListingAppeal appeal = listingAppeals.findById(appealId).orElseThrow(() -> ApiException.notFound("Appeal not found."));
        Listing listing = appeal.getListing();
        if (!listing.getCommunity().getId().equals(principal.getCommunityId()) && principal.getRole() != UserRole.SUPER_ADMIN) {
            throw ApiException.forbidden("This appeal is outside your community.");
        }
        if (appeal.getStatus() != ListingAppealStatus.PENDING) {
            throw ApiException.badRequest("This appeal was already resolved.");
        }
        String sanitizedNote = note == null || note.isBlank() ? null : TextSanitizer.sanitize(note);
        appeal.setStatus(approve ? ListingAppealStatus.APPROVED : ListingAppealStatus.DENIED);
        appeal.setReviewedBy(users.getReferenceById(principal.getId()));
        appeal.setResolutionNote(sanitizedNote);
        if (approve && listing.getStatus() == ListingStatus.TAKEN_DOWN) {
            listing.setStatus(ListingStatus.ACTIVE);
            listing.setTakedownReason(null);
            listing.setUpdatedAt(Instant.now());
            listings.save(listing);
        }
        listingAppeals.save(appeal);
        notifications.listingAppealResolved(listing.getSeller().getEmail(), listing.getTitle(), appeal.getStatus().name(), sanitizedNote);
        auditService.log(principal.getId(), principal.getCommunityId(), "LISTING_APPEAL_RESOLVED", "listing", listing.getId().toString(), Map.of("status", appeal.getStatus().name()));
        return toAppealView(appeal);
    }

    private ListingAppealView toAppealView(ListingAppeal appeal) {
        Listing listing = appeal.getListing();
        return new ListingAppealView(appeal.getId(), listing.getPublicId(), listing.getTitle(), listing.getPrice(),
                listing.getCurrency() == null ? "USD" : listing.getCurrency(), listing.getTakedownReason(),
                appeal.getMessage(), appeal.getStatus().name(), listing.getSeller().getAlias(), appeal.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<ReportView> openReports(UserPrincipal principal) {
        banService.requireCommunityAdmin(principal);
        return reports.findByStatusOrderByCreatedAtDesc(ReportStatus.OPEN).stream()
                .filter(r -> r.getReporter().getCommunity().getId().equals(principal.getCommunityId()))
                .map(r -> new ReportView(r.getId(), r.getReason().name(), r.getDetails(), r.getStatus().name(),
                        r.getListing() == null ? null : r.getListing().getPublicId(),
                        r.getChat() == null ? null : r.getChat().getId(),
                        r.getCreatedAt()))
                .toList();
    }

    private Listing moderate(UserPrincipal principal, String publicId) {
        banService.requireCommunityAdmin(principal);
        Listing listing = listings.findByPublicId(publicId).orElseThrow(() -> ApiException.notFound("Listing not found."));
        if (!listing.getCommunity().getId().equals(principal.getCommunityId()) && principal.getRole() != UserRole.SUPER_ADMIN) {
            throw ApiException.forbidden("This listing is outside your community.");
        }
        return listing;
    }

    private ListingServiceView toView(Listing listing) {
        List<String> images = listing.getImages().stream().map(img -> storage.publicUrl(img.getStorageKey())).toList();
        return new ListingServiceView(listing.getPublicId(), listing.getTitle(), listing.getDescription(),
                listing.getPrice(), listing.getCurrency() == null ? "USD" : listing.getCurrency(),
                listing.getCategory().name(), images, listing.getStatus().name(),
                listing.getSeller().getAlias(), listing.getCreatedAt(), listing.getUpdatedAt(), listing.getTakedownReason());
    }

    public record Dashboard(long activeListings, long pendingReview, long soldToday, long openReports, long bannedUsers, long pendingListingAppeals) {}
    public record ListingServiceView(String publicId, String title, String description, java.math.BigDecimal price,
                                     String currency, String category, List<String> images, String status,
                                     String sellerAlias, Instant createdAt, Instant updatedAt, String takedownReason) {}
    public record BanRequest(String type, @Min(1) @Max(10) int days, @NotBlank String reason) {}
    public record MemberView(UUID id, String alias, String avatarColor, String role, java.math.BigDecimal ratingAvg, int ratingCount) {}
    public record ReportView(UUID id, String reason, String details, String status, String listingPublicId, UUID chatId, Instant createdAt) {}
    public record ReasonRequest(@NotBlank String reason) {}
    public record CategoryRequest(@NotNull ListingCategory category) {}
    public record ListingAppealView(UUID id, String listingPublicId, String listingTitle, java.math.BigDecimal listingPrice,
                                    String listingCurrency, String takedownReason, String message, String status,
                                    String sellerAlias, Instant createdAt) {}
    public record ResolveListingAppealRequest(boolean approve, String note) {}
}
