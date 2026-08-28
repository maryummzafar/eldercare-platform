package com.eldercare_platform.entity;

import com.eldercare_platform.enums.NotificationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * An in-app notification for one user.
 *
 * Rows are written by NotificationService and read by the client's notification
 * centre. Device push is not wired up yet; when it is, it hangs off the same
 * service method rather than off each call site, so nothing here changes.
 */
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notifications_recipient_created", columnList = "recipient_id, createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 500)
    private String body;

    /** The booking this is about, so the client can deep-link. Null for future non-booking types. */
    private Long bookingId;

    @Builder.Default
    @Column(nullable = false)
    private boolean readFlag = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
