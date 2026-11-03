package com.eldercare_platform.service;

import com.eldercare_platform.dto.IdentityVerificationDecisionRequest;
import com.eldercare_platform.dto.IdentityVerificationResponse;
import com.eldercare_platform.entity.IdentityVerificationEvent;
import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.IdentityVerificationStatus;
import com.eldercare_platform.enums.UserRole;
import com.eldercare_platform.exception.ApiException;
import com.eldercare_platform.repository.IdentityVerificationEventRepository;
import com.eldercare_platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;

@Service
@RequiredArgsConstructor
@Slf4j
public class IdentityVerificationService {

    private final UserRepository userRepository;
    private final IdentityVerificationEventRepository eventRepository;
    private final EmailService emailService;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Transactional
    public IdentityVerificationResponse requestReview(User caller) {
        User user = load(caller.getId());
        if (user.getRole() == UserRole.ADMIN) {
            throw ApiException.forbidden("Administrator accounts do not use customer identity verification.");
        }
        if (!user.isEmailVerified()) {
            throw ApiException.conflict("Confirm your email address before requesting identity verification.");
        }
        if (user.getIdentityVerificationStatus() == IdentityVerificationStatus.VERIFIED) {
            throw ApiException.conflict("Your identity is already verified.");
        }
        if (user.getIdentityVerificationStatus() == IdentityVerificationStatus.PENDING) {
            throw ApiException.conflict("Your identity verification is already waiting for review.");
        }

        user.setIdentityVerificationStatus(IdentityVerificationStatus.PENDING);
        user.setIdentityVerificationUpdatedAt(Instant.now());
        record(user, user, IdentityVerificationStatus.PENDING, "User requested a manual video identity review.");
        notifyAdmin(user);
        return IdentityVerificationResponse.from(user);
    }

    @Transactional(readOnly = true)
    public Page<IdentityVerificationResponse> listForAdmin(IdentityVerificationStatus status, Pageable pageable) {
        return userRepository.findByIdentityVerificationStatusOrderByIdentityVerificationUpdatedAtAsc(status, pageable)
                .map(IdentityVerificationResponse::from);
    }

    @Transactional
    public IdentityVerificationResponse decide(
            User admin, Long userId, IdentityVerificationDecisionRequest request) {
        IdentityVerificationStatus status = request.getStatus();
        if (status == null || !EnumSet.of(
                IdentityVerificationStatus.NEEDS_REVIEW,
                IdentityVerificationStatus.VERIFIED,
                IdentityVerificationStatus.REJECTED).contains(status)) {
            throw ApiException.badRequest("Choose NEEDS_REVIEW, VERIFIED, or REJECTED.");
        }

        User subject = load(userId);
        if (subject.getRole() == UserRole.ADMIN) {
            throw ApiException.badRequest("Administrator accounts cannot be identity reviewed.");
        }
        if (subject.getIdentityVerificationStatus() != IdentityVerificationStatus.PENDING
                && subject.getIdentityVerificationStatus() != IdentityVerificationStatus.NEEDS_REVIEW) {
            throw ApiException.conflict("This account is not awaiting identity review.");
        }

        subject.setIdentityVerificationStatus(status);
        subject.setIdentityVerifiedAt(status == IdentityVerificationStatus.VERIFIED ? Instant.now() : null);
        subject.setIdentityVerificationUpdatedAt(Instant.now());
        record(subject, admin, status, request.getNote());
        notifyUser(subject, status);
        return IdentityVerificationResponse.from(subject);
    }

    private User load(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Account not found"));
    }

    private void record(User subject, User actor, IdentityVerificationStatus status, String note) {
        IdentityVerificationEvent event = new IdentityVerificationEvent();
        event.setSubject(subject);
        event.setActor(actor);
        event.setStatus(status);
        event.setNote(note);
        eventRepository.save(event);
    }

    private void notifyAdmin(User user) {
        if (adminEmail == null || adminEmail.isBlank()) {
            log.warn("Cannot email identity review request for user {}: app.admin.email is not configured", user.getId());
            return;
        }
        String body = """
            A customer requested an identity video check.

            Sign in to the Eldercare admin app and open Identity checks to view the request, arrange the call, and record its result.
                Do not ask the customer to email identity documents or video.
                """;
        sendBestEffort(adminEmail, "Eldercare identity check requested", body, user.getId());
    }

    private void notifyUser(User user, IdentityVerificationStatus status) {
        String outcome = switch (status) {
            case VERIFIED -> "Your identity check is complete. You can now use the booking features available to your account.";
            case NEEDS_REVIEW -> "We need to arrange a follow-up for your identity check. Please contact Eldercare support to arrange the next step.";
            case REJECTED -> "We could not verify your identity this time. Please contact Eldercare support if you believe this is a mistake.";
            default -> throw new IllegalArgumentException("Not a review decision: " + status);
        };
        String body = """
                Hello %s,

                %s

                For your privacy, do not reply with identity documents or video.

                — The Eldercare team
                """.formatted(user.getName().split(" ")[0], outcome);
        sendBestEffort(user.getEmail(), "Your Eldercare identity check update", body, user.getId());
    }

    private void sendBestEffort(String to, String subject, String body, Long userId) {
        try {
            emailService.send(to, subject, body);
        } catch (MailException e) {
            log.error("Could not send identity verification email for user {}", userId, e);
        }
    }
}