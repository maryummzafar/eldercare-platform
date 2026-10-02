package com.eldercare_platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** The password is asked again so a borrowed, unlocked phone cannot erase an account. */
@Data
public class DeleteAccountRequest {

    @NotBlank(message = "Enter your password to confirm")
    private String password;
}
