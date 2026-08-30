package com.sellez.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatThreadRepository extends JpaRepository<ChatThread, UUID> {
    Optional<ChatThread> findByListing_IdAndBuyer_Id(UUID listingId, UUID buyerId);

    @Query("select distinct t from ChatThread t join fetch t.listing join fetch t.buyer join fetch t.seller where t.buyer.id = :userId or t.seller.id = :userId order by t.createdAt desc")
    List<ChatThread> findInbox(@Param("userId") UUID userId);

    @Query("select distinct t from ChatThread t join fetch t.listing join fetch t.buyer join fetch t.seller where t.id = :id")
    Optional<ChatThread> findDetailedById(@Param("id") UUID id);

    @Query("select distinct t from ChatThread t join fetch t.listing join fetch t.buyer join fetch t.seller where t.listing.id = :listingId")
    List<ChatThread> findByListing_Id(@Param("listingId") UUID listingId);
}
