package com.sellez.rating;

import com.sellez.chat.ChatThreadRepository;
import com.sellez.common.ApiException;
import com.sellez.common.TextSanitizer;
import com.sellez.listing.Listing;
import com.sellez.listing.ListingRepository;
import com.sellez.listing.ListingStatus;
import com.sellez.security.UserPrincipal;
import com.sellez.user.UserAccount;
import com.sellez.user.UserAccountRepository;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
public class RatingService {
    private final RatingRepository ratings;
    private final ListingRepository listings;
    private final ChatThreadRepository chats;
    private final UserAccountRepository users;

    public RatingService(RatingRepository ratings, ListingRepository listings, ChatThreadRepository chats, UserAccountRepository users) {
        this.ratings = ratings;
        this.listings = listings;
        this.chats = chats;
        this.users = users;
    }

    @Transactional
    public RatingView create(UserPrincipal principal, CreateRatingRequest request) {
        Listing listing = listings.findByPublicId(request.listingPublicId()).orElseThrow(() -> ApiException.notFound("Listing not found."));
        if (listing.getStatus() != ListingStatus.SOLD) {
            throw ApiException.badRequest("You can rate only after an item is sold.");
        }
        if (listing.getSeller().getId().equals(principal.getId())) {
            throw ApiException.badRequest("Sellers cannot rate themselves.");
        }
        boolean participant = chats.findByListing_Id(listing.getId()).stream()
                .anyMatch(c -> c.getBuyer().getId().equals(principal.getId()));
        if (!participant) {
            throw ApiException.forbidden("Only the buyer in this conversation can leave a rating.");
        }
        if (ratings.existsByListing_IdAndRater_Id(listing.getId(), principal.getId())) {
            throw ApiException.conflict("You already rated this listing.");
        }
        Rating rating = new Rating();
        rating.setListing(listing);
        rating.setRater(users.getReferenceById(principal.getId()));
        rating.setRatee(listing.getSeller());
        rating.setStars(request.stars());
        rating.setReview(TextSanitizer.sanitize(request.review()));
        ratings.save(rating);

        UserAccount seller = users.findWithCommunityById(listing.getSeller().getId()).orElseThrow();
        int count = seller.getRatingCount() + 1;
        BigDecimal total = seller.getRatingAvg().multiply(BigDecimal.valueOf(seller.getRatingCount())).add(BigDecimal.valueOf(request.stars()));
        seller.setRatingCount(count);
        seller.setRatingAvg(total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP));
        users.save(seller);
        return new RatingView(rating.getId(), rating.getStars(), rating.getReview());
    }

    @Transactional(readOnly = true)
    public RatingView mine(UserPrincipal principal, String listingPublicId) {
        Listing listing = listings.findByPublicId(listingPublicId).orElseThrow(() -> ApiException.notFound("Listing not found."));
        return ratings.findByListing_IdAndRater_Id(listing.getId(), principal.getId())
                .map(r -> new RatingView(r.getId(), r.getStars(), r.getReview()))
                .orElse(null);
    }

    public record CreateRatingRequest(@NotNull String listingPublicId, @Min(1) @Max(5) int stars, String review) {}
    public record RatingView(UUID id, int stars, String review) {}
}
