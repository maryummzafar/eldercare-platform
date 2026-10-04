package com.eldercare_platform.service;

import com.eldercare_platform.entity.User;
import com.eldercare_platform.entity.VerificationCode;
import com.eldercare_platform.enums.CodePurpose;
import com.eldercare_platform.exception.ApiException;
import com.eldercare_platform.repository.VerificationCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

/**
 * Issues and checks the six-digit codes behind email verification and password reset.
 *
 * <p>A code is short so an elderly user can read it off one screen and type it on
 * another, which makes guessing the threat to design for: each code allows
 * {@value #MAX_ATTEMPTS} tries and lives {@link #TTL}, a new one can be asked for at
 * most once a {@link #RESEND_COOLDOWN}, and issuing one retires the last. Only a hash
 * is stored.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VerificationCodeService {

    static final Duration TTL = Duration.ofMinutes(15);
    static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    static final int MAX_ATTEMPTS = 5;

    private static final SecureRandom RANDOM = new SecureRandom();

    private final VerificationCodeRepository codeRepository;
    private final EmailService emailService;

    /** Creates a fresh code for this purpose, retiring any earlier one, and emails it. */
    @Transactional
    public void issue(User user, CodePurpose purpose) {
        Instant now = Instant.now();
        codeRepository.findFirstByUserIdAndPurposeOrderByCreatedAtDesc(user.getId(), purpose)
                .filter(last -> last.getCreatedAt().plus(RESEND_COOLDOWN).isAfter(now))
                .ifPresent(last -> {
                    throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                            "We just sent you a code. Please wait a minute before asking for another.");
                });

        codeRepository.retireOutstanding(user.getId(), purpose, now);

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        codeRepository.save(VerificationCode.builder()
                .user(user)
                .purpose(purpose)
                .codeHash(hash(code))
                .expiresAt(now.plus(TTL))
                .build());

        try {
            emailService.send(user.getEmail(), subject(purpose), body(user, purpose, code));
        } catch (MailException e) {
            // Rolls the new code back too, so the cooldown is not spent on an email
            // that never left.
            log.error("Could not send {} email to user {}", purpose, user.getId(), e);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "We could not send the email just now. Please try again in a few minutes.");
        }
    }

    /**
     * Consumes the code if it matches. A wrong guess still counts against the code —
     * hence {@code noRollbackFor}, or the exception would undo the attempt counter and
     * make guessing free.
     */
    @Transactional(noRollbackFor = ApiException.class)
    public void verify(User user, CodePurpose purpose, String submitted) {
        VerificationCode code = codeRepository
                .findFirstByUserIdAndPurposeOrderByCreatedAtDesc(user.getId(), purpose)
                .filter(c -> c.getConsumedAt() == null && c.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> ApiException.badRequest(
                        "That code has expired. Ask for a new one and try again."));

        code.setAttempts(code.getAttempts() + 1);

        boolean matches = submitted != null
                && MessageDigest.isEqual(
                        hash(submitted.trim()).getBytes(StandardCharsets.US_ASCII),
                        code.getCodeHash().getBytes(StandardCharsets.US_ASCII));

        if (matches) {
            code.setConsumedAt(Instant.now());
            return;
        }
        if (code.getAttempts() >= MAX_ATTEMPTS) {
            code.setConsumedAt(Instant.now());
            throw ApiException.badRequest("Too many wrong tries. Ask for a new code and try again.");
        }
        throw ApiException.badRequest("That code is not right. Check the email and try again.");
    }

    private static String subject(CodePurpose purpose) {
        return purpose == CodePurpose.EMAIL_VERIFICATION
                ? "Your Eldercare confirmation code"
                : "Reset your Eldercare password";
    }

    private static String body(User user, CodePurpose purpose, String code) {
        String firstName = user.getName().split(" ")[0];
        String action = purpose == CodePurpose.EMAIL_VERIFICATION
                ? "confirm your email address"
                : "reset your password";
        String notYou = purpose == CodePurpose.EMAIL_VERIFICATION
                ? "If you did not create an Eldercare account, you can ignore this email."
                : "If you did not ask to reset your password, you can ignore this email; your password has not changed.";
        return """
                Hello %s,

                Your code to %s is:

                    %s

                It works for %d minutes. Never share it with anyone, including people who say they are from Eldercare.

                %s

                — The Eldercare team
                """.formatted(firstName, action, code, TTL.toMinutes(), notYou);
    }

    private static String hash(String code) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(code.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is always available", e);
        }
    }
}
