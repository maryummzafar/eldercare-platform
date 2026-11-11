package com.eldercare_platform.service;

import com.eldercare_platform.dto.MeResponse;
import com.eldercare_platform.entity.Booking;
import com.eldercare_platform.enums.CodePurpose;
import com.eldercare_platform.repository.VerificationCodeRepository;
import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.BookingStatus;
import com.eldercare_platform.enums.UserRole;
import com.eldercare_platform.exception.ApiException;
import com.eldercare_platform.repository.BookingRepository;
import com.eldercare_platform.repository.HelperProfileRepository;
import com.eldercare_platform.repository.MessageRepository;
import com.eldercare_platform.repository.NotificationRepository;
import com.eldercare_platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.UUID;

/**
 * Self-service account deletion, which Google Play requires of any app that offers signup.
 *
 * <p>Bookings involve two people, so the user row is anonymised rather than deleted: the
 * other participant keeps an intact record of visits that happened, while everything that
 * identifies the departing user — name, email, phone, address, password, what they wrote
 * in chat, the address and notes on their bookings — is erased. The email is freed, so the
 * same person can sign up again later as a new account.
 */
@Service
@RequiredArgsConstructor
public class AccountService {

    static final String DELETED_NAME = "Deleted user";
    static final String REDACTED_MESSAGE = "This message was removed when its sender deleted their account.";

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final HelperProfileRepository helperProfileRepository;
    private final MessageRepository messageRepository;
    private final NotificationRepository notificationRepository;
    private final VerificationCodeRepository verificationCodeRepository;
    private final VerificationCodeService verificationCodeService;
    private final BookingService bookingService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(noRollbackFor = ApiException.class)
    public MeResponse verifyEmail(User caller, String code) {
        User user = userRepository.findById(caller.getId())
                .orElseThrow(() -> ApiException.notFound("Account not found"));
        if (!user.isEmailVerified()) {
            verificationCodeService.verify(user, CodePurpose.EMAIL_VERIFICATION, code);
            user.setEmailVerified(true);
        }
        return MeResponse.from(user);
    }

    public void resendVerification(User caller) {
        if (caller.isEmailVerified()) {
            throw ApiException.badRequest("Your email address is already confirmed.");
        }
        verificationCodeService.issue(caller, CodePurpose.EMAIL_VERIFICATION);
    }

    @Transactional
    public void deleteAccount(User caller, String password) {
        if (!passwordEncoder.matches(password, caller.getPassword())) {
            throw ApiException.forbidden("That password is not correct");
        }
        // Admins are seeded from the environment; deleting the last one would leave no way
        // to verify helpers, so they are removed through the database instead.
        if (caller.getRole() == UserRole.ADMIN) {
            throw ApiException.forbidden("Administrator accounts cannot be deleted from the app");
        }

        Long userId = caller.getId();

        if (!bookingRepository.findForParticipantInStatuses(
                userId, EnumSet.of(BookingStatus.IN_PROGRESS)).isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "A visit is in progress. Finish it before deleting your account.");
        }

        // Cancel through the normal path so the other side is told, before the name goes.
        for (Booking open : bookingRepository.findForParticipantInStatuses(
                userId, EnumSet.of(BookingStatus.REQUESTED, BookingStatus.ACCEPTED))) {
            bookingService.cancel(caller, open.getId());
        }

        helperProfileRepository.findByUserId(userId).ifPresent(profile -> {
            helperProfileRepository.delete(profile);
            helperProfileRepository.flush();
        });

        messageRepository.redactBySender(userId, REDACTED_MESSAGE);
        bookingRepository.scrubElderDetails(userId);
        notificationRepository.deleteByRecipient(userId);
        verificationCodeRepository.deleteByUser(userId);

        // Reloaded: the bulk updates above cleared the persistence context, and the caller
        // came from the security filter, outside this transaction.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Account not found"));
        user.setName(DELETED_NAME);
        user.setEmail("deleted-" + userId + "@deleted.invalid");
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setPhone(null);
        user.setAddress(null);
        // The token still in the app now names an email that no longer exists, so its very
        // next request is a 401 and the app returns to login.
        user.setEnabled(false);
    }
}
