package com.eldercare_platform.service;

import com.eldercare_platform.dto.AuthResponse;
import com.eldercare_platform.dto.LoginRequest;
import com.eldercare_platform.dto.RegisterRequest;
import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.UserRole;
import com.eldercare_platform.exception.ApiException;
import com.eldercare_platform.repository.UserRepository;
import com.eldercare_platform.security.AuthenticatedUser;
import com.eldercare_platform.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }

        // Self-service signup must never mint an admin. Admins are provisioned separately.
        if (request.getRole() == UserRole.ADMIN) {
            throw ApiException.badRequest("Cannot self-register as an administrator");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(request.getRole())
                .enabled(true)
                .build();

        userRepository.save(user);

        return buildResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());

        // Throws BadCredentialsException / DisabledException, translated by the
        // global handler into 401 / 403 respectively.
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        User user = ((AuthenticatedUser) authentication.getPrincipal()).getUser();
        return buildResponse(user);
    }

    private AuthResponse buildResponse(User user) {
        String token = jwtService.generateToken(new AuthenticatedUser(user));
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    /** Emails are case-insensitive identifiers; store and compare them lowercased. */
    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
