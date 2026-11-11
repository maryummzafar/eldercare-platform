package com.eldercare_platform.entity;

import com.eldercare_platform.enums.CodePurpose;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * A six-digit code emailed to a user. Only its SHA-256 hash is stored; the code
 * itself exists in the email and nowhere else.
 */
@Entity
@Table(name = "verification_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CodePurpose purpose;

    @Column(nullable = false, length = 64)
    private String codeHash;

    /** Wrong guesses so far. The code is burned once this reaches the limit. */
    @Builder.Default
    @Column(nullable = false)
    private int attempts = 0;

    @Column(nullable = false)
    private Instant expiresAt;

    /** Set when used, or when a newer code replaces it. */
    private Instant consumedAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
