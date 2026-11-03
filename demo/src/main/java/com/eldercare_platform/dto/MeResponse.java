package com.eldercare_platform.dto;

import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.UserRole;
import com.eldercare_platform.enums.IdentityVerificationStatus;
import lombok.Builder;
import lombok.Data;

/** The signed-in user as the server sees them now, for the app to refresh its copy. */
@Data
@Builder
public class MeResponse {

    private Long userId;
    private String name;
    private String email;
    private UserRole role;
    private boolean emailVerified;
    private IdentityVerificationStatus identityVerificationStatus;
    private java.time.Instant identityVerifiedAt;

    public static MeResponse from(User user) {
        return MeResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .identityVerificationStatus(user.getIdentityVerificationStatus())
                .identityVerifiedAt(user.getIdentityVerifiedAt())
                .build();
    }
}
