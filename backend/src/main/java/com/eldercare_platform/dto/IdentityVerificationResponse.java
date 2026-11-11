package com.eldercare_platform.dto;

import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.IdentityVerificationStatus;
import com.eldercare_platform.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class IdentityVerificationResponse {

    private Long userId;
    private String name;
    private String email;
    private String phone;
    private UserRole role;
    private IdentityVerificationStatus status;
    private Instant verifiedAt;
    private Instant updatedAt;

    public static IdentityVerificationResponse from(User user) {
        return IdentityVerificationResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getIdentityVerificationStatus())
                .verifiedAt(user.getIdentityVerifiedAt())
                .updatedAt(user.getIdentityVerificationUpdatedAt())
                .build();
    }
}