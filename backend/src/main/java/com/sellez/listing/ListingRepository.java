package com.sellez.listing;

import com.sellez.community.Community;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ListingRepository extends JpaRepository<Listing, UUID>, JpaSpecificationExecutor<Listing> {
    @Query("select distinct l from Listing l join fetch l.seller s join fetch s.community left join fetch l.images where l.publicId = :publicId")
    Optional<Listing> findByPublicId(@Param("publicId") String publicId);

    @Query("select distinct l from Listing l join fetch l.seller s join fetch s.community left join fetch l.images where l.seller.id = :sellerId order by l.updatedAt desc")
    List<Listing> findBySeller_IdOrderByUpdatedAtDesc(@Param("sellerId") UUID sellerId);
    long countByCommunityAndStatus(Community community, ListingStatus status);
    long countByCommunityAndStatusAndSoldAtAfter(Community community, ListingStatus status, Instant after);
    long countByStatus(ListingStatus status);
}
