package com.eldercare_platform.entity;

import com.eldercare_platform.enums.BookingStatus;
import com.eldercare_platform.enums.ServiceType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "elder_id", nullable = false)
    private User elder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "helper_id", nullable = false)
    private User helper;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceType serviceType;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.REQUESTED;

    @Column(nullable = false)
    private Instant scheduledStart;

    @Column(nullable = false)
    private Instant scheduledEnd;

    /**
     * The helper's rate copied in at booking time. Snapshotted deliberately: if the helper
     * later raises their rate, already-agreed bookings must still bill at the agreed price.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    /** hourlyRate x scheduled hours, computed when the booking is created. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal estimatedTotal;

    /** Set on completion from the actual elapsed time; null until then. */
    @Column(precision = 10, scale = 2)
    private BigDecimal finalTotal;

    private Instant actualStart;

    private Instant actualEnd;

    /** Where the help is needed — defaults to the elder's address but can be overridden per booking. */
    private String serviceAddress;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
