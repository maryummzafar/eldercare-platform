package com.eldercare_platform.dto;

import com.eldercare_platform.entity.Message;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class MessageResponse {

    private Long id;
    private Long bookingId;
    private Long senderId;
    private String senderName;
    private String body;
    private Instant readAt;
    private Instant createdAt;

    public static MessageResponse from(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .bookingId(message.getBooking().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getName())
                .body(message.getBody())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
