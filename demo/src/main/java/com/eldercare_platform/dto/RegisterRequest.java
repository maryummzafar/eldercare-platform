package com.eldercare_platform.dto;

import com.eldercare_platform.enums.UserRole;
import lombok.Data;

@Data
public class RegisterRequest {

    private String name;
    private String email;
    private String password;
    private UserRole role;

}