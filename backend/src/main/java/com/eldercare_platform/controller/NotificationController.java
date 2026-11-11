package com.eldercare_platform.controller;

import com.eldercare_platform.dto.NotificationResponse;
import com.eldercare_platform.dto.UnreadCountResponse;
import com.eldercare_platform.security.AuthenticatedUser;
import com.eldercare_platform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public Page<NotificationResponse> list(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PageableDefault(size = 30) Pageable pageable) {
        return notificationService.list(principal.getUser(), pageable);
    }

    /** Polled by the badge. Kept separate from the list so it stays cheap. */
    @GetMapping("/unread-count")
    public UnreadCountResponse unreadCount(@AuthenticationPrincipal AuthenticatedUser principal) {
        return new UnreadCountResponse(notificationService.unreadCount(principal.getUser()));
    }

    @PostMapping("/{id}/read")
    public NotificationResponse markRead(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        return notificationService.markRead(principal.getUser(), id);
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@AuthenticationPrincipal AuthenticatedUser principal) {
        notificationService.markAllRead(principal.getUser());
    }
}
