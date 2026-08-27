package com.eldercare_platform.entity;

import com.eldercare_platform.enums.ServiceType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

/**
 * The student-helper side of a {@link User} with role HELPER: what they charge,
 * what they offer, and where they work. Elders search against this.
 */
@Entity
@Table(name = "helper_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HelperProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(length = 1000)
    private String bio;

    /** What the helper charges per hour, in the platform's single currency. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal hourlyRate;

    private String city;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "helper_services", joinColumns = @JoinColumn(name = "helper_profile_id"))
    @Column(name = "service_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<ServiceType> offeredServices = new HashSet<>();

    /** Set by an admin once ID / background checks clear. Unverified helpers are not searchable. */
    @Builder.Default
    @Column(nullable = false)
    private boolean verified = false;

    /** Helper's own toggle for whether they are currently taking work. */
    @Builder.Default
    @Column(nullable = false)
    private boolean acceptingBookings = true;

    @Builder.Default
    @Column(nullable = false, precision = 3, scale = 2)
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Builder.Default
    @Column(nullable = false)
    private int completedBookings = 0;
}
