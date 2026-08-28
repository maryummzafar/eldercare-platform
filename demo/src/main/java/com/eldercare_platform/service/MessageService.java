package com.eldercare_platform.service;

import com.eldercare_platform.dto.MessageResponse;
import com.eldercare_platform.dto.SendMessageRequest;
import com.eldercare_platform.entity.Booking;
import com.eldercare_platform.entity.Message;
import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.BookingStatus;
import com.eldercare_platform.enums.NotificationType;
import com.eldercare_platform.exception.ApiException;
import com.eldercare_platform.repository.BookingRepository;
import com.eldercare_platform.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Chat between the two participants of a booking.
 *
 * There is no separate conversation entity: the booking *is* the thread. That keeps
 * authorisation to a single question — is this user the elder or the helper on this
 * booking — and means a thread can never outlive the arrangement that justified it.
 */
@Service
@RequiredArgsConstructor
public class MessageService {

    /**
     * Threads on bookings that never happened are read-only. History stays visible so
     * either side can see why it fell through, but nobody can keep messaging through a
     * booking the other person already declined.
     */
    private static final Set<BookingStatus> CLOSED_TO_NEW_MESSAGES =
            EnumSet.of(BookingStatus.REJECTED, BookingStatus.CANCELLED);

    private static final int PREVIEW_LENGTH = 120;

    private final MessageRepository messageRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<MessageResponse> list(User user, Long bookingId) {
        Booking booking = loadParticipating(user, bookingId);
        return messageRepository.findByBookingIdOrderByCreatedAtAsc(booking.getId())
                .stream()
                .map(MessageResponse::from)
                .toList();
    }

    @Transactional
    public MessageResponse send(User sender, Long bookingId, SendMessageRequest request) {
        Booking booking = loadParticipating(sender, bookingId);

        if (CLOSED_TO_NEW_MESSAGES.contains(booking.getStatus())) {
            throw ApiException.badRequest(
                    "This booking is " + booking.getStatus().name().toLowerCase() + ", so the chat is closed");
        }

        String body = request.getBody().trim();
        if (body.isEmpty()) {
            throw ApiException.badRequest("Message cannot be empty");
        }

        Message saved = messageRepository.save(Message.builder()
                .booking(booking)
                .sender(sender)
                .body(body)
                .build());

        User recipient = otherParticipant(booking, sender);
        notificationService.notifyAboutBooking(
                recipient,
                NotificationType.MESSAGE_RECEIVED,
                "New message from " + sender.getName(),
                preview(body),
                booking);

        return MessageResponse.from(saved);
    }

    /** Called when a participant opens the thread. Returns how many were newly marked. */
    @Transactional
    public int markRead(User reader, Long bookingId) {
        Booking booking = loadParticipating(reader, bookingId);
        return messageRepository.markThreadRead(booking.getId(), reader.getId(), Instant.now());
    }

    private static String preview(String body) {
        return body.length() <= PREVIEW_LENGTH ? body : body.substring(0, PREVIEW_LENGTH - 1) + "…";
    }

    private static User otherParticipant(Booking booking, User user) {
        return booking.getElder().getId().equals(user.getId())
                ? booking.getHelper()
                : booking.getElder();
    }

    private Booking loadParticipating(User user, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));

        boolean participant = booking.getElder().getId().equals(user.getId())
                || booking.getHelper().getId().equals(user.getId());
        if (!participant) {
            throw ApiException.forbidden("That booking is not yours");
        }
        return booking;
    }
}
