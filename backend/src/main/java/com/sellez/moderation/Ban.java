package com.sellez.moderation;

import com.sellez.community.Community;
import com.sellez.user.UserAccount;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "bans")
public class Ban {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserAccount user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "community_id")
    private Community community;

    @Column(name = "ban_posting", nullable = false)
    private boolean banPosting;

    @Column(name = "ban_chat", nullable = false)
    private boolean banChat;

    private String reason;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserAccount createdBy;

    @Column(name = "notified_expired", nullable = false)
    private boolean notifiedExpired = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
