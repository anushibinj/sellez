package com.sellez.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, UUID> {
    Optional<OtpChallenge> findFirstByEmailAndConsumedFalseOrderByCreatedAtDesc(String email);
    long countByEmailAndCreatedAtAfter(String email, Instant after);
    List<OtpChallenge> findByEmailAndConsumedFalse(String email);
}
