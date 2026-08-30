package com.sellez.chat;

import com.sellez.user.UserAccount;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id")
    private ChatThread chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private UserAccount sender;

    @Column(columnDefinition = "text")
    private String body;

    @Column(name = "image_key")
    private String imageKey;

    @Column(nullable = false)
    private boolean system = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
