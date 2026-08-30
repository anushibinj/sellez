package com.sellez.chat;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    Page<ChatMessage> findByChat_IdOrderByCreatedAtAsc(UUID chatId, Pageable pageable);
    List<ChatMessage> findByChat_IdOrderByCreatedAtAsc(UUID chatId);
}
