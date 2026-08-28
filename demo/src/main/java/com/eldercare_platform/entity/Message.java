package com.eldercare_platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * One chat message inside a booking.
 *
 * Chat is deliberately scoped to a booking rather than being free-form user-to-user:
 * it means "may these two people talk?" is already answered by whether they are both
 * participants in the booking, so there is no separate contacts or blocking model to
 * get wrong. An elder cannot message a helper they have never booked.
 */
@Entity
@Table(name = "messages", indexes = {
        @Index(name = "idx_messages_booking_created", columnList = "booking_id, createdAt")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(nullable = false, length = 2000)
    private String body;

    /** Null until the other participant opens the thread. */
    private Instant readAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
