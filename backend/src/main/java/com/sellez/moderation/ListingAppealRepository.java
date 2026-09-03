package com.sellez.moderation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ListingAppealRepository extends JpaRepository<ListingAppeal, UUID> {
    boolean existsByListing_IdAndStatus(UUID listingId, ListingAppealStatus status);
    Optional<ListingAppeal> findTopByListing_IdOrderByCreatedAtDesc(UUID listingId);
    List<ListingAppeal> findAllByOrderByCreatedAtDesc();
    long countByListing_Community_IdAndStatus(UUID communityId, ListingAppealStatus status);
}
