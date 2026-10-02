package com.eldercare_platform.controller;

import com.eldercare_platform.dto.DeleteAccountRequest;
import com.eldercare_platform.security.AuthenticatedUser;
import com.eldercare_platform.service.AccountService;
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
