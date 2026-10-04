package com.eldercare_platform.dto;

import com.eldercare_platform.entity.HelperProfile;
import com.eldercare_platform.enums.ServiceType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;

/**
 * Public view of a helper. Deliberately omits email, phone and address — an elder
 * gets a helper's contact details only through an accepted booking.
 */
@Data
@Builder
public class HelperResponse {

    private Long helperId;
    private String name;
    private String bio;
    private String city;
    private BigDecimal hourlyRate;
    private Set<ServiceType> offeredServices;
    private BigDecimal averageRating;
    private int completedBookings;
    private boolean acceptingBookings;
    /**
     * Always true in search results, which only ever contain verified helpers; it
     * matters on a helper's own profile, where it tells them whether they are live yet.
     */
    private boolean verified;

    public static HelperResponse from(HelperProfile profile) {
        return HelperResponse.builder()
                .helperId(profile.getUser().getId())
                .name(profile.getUser().getName())
                .bio(profile.getBio())
                .city(profile.getCity())
                .hourlyRate(profile.getHourlyRate())
                .offeredServices(profile.getOfferedServices())
                .averageRating(profile.getAverageRating())
                .completedBookings(profile.getCompletedBookings())
                .acceptingBookings(profile.isAcceptingBookings())
                .verified(profile.isVerified())
                .build();
    }
}
