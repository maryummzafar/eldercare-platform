package com.eldercare_platform.dto;

import com.eldercare_platform.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private Long userId;
    private String name;
    private String email;
    private UserRole role;
}
