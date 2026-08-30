package com.sellez.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MessageReadRepository extends JpaRepository<MessageRead, MessageReadId> {
    long countByMessage_Chat_IdAndUser_Id(UUID chatId, UUID userId);
    boolean existsByMessage_IdAndUser_Id(UUID messageId, UUID userId);
}
