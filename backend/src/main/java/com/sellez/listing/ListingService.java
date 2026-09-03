package com.sellez.listing;

import com.sellez.audit.AuditService;
import com.sellez.common.AliasGenerator;
import com.sellez.common.ApiException;
import com.sellez.common.TextSanitizer;
import com.sellez.config.SellezProperties;
import com.sellez.moderation.BanService;
import com.sellez.moderation.ListingAppeal;
import com.sellez.moderation.ListingAppealRepository;
import com.sellez.moderation.ListingAppealStatus;
import com.sellez.security.UserPrincipal;
import com.sellez.storage.StorageService;
import com.sellez.user.UserAccount;
import com.sellez.user.UserAccountRepository;
import jakarta.persistence.criteria.JoinType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ListingService {
    private final ListingRepository listings;
    private final UserAccountRepository users;
    private final StorageService storage;
    private final SellezProperties properties;
    private final AuditService auditService;
    private final BanService banService;
    private final ListingAppealRepository listingAppeals;

    public ListingService(ListingRepository listings, UserAccountRepository users, StorageService storage,
                          SellezProperties properties, AuditService auditService, BanService banService,
                          ListingAppealRepository listingAppeals) {
        this.listings = listings;
        this.users = users;
        this.storage = storage;
        this.properties = properties;
        this.auditService = auditService;
        this.banService = banService;
        this.listingAppeals = listingAppeals;
    }

    @Transactional
    public ListingResponse create(UserPrincipal principal, ListingUpsertRequest request, List<MultipartFile> files) {
        banService.assertCanPost(principal.getId());
        UserAccount seller = users.findWithCommunityById(principal.getId()).orElseThrow();
        Listing listing = new Listing();
        listing.setPublicId(uniquePublicId());
        listing.setSeller(seller);
        listing.setCommunity(seller.getCommunity());
        listing.setStatus(ListingStatus.DRAFT);
        apply(listing, request);
        attachImages(listing, files, true);
        listings.save(listing);
        auditService.log(principal.getId(), principal.getCommunityId(), "LISTING_CREATED", "listing", listing.getId().toString(), Map.of("publicId", listing.getPublicId()));
        return toResponse(listing, principal, true);
    }

    @Transactional
    public ListingResponse update(UserPrincipal principal, String publicId, ListingUpsertRequest request, List<MultipartFile> files) {
        Listing listing = owned(principal, publicId);
        if (listing.getStatus() == ListingStatus.SOLD) {
            throw ApiException.badRequest("Sold listings cannot be edited.");
        }
        if (listing.getStatus() == ListingStatus.UNDER_REVIEW) {
            throw ApiException.badRequest("Revoke the listing before editing.");
        }
        apply(listing, request);
        if (files != null && !files.isEmpty()) {
            listing.getImages().clear();
            attachImages(listing, files, true);
        }
        listing.setUpdatedAt(Instant.now());
        if (listing.getStatus() == ListingStatus.REJECTED || listing.getStatus() == ListingStatus.TAKEN_DOWN) {
            listing.setStatus(ListingStatus.DRAFT);
            listing.setTakedownReason(null);
        }
        listings.save(listing);
        return toResponse(listing, principal, true);
    }

    @Transactional
    public ListingResponse submit(UserPrincipal principal, String publicId) {
        banService.assertCanPost(principal.getId());
        Listing listing = owned(principal, publicId);
        if (listing.getImages().isEmpty()) {
            throw ApiException.badRequest("Add at least one photo before submitting.");
        }
        if (listing.getStatus() != ListingStatus.DRAFT && listing.getStatus() != ListingStatus.REJECTED) {
            throw ApiException.badRequest("Only drafts can be submitted for review.");
        }
        listing.setStatus(ListingStatus.UNDER_REVIEW);
        listing.setUpdatedAt(Instant.now());
        listings.save(listing);
        auditService.log(principal.getId(), principal.getCommunityId(), "LISTING_SUBMITTED", "listing", listing.getId().toString(), Map.of());
        return toResponse(listing, principal, true);
    }

    @Transactional
    public ListingResponse revoke(UserPrincipal principal, String publicId) {
        Listing listing = owned(principal, publicId);
        if (listing.getStatus() != ListingStatus.UNDER_REVIEW) {
            throw ApiException.badRequest("You can only revoke listings that are under review.");
        }
        listing.setStatus(ListingStatus.REVOKED);
        listing.setUpdatedAt(Instant.now());
        listings.save(listing);
        return toResponse(listing, principal, true);
    }

    @Transactional
    public ListingResponse markSold(UserPrincipal principal, String publicId, ChatBridge chatBridge) {
        Listing listing = owned(principal, publicId);
        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw ApiException.badRequest("Only live listings can be marked sold.");
        }
        listing.setStatus(ListingStatus.SOLD);
        listing.setSoldAt(Instant.now());
        listing.setUpdatedAt(Instant.now());
        listings.save(listing);
        chatBridge.onSold(listing);
        auditService.log(principal.getId(), principal.getCommunityId(), "LISTING_SOLD", "listing", listing.getId().toString(), Map.of());
        return toResponse(listing, principal, true);
    }

    @Transactional(readOnly = true)
    public ListingResponse get(UserPrincipal principal, String publicId) {
        Listing listing = listings.findByPublicId(publicId).orElseThrow(() -> ApiException.notFound("Listing not found."));
        if (!listing.getCommunity().getId().equals(principal.getCommunityId())) {
            throw ApiException.forbidden("This listing belongs to another community.");
        }
        boolean owner = listing.getSeller().getId().equals(principal.getId());
        // Taken-down listings stay reachable by shared link (with a warning banner on the frontend)
        // so a link someone already has doesn't just dead-end into a 404.
        boolean publiclyViewable = listing.getStatus() == ListingStatus.ACTIVE || listing.getStatus() == ListingStatus.SOLD
                || listing.getStatus() == ListingStatus.TAKEN_DOWN;
        if (!owner && !publiclyViewable) {
            throw ApiException.notFound("Listing not found.");
        }
        return toResponse(listing, principal, owner);
    }

    @Transactional(readOnly = true)
    public Page<ListingCard> browse(UserPrincipal principal, String q, List<ListingCategory> categories, BigDecimal minPrice,
                                    BigDecimal maxPrice, String sort, int page, int size) {
        Specification<Listing> spec = (root, query, cb) -> {
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("seller", JoinType.LEFT);
            }
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(cb.equal(root.get("community").get("id"), principal.getCommunityId()));
            predicates.add(root.get("status").in(ListingStatus.ACTIVE, ListingStatus.SOLD));
            if (q != null && !q.isBlank()) {
                String like = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(cb.like(cb.lower(root.get("title")), like), cb.like(cb.lower(root.get("description")), like)));
            }
            if (categories != null && !categories.isEmpty()) {
                predicates.add(root.get("category").in(categories));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        Sort springSort = switch (sort == null ? "newest" : sort) {
            case "updated" -> Sort.by(Sort.Direction.DESC, "updatedAt");
            case "rating" -> Sort.by(Sort.Direction.DESC, "seller.ratingAvg");
            case "price_asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc" -> Sort.by(Sort.Direction.DESC, "price");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
        return listings.findAll(spec, PageRequest.of(page, Math.min(size, 40), springSort)).map(l -> toCard(l, principal));
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> mine(UserPrincipal principal) {
        return listings.findBySeller_IdOrderByUpdatedAtDesc(principal.getId()).stream()
                .map(l -> toResponse(l, principal, true))
                .toList();
    }

    @Transactional
    public void appealTakedown(UserPrincipal principal, String publicId, String message) {
        if (message == null || message.isBlank()) {
            throw ApiException.badRequest("A message is required.");
        }
        Listing listing = owned(principal, publicId);
        if (listing.getStatus() != ListingStatus.TAKEN_DOWN) {
            throw ApiException.badRequest("Only taken-down listings can be appealed.");
        }
        if (listingAppeals.existsByListing_IdAndStatus(listing.getId(), ListingAppealStatus.PENDING)) {
            throw ApiException.badRequest("You already have a pending appeal for this listing.");
        }
        ListingAppeal appeal = new ListingAppeal();
        appeal.setListing(listing);
        appeal.setSubmittedBy(users.getReferenceById(principal.getId()));
        appeal.setMessage(TextSanitizer.sanitize(message));
        listingAppeals.save(appeal);
        auditService.log(principal.getId(), principal.getCommunityId(), "LISTING_APPEAL_SUBMITTED", "listing", listing.getId().toString(), Map.of());
    }

    Listing owned(UserPrincipal principal, String publicId) {
        Listing listing = listings.findByPublicId(publicId).orElseThrow(() -> ApiException.notFound("Listing not found."));
        if (!listing.getSeller().getId().equals(principal.getId())) {
            throw ApiException.forbidden("You can only manage your own listings.");
        }
        return listing;
    }

    private void apply(Listing listing, ListingUpsertRequest request) {
        listing.setTitle(TextSanitizer.sanitize(request.title()));
        listing.setDescription(TextSanitizer.sanitize(request.description()));
        listing.setPrice(request.price());
        listing.setCurrency(resolveCurrency(request.currency()));
        listing.setCategory(request.category());
        listing.setCondition(request.condition());
        listing.setLocation(TextSanitizer.sanitize(request.location()));
    }

    private void attachImages(Listing listing, List<MultipartFile> files, boolean required) {
        if (files == null) {
            files = List.of();
        }
        files = files.stream().filter(f -> f != null && !f.isEmpty()).toList();
        if (required && files.isEmpty() && listing.getImages().isEmpty()) {
            throw ApiException.badRequest("Add at least one photo.");
        }
        if (files.size() > properties.getListing().getMaxImages()) {
            throw ApiException.badRequest("You can upload up to " + properties.getListing().getMaxImages() + " photos.");
        }
        int order = 0;
        for (MultipartFile file : files) {
            ListingImage image = new ListingImage();
            image.setListing(listing);
            image.setStorageKey(storage.store(file));
            image.setSortOrder(order++);
            listing.getImages().add(image);
        }
    }

    private String uniquePublicId() {
        for (int i = 0; i < 8; i++) {
            String id = AliasGenerator.publicId();
            if (listings.findByPublicId(id).isEmpty()) {
                return id;
            }
        }
        return AliasGenerator.publicId() + AliasGenerator.publicId().substring(0, 2);
    }

    private String resolveCurrency(String raw) {
        String fallback = properties.getListing().getDefaultCurrency() == null
                ? "USD"
                : properties.getListing().getDefaultCurrency().trim().toUpperCase();
        String code = (raw == null || raw.isBlank()) ? fallback : raw.trim().toUpperCase();
        if (!code.matches("[A-Z]{3}") || !properties.getListing().allowedCurrencies().contains(code)) {
            throw ApiException.badRequest("Choose a supported currency.");
        }
        return code;
    }

    public CurrencyOptions currencyOptions() {
        return new CurrencyOptions(properties.getListing().allowedCurrencies(),
                resolveCurrency(properties.getListing().getDefaultCurrency()));
    }

    ListingResponse toResponse(Listing listing, UserPrincipal principal, boolean owner) {
        SellerPublic seller = new SellerPublic(listing.getSeller().getAlias(), listing.getSeller().getAvatarColor(),
                listing.getSeller().getRatingAvg(), listing.getSeller().getRatingCount());
        List<String> images = listing.getImages().stream().map(img -> storage.publicUrl(img.getStorageKey())).toList();
        boolean takenDown = listing.getStatus() == ListingStatus.TAKEN_DOWN;
        // The moderation reason is only shown to the owner — a shared link only needs to know the
        // listing is gone, not the specific admin note behind it.
        String reasonForViewer = owner ? listing.getTakedownReason() : null;
        String appealStatus = owner && takenDown
                ? listingAppeals.findTopByListing_IdOrderByCreatedAtDesc(listing.getId()).map(a -> a.getStatus().name()).orElse(null)
                : null;
        return new ListingResponse(
                listing.getPublicId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPrice(),
                listing.getCurrency() == null ? "USD" : listing.getCurrency(),
                listing.getCategory().name(),
                listing.getCondition().name(),
                listing.getLocation(),
                listing.getStatus().name(),
                listing.getCreatedAt(),
                listing.getUpdatedAt(),
                listing.getSoldAt(),
                seller,
                images,
                owner,
                listing.getCommunity().getDisplayName(),
                reasonForViewer,
                appealStatus
        );
    }

    ListingCard toCard(Listing listing, UserPrincipal principal) {
        String cover = listing.getImages().isEmpty() ? null : storage.publicUrl(listing.getImages().get(0).getStorageKey());
        return new ListingCard(
                listing.getPublicId(),
                listing.getTitle(),
                listing.getPrice(),
                listing.getCurrency() == null ? "USD" : listing.getCurrency(),
                listing.getCategory().name(),
                listing.getCondition().name(),
                listing.getStatus().name(),
                listing.getCreatedAt(),
                listing.getUpdatedAt(),
                cover,
                listing.getSeller().getAlias(),
                listing.getSeller().getAvatarColor(),
                listing.getSeller().getRatingAvg(),
                listing.getSeller().getId().equals(principal.getId())
        );
    }

    public record ListingUpsertRequest(
            @NotBlank @Size(max = 120) String title,
            @NotBlank @Size(max = 4000) String description,
            @NotNull @Positive BigDecimal price,
            String currency,
            @NotNull ListingCategory category,
            @NotNull ItemCondition condition,
            @Size(max = 120) String location
    ) {}

    public record SellerPublic(String alias, String avatarColor, java.math.BigDecimal ratingAvg, int ratingCount) {}
    public record ListingResponse(String publicId, String title, String description, BigDecimal price, String currency, String category,
                                  String condition, String location, String status, Instant createdAt, Instant updatedAt,
                                  Instant soldAt, SellerPublic seller, List<String> images, boolean owner, String communityName,
                                  String takedownReason, String appealStatus) {}
    public record ListingCard(String publicId, String title, BigDecimal price, String currency, String category, String condition, String status,
                              Instant createdAt, Instant updatedAt, String coverImage, String sellerAlias, String sellerColor,
                              java.math.BigDecimal sellerRating, boolean owner) {}
    public record CurrencyOptions(List<String> currencies, String defaultCurrency) {}
    public record AppealRequest(@NotBlank String message) {}

    public interface ChatBridge {
        void onSold(Listing listing);
    }
}
