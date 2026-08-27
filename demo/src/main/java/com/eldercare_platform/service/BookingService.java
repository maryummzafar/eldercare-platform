package com.eldercare_platform.service;

import com.eldercare_platform.dto.BookingResponse;
import com.eldercare_platform.dto.CreateBookingRequest;
import com.eldercare_platform.entity.Booking;
import com.eldercare_platform.entity.HelperProfile;
import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.BookingStatus;
import com.eldercare_platform.enums.UserRole;
import com.eldercare_platform.exception.ApiException;
import com.eldercare_platform.repository.BookingRepository;
import com.eldercare_platform.repository.HelperProfileRepository;
import com.eldercare_platform.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BookingService {

    /** A booking in one of these states is holding the helper's calendar slot. */
    private static final Set<BookingStatus> SLOT_BLOCKING =
            EnumSet.of(BookingStatus.REQUESTED, BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS);

    private static final Duration MIN_DURATION = Duration.ofMinutes(30);
    private static final Duration MAX_DURATION = Duration.ofHours(12);

    /** Visits are billed for at least one hour, however short the actual stay. */
    private static final BigDecimal MIN_BILLABLE_HOURS = BigDecimal.ONE;

    private final BookingRepository bookingRepository;
    private final HelperProfileRepository helperProfileRepository;
    private final UserRepository userRepository;

    @Transactional
    public BookingResponse create(User elder, CreateBookingRequest request) {
        if (elder.getRole() != UserRole.ELDER) {
            throw ApiException.forbidden("Only elders can request bookings");
        }

        Instant start = request.getScheduledStart();
        Instant end = request.getScheduledEnd();

        if (!end.isAfter(start)) {
            throw ApiException.badRequest("End time must be after start time");
        }

        Duration duration = Duration.between(start, end);
        if (duration.compareTo(MIN_DURATION) < 0) {
            throw ApiException.badRequest("Bookings must be at least 30 minutes long");
        }
        if (duration.compareTo(MAX_DURATION) > 0) {
            throw ApiException.badRequest("Bookings cannot exceed 12 hours");
        }

        User helperUser = userRepository.findById(request.getHelperId())
                .orElseThrow(() -> ApiException.notFound("Helper not found"));

        if (helperUser.getRole() != UserRole.HELPER) {
            throw ApiException.badRequest("Selected user is not a helper");
        }

        HelperProfile profile = helperProfileRepository.findByUserId(helperUser.getId())
                .orElseThrow(() -> ApiException.badRequest("This helper has not set up their profile yet"));

        if (!profile.isVerified()) {
            throw ApiException.badRequest("This helper is not verified yet");
        }
        if (!profile.isAcceptingBookings()) {
            throw ApiException.badRequest("This helper is not accepting bookings right now");
        }
        if (!profile.getOfferedServices().contains(request.getServiceType())) {
            throw ApiException.badRequest("This helper does not offer the selected service");
        }

        if (!bookingRepository.findOverlapping(helperUser.getId(), start, end, SLOT_BLOCKING).isEmpty()) {
            throw ApiException.conflict("This helper is already booked during that time");
        }

        BigDecimal rate = profile.getHourlyRate();
        BigDecimal estimated = rate.multiply(billableHours(duration))
                .setScale(2, RoundingMode.HALF_UP);

        String address = (request.getServiceAddress() != null && !request.getServiceAddress().isBlank())
                ? request.getServiceAddress()
                : elder.getAddress();

        Booking booking = Booking.builder()
                .elder(elder)
                .helper(helperUser)
                .serviceType(request.getServiceType())
                .status(BookingStatus.REQUESTED)
                .scheduledStart(start)
                .scheduledEnd(end)
                .hourlyRate(rate)
                .estimatedTotal(estimated)
                .serviceAddress(address)
                .notes(request.getNotes())
                .build();

        return BookingResponse.from(bookingRepository.save(booking));
    }

    @Transactional(readOnly = true)
    public Page<BookingResponse> listForUser(User user, Pageable pageable) {
        Page<Booking> bookings = user.getRole() == UserRole.HELPER
                ? bookingRepository.findByHelperIdOrderByScheduledStartDesc(user.getId(), pageable)
                : bookingRepository.findByElderIdOrderByScheduledStartDesc(user.getId(), pageable);
        return bookings.map(BookingResponse::from);
    }

    @Transactional(readOnly = true)
    public BookingResponse get(User user, Long bookingId) {
        return BookingResponse.from(loadParticipating(user, bookingId));
    }

    /** Helper accepts a pending request. */
    @Transactional
    public BookingResponse accept(User helper, Long bookingId) {
        Booking booking = loadAsHelper(helper, bookingId);
        requireStatus(booking, BookingStatus.REQUESTED);

        // Re-check overlap: the helper may have accepted a competing request since this one landed.
        boolean clash = bookingRepository
                .findOverlapping(helper.getId(), booking.getScheduledStart(), booking.getScheduledEnd(), SLOT_BLOCKING)
                .stream()
                .anyMatch(other -> !other.getId().equals(booking.getId())
                        && other.getStatus() != BookingStatus.REQUESTED);
        if (clash) {
            throw ApiException.conflict("You already have an accepted booking during that time");
        }

        booking.setStatus(BookingStatus.ACCEPTED);
        return BookingResponse.from(booking);
    }

    /** Helper declines a pending request. */
    @Transactional
    public BookingResponse reject(User helper, Long bookingId) {
        Booking booking = loadAsHelper(helper, bookingId);
        requireStatus(booking, BookingStatus.REQUESTED);
        booking.setStatus(BookingStatus.REJECTED);
        return BookingResponse.from(booking);
    }

    /** Helper marks the visit as started; this begins the billable clock. */
    @Transactional
    public BookingResponse start(User helper, Long bookingId) {
        Booking booking = loadAsHelper(helper, bookingId);
        requireStatus(booking, BookingStatus.ACCEPTED);
        booking.setStatus(BookingStatus.IN_PROGRESS);
        booking.setActualStart(Instant.now());
        return BookingResponse.from(booking);
    }

    /** Helper marks the visit finished; final charge is computed from actual elapsed time. */
    @Transactional
    public BookingResponse complete(User helper, Long bookingId) {
        Booking booking = loadAsHelper(helper, bookingId);
        requireStatus(booking, BookingStatus.IN_PROGRESS);

        Instant finishedAt = Instant.now();
        booking.setActualEnd(finishedAt);
        booking.setStatus(BookingStatus.COMPLETED);

        Duration worked = Duration.between(booking.getActualStart(), finishedAt);
        booking.setFinalTotal(booking.getHourlyRate()
                .multiply(billableHours(worked))
                .setScale(2, RoundingMode.HALF_UP));

        helperProfileRepository.findByUserId(helper.getId()).ifPresent(profile ->
                profile.setCompletedBookings(profile.getCompletedBookings() + 1));

        return BookingResponse.from(booking);
    }

    /** Either participant can call off a booking before it starts. */
    @Transactional
    public BookingResponse cancel(User user, Long bookingId) {
        Booking booking = loadParticipating(user, bookingId);

        if (booking.getStatus() != BookingStatus.REQUESTED
                && booking.getStatus() != BookingStatus.ACCEPTED) {
            throw ApiException.badRequest(
                    "A booking that is " + booking.getStatus() + " can no longer be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        return BookingResponse.from(booking);
    }

    /**
     * Converts elapsed time to billable hours: rounded up to the next 15-minute block,
     * with a one-hour floor. Rounding up matches how the helper's time is actually
     * consumed and keeps short call-outs worth taking.
     */
    private BigDecimal billableHours(Duration duration) {
        long quarters = (duration.toMinutes() + 14) / 15;
        BigDecimal hours = BigDecimal.valueOf(quarters)
                .divide(BigDecimal.valueOf(4), 2, RoundingMode.HALF_UP);
        return hours.max(MIN_BILLABLE_HOURS);
    }

    private Booking loadParticipating(User user, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));

        boolean participant = booking.getElder().getId().equals(user.getId())
                || booking.getHelper().getId().equals(user.getId());

        if (!participant && user.getRole() != UserRole.ADMIN) {
            // 404 rather than 403: do not confirm that this booking id exists.
            throw ApiException.notFound("Booking not found");
        }
        return booking;
    }

    private Booking loadAsHelper(User helper, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> ApiException.notFound("Booking not found"));

        if (!booking.getHelper().getId().equals(helper.getId())) {
            throw ApiException.notFound("Booking not found");
        }
        return booking;
    }

    private void requireStatus(Booking booking, BookingStatus expected) {
        if (booking.getStatus() != expected) {
            throw ApiException.badRequest(
                    "Expected booking to be " + expected + " but it is " + booking.getStatus());
        }
    }
}
