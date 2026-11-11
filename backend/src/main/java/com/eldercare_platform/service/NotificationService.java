package com.eldercare_platform.service;

import com.eldercare_platform.dto.NotificationResponse;
import com.eldercare_platform.entity.Booking;
import com.eldercare_platform.entity.Notification;
import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.NotificationType;
import com.eldercare_platform.exception.ApiException;
import com.eldercare_platform.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Writes and reads in-app notifications.
 *
 * Every notification in the system is created through {@link #notify}, so that is the
 * one place a device-push sender needs to be added later. Call sites deliberately do
 * not touch the repository directly.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Records a notification for one recipient.
     *
     * Failures here must never break the action that triggered them — a booking is
     * still accepted even if telling the elder about it fails — so callers run this
     * inside their own transaction and it does no validation beyond the entity's.
     */
    @Transactional
    public void notify(User recipient, NotificationType type, String title, String body, Long bookingId) {
        notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .body(body)
                .bookingId(bookingId)
                .readFlag(false)
                .build());
    }

    /** Convenience for the booking lifecycle, where the subject is always a booking. */
    @Transactional
    public void notifyAboutBooking(User recipient, NotificationType type, String title, String body, Booking booking) {
        notify(recipient, type, title, body, booking.getId());
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> list(User user, Pageable pageable) {
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(NotificationResponse::from);
    }

    @Transactional(readOnly = true)
    public long unreadCount(User user) {
        return notificationRepository.countByRecipientIdAndReadFlagFalse(user.getId());
    }

    @Transactional
    public NotificationResponse markRead(User user, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> ApiException.notFound("Notification not found"));

        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw ApiException.forbidden("That notification is not yours");
        }

        notification.setReadFlag(true);
        return NotificationResponse.from(notification);
    }

    @Transactional
    public void markAllRead(User user) {
        notificationRepository.markAllRead(user.getId());
    }

    /**
     * Called when a reader opens a booking's chat. Without this the badge keeps
     * advertising a message the user has just finished reading.
     */
    @Transactional
    public void markMessageNotificationsRead(User reader, Long bookingId) {
        notificationRepository.markReadForBooking(
                reader.getId(), bookingId, NotificationType.MESSAGE_RECEIVED);
    }
}
