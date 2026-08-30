package com.sellez.chat;

import com.sellez.user.UserAccount;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "message_reads")
@IdClass(MessageReadId.class)
public class MessageRead {
    @Id
    @ManyToOne(optional = false)
    @JoinColumn(name = "message_id")
    private ChatMessage message;

    @Id
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private UserAccount user;

    @Column(name = "read_at", nullable = false)
    private Instant readAt = Instant.now();
}
