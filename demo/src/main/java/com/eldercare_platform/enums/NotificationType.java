package com.eldercare_platform.enums;

/**
 * What a notification is about. The mobile client switches its icon and tap target
 * on this, so values are part of the API contract — rename with care.
 */
public enum NotificationType {
    BOOKING_REQUESTED,
    BOOKING_ACCEPTED,
    BOOKING_REJECTED,
    BOOKING_STARTED,
    BOOKING_COMPLETED,
    BOOKING_CANCELLED,
    MESSAGE_RECEIVED
}
