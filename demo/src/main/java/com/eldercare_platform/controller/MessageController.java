package com.eldercare_platform.controller;

import com.eldercare_platform.dto.MessageResponse;
import com.eldercare_platform.dto.SendMessageRequest;
import com.eldercare_platform.security.AuthenticatedUser;
import com.eldercare_platform.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Chat lives under the booking it belongs to, which is also what authorises it —
 * only the elder and helper on that booking can read or post here.
 */
@RestController
@RequestMapping("/api/bookings/{bookingId}/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping
    public List<MessageResponse> list(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long bookingId) {
        return messageService.list(principal.getUser(), bookingId);
    }

    @PostMapping
    public ResponseEntity<MessageResponse> send(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long bookingId,
            @Valid @RequestBody SendMessageRequest request) {
        MessageResponse sent = messageService.send(principal.getUser(), bookingId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(sent);
    }

    /** Marks the other side's messages in this thread as read. */
    @PostMapping("/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long bookingId) {
        messageService.markRead(principal.getUser(), bookingId);
    }
}
