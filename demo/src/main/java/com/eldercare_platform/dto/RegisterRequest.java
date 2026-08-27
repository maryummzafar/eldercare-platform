package com.eldercare_platform.dto;

import com.eldercare_platform.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    private String password;

    @Pattern(regexp = "^$|^\\+?[0-9 \\-]{7,20}$", message = "Must be a valid phone number")
    private String phone;

    private String address;

    @NotNull(message = "Role is required")
    private UserRole role;
}
