package com.eldercare_platform.controller;

import com.eldercare_platform.dto.DeleteAccountRequest;
import com.eldercare_platform.dto.MeResponse;
import com.eldercare_platform.dto.IdentityVerificationResponse;
import com.eldercare_platform.dto.VerifyEmailRequest;
import com.eldercare_platform.security.AuthenticatedUser;
import com.eldercare_platform.service.AccountService;
import com.eldercare_platform.service.IdentityVerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final IdentityVerificationService identityVerificationService;

    /** The signed-in user as stored now, e.g. after confirming their email on another device. */
    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal AuthenticatedUser principal) {
        return MeResponse.from(principal.getUser());
    }

    /** Confirms the email address with the code sent at signup. */
    @PostMapping("/verify-email")
    public MeResponse verifyEmail(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody VerifyEmailRequest request) {
        return accountService.verifyEmail(principal.getUser(), request.getCode());
    }

    /** Sends a fresh confirmation code. At most once a minute. */
    @PostMapping("/verify-email/resend")
    public ResponseEntity<Void> resendVerification(@AuthenticationPrincipal AuthenticatedUser principal) {
        accountService.resendVerification(principal.getUser());
        return ResponseEntity.accepted().build();
    }

    /** Requests a manual video identity review; no video or document is uploaded here. */
    @PostMapping("/identity-verification")
    public IdentityVerificationResponse requestIdentityVerification(
            @AuthenticationPrincipal AuthenticatedUser principal) {
        return identityVerificationService.requestReview(principal.getUser());
    }

    /**
     * Permanently deletes the caller's account. POST rather than DELETE because it
     * carries a body (the password), which some proxies strip from DELETE requests.
     */
    @PostMapping("/delete")
    public ResponseEntity<Void> deleteMyAccount(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody DeleteAccountRequest request) {
        accountService.deleteAccount(principal.getUser(), request.getPassword());
        return ResponseEntity.noContent().build();
    }
}
