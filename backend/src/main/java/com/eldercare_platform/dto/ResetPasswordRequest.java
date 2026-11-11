package com.eldercare_platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    @NotBlank(message = "Enter the code from the email")
    @Pattern(regexp = "^\\s*\\d{6}\\s*$", message = "The code is 6 digits")
    private String code;

    @NotBlank(message = "Choose a new password")
    @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
    private String newPassword;
}
