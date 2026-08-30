package com.sellez.moderation;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AppealRepository extends JpaRepository<Appeal, UUID> {
    List<Appeal> findByStatusOrderByCreatedAtDesc(AppealStatus status);
    List<Appeal> findByUser_IdOrderByCreatedAtDesc(UUID userId);
}
