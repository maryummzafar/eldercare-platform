package com.eldercare_platform.dto;

import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.UserRole;
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

    public static MeResponse from(User user) {
        return MeResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .emailVerified(user.isEmailVerified())
                .build();
    }
}
