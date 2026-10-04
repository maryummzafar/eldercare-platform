package com.eldercare_platform.service;

import com.eldercare_platform.dto.AuthResponse;
import com.eldercare_platform.dto.LoginRequest;
import com.eldercare_platform.dto.RegisterRequest;
import com.eldercare_platform.dto.ResetPasswordRequest;
import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.CodePurpose;
import com.eldercare_platform.enums.UserRole;
import com.eldercare_platform.exception.ApiException;
import com.eldercare_platform.repository.UserRepository;
import com.eldercare_platform.security.AuthenticatedUser;
import com.eldercare_platform.security.JwtService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;

@Slf4j
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final VerificationCodeService verificationCodeService;
    private final String termsVersion;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            VerificationCodeService verificationCodeService,
            @Value("${app.legal.terms-version}") String termsVersion) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.verificationCodeService = verificationCodeService;
        this.termsVersion = termsVersion;
    }

    /**
     * Not one transaction on purpose: the account is committed first, and the
     * confirmation email is sent after. A mail outage then leaves a signed-up user who
     * can ask for the code again, rather than failing the whole signup.
     */
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("An account with this email already exists");
        }

        // Self-service signup must never mint an admin. Admins are provisioned separately.
        if (request.getRole() == UserRole.ADMIN) {
            throw ApiException.badRequest("Cannot self-register as an administrator");
        }

        User user = userRepository.save(User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(request.getRole())
                .enabled(true)
                // Validation has already refused a signup without both confirmations.
                .termsAcceptedAt(Instant.now())
                .termsVersion(termsVersion)
                .build());

        try {
            verificationCodeService.issue(user, CodePurpose.EMAIL_VERIFICATION);
        } catch (ApiException e) {
            log.warn("Signed up user {} but could not send the confirmation code: {}", user.getId(), e.getMessage());
        }

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

    /**
     * Emails a reset code if the address belongs to an active account. Says nothing
     * either way, so this endpoint cannot be used to find out who has an account.
     */
    public void forgotPassword(String rawEmail) {
        userRepository.findByEmail(normalizeEmail(rawEmail))
                .filter(User::isEnabled)
                .ifPresent(user -> {
                    try {
                        verificationCodeService.issue(user, CodePurpose.PASSWORD_RESET);
                    } catch (ApiException e) {
                        // Cooldown or mail outage. Surfacing either would reveal that the
                        // account exists, so it is logged rather than returned.
                        log.info("Password reset for user {} not sent: {}", user.getId(), e.getMessage());
                    }
                });
    }

    /**
     * Sets a new password from an emailed code and signs the user in. Every token
     * issued before now stops working, so any other device is signed out.
     */
    @Transactional(noRollbackFor = ApiException.class)
    public AuthResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .filter(User::isEnabled)
                // Same message as a wrong code: an unknown email must look no different.
                .orElseThrow(() -> ApiException.badRequest("That code is not right. Check the email and try again."));

        verificationCodeService.verify(user, CodePurpose.PASSWORD_RESET, request.getCode());

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setCredentialsChangedAt(Instant.now());
        // Receiving the code proves they control the address.
        user.setEmailVerified(true);

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
                .emailVerified(user.isEmailVerified())
                .build();
    }

    /** Emails are case-insensitive identifiers; store and compare them lowercased. */
    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
