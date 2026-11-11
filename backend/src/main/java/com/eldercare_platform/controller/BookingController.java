package com.eldercare_platform.controller;

import com.eldercare_platform.dto.BookingResponse;
import com.eldercare_platform.dto.CreateBookingRequest;
import com.eldercare_platform.security.AuthenticatedUser;
import com.eldercare_platform.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /** Elder requests help. */
    @PostMapping
    public ResponseEntity<BookingResponse> create(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody CreateBookingRequest request) {
        BookingResponse created = bookingService.create(principal.getUser(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** The caller's bookings — as elder or as helper, depending on their role. */
    @GetMapping
    public Page<BookingResponse> list(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PageableDefault(size = 20) Pageable pageable) {
        return bookingService.listForUser(principal.getUser(), pageable);
    }

    @GetMapping("/{id}")
    public BookingResponse get(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        return bookingService.get(principal.getUser(), id);
    }

    @PostMapping("/{id}/accept")
    public BookingResponse accept(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        return bookingService.accept(principal.getUser(), id);
    }

    @PostMapping("/{id}/reject")
    public BookingResponse reject(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        return bookingService.reject(principal.getUser(), id);
    }

    @PostMapping("/{id}/start")
    public BookingResponse start(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        return bookingService.start(principal.getUser(), id);
    }

    @PostMapping("/{id}/complete")
    public BookingResponse complete(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        return bookingService.complete(principal.getUser(), id);
    }

    @PostMapping("/{id}/cancel")
    public BookingResponse cancel(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @PathVariable Long id) {
        return bookingService.cancel(principal.getUser(), id);
    }
}
