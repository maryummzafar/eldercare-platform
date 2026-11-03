package com.eldercare_platform.dto;

import com.eldercare_platform.entity.HelperProfile;
import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.ServiceType;
import com.eldercare_platform.enums.IdentityVerificationStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

/**
 * An admin's view of a helper, for vetting. Unlike {@link HelperResponse} it carries the
 * contact details an admin needs to run an ID check, and the verification state itself.
 */
@Data
@Builder
public class AdminHelperResponse {

    private Long helperId;
    private String name;
    private String email;
    private String phone;
    private String city;
    private String bio;
    private BigDecimal hourlyRate;
    private Set<ServiceType> offeredServices;
    private boolean verified;
    /** Must be true before the helper can be approved. */
    private boolean emailVerified;
    private IdentityVerificationStatus identityVerificationStatus;
    private Instant joinedAt;

    public static AdminHelperResponse from(HelperProfile profile) {
        User user = profile.getUser();
        return AdminHelperResponse.builder()
                .helperId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .city(profile.getCity())
                .bio(profile.getBio())
                .hourlyRate(profile.getHourlyRate())
                // Copied while the transaction is open, so serialising later never
                // touches the Hibernate collection.
                .offeredServices(Set.copyOf(profile.getOfferedServices()))
                .verified(profile.isVerified())
                .emailVerified(user.isEmailVerified())
                .identityVerificationStatus(user.getIdentityVerificationStatus())
                .joinedAt(user.getCreatedAt())
                .build();
    }
}
