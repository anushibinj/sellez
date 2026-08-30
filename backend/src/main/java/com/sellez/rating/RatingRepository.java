package com.sellez.rating;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RatingRepository extends JpaRepository<Rating, UUID> {
    boolean existsByListing_IdAndRater_Id(UUID listingId, UUID raterId);
    Optional<Rating> findByListing_IdAndRater_Id(UUID listingId, UUID raterId);
}
