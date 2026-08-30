package com.sellez.rating;

import com.sellez.listing.Listing;
import com.sellez.user.UserAccount;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "ratings")
public class Rating {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    private Listing listing;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "rater_id")
    private UserAccount rater;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "ratee_id")
    private UserAccount ratee;

    @Column(nullable = false)
    private int stars;

    @Column(columnDefinition = "text")
    private String review;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();
}
