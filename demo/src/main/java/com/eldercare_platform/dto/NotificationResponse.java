package com.eldercare_platform.dto;

import com.eldercare_platform.entity.Notification;
import com.eldercare_platform.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class NotificationResponse {

    private Long id;
    private NotificationType type;
    private String title;
    private String body;
    private Long bookingId;
    private boolean read;
    private Instant createdAt;

    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .body(notification.getBody())
                .bookingId(notification.getBookingId())
                .read(notification.isReadFlag())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
