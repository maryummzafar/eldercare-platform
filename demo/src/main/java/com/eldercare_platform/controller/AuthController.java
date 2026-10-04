package com.eldercare_platform.controller;

import com.eldercare_platform.dto.AuthResponse;
import com.eldercare_platform.dto.ForgotPasswordRequest;
import com.eldercare_platform.dto.LoginRequest;
import com.eldercare_platform.dto.RegisterRequest;
import com.eldercare_platform.dto.ResetPasswordRequest;
import com.eldercare_platform.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Always 202, whether or not the email has an account. */
    @PostMapping("/password/forgot")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.accepted().build();
    }

    /** Sets a new password from the emailed code and returns a fresh sign-in. */
    @PostMapping("/password/reset")
    public ResponseEntity<AuthResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }
}
