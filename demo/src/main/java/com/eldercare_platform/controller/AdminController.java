package com.eldercare_platform.controller;

import com.eldercare_platform.dto.HelperResponse;
import com.eldercare_platform.service.HelperService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final HelperService helperService;

    /**
     * Vetting gate: a helper is invisible to elders until an admin flips this on,
     * after ID and background checks.
     */
    @PostMapping("/helpers/{helperUserId}/verification")
    public HelperResponse setVerified(
            @PathVariable Long helperUserId,
            @RequestParam boolean verified) {
        return helperService.setVerified(helperUserId, verified);
    }
}
