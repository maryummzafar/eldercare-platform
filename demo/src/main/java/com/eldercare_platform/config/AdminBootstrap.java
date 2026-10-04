package com.eldercare_platform.config;

import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.UserRole;
import com.eldercare_platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;

/**
 * Seeds the first administrator, since {@code /api/auth/register} refuses to create one.
 * Without this there is no way to verify helpers and the platform cannot function.
 *
 * <p>Runs only when both env vars are set, and only if that account does not already
 * exist — so it is safe to leave enabled across restarts.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class AdminBootstrap {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner seedAdmin(
            @Value("${app.admin.email:}") String email,
            @Value("${app.admin.password:}") String password) {

        return args -> {
            if (email.isBlank() || password.isBlank()) {
                log.info("No ADMIN_EMAIL/ADMIN_PASSWORD configured; skipping admin bootstrap.");
                return;
            }

            String normalized = email.trim().toLowerCase(Locale.ROOT);
            if (userRepository.existsByEmail(normalized)) {
                log.info("Admin account {} already exists; nothing to seed.", normalized);
                return;
            }

            userRepository.save(User.builder()
                    .name("Platform Admin")
                    .email(normalized)
                    .password(passwordEncoder.encode(password))
                    .role(UserRole.ADMIN)
                    .enabled(true)
                    // Configured by whoever runs the server, so there is nothing to confirm.
                    .emailVerified(true)
                    .build());

            log.info("Seeded initial admin account: {}", normalized);
        };
    }
}
