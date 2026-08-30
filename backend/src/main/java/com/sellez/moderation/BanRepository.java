package com.sellez.moderation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BanRepository extends JpaRepository<Ban, UUID> {
    Optional<Ban> findFirstByUser_IdAndExpiresAtAfterOrderByExpiresAtDesc(UUID userId, Instant now);
    List<Ban> findByUser_IdOrderByCreatedAtDesc(UUID userId);
    List<Ban> findByNotifiedExpiredFalseAndExpiresAtBefore(Instant now);
    long countByCommunity_IdAndExpiresAtAfter(UUID communityId, Instant now);
}
