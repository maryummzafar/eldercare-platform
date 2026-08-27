package com.eldercare_platform.enums;

/**
 * Lifecycle of a booking.
 *
 * <p>REQUESTED -> ACCEPTED -> IN_PROGRESS -> COMPLETED is the happy path.
 * Either party can reach CANCELLED before the visit starts; a helper who declines
 * a request sends it to REJECTED.
 */
public enum BookingStatus {
    REQUESTED,
    ACCEPTED,
    REJECTED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}
