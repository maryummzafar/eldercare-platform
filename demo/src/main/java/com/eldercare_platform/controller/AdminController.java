package com.eldercare_platform.controller;

import com.eldercare_platform.dto.AdminHelperResponse;
import com.eldercare_platform.service.HelperService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final HelperService helperService;

    /** The vetting queue by default; pass {@code verified=true} to review approved helpers. */
    @GetMapping("/helpers")
    public Page<AdminHelperResponse> listHelpers(
            @RequestParam(defaultValue = "false") boolean verified,
            @PageableDefault(size = 50) Pageable pageable) {
        return helperService.listForAdmin(verified, pageable);
    }

    /**
     * Vetting gate: a helper is invisible to elders until an admin flips this on,
     * after ID and background checks.
     */
    @PostMapping("/helpers/{helperUserId}/verification")
    public AdminHelperResponse setVerified(
            @PathVariable Long helperUserId,
            @RequestParam boolean verified) {
        return helperService.setVerified(helperUserId, verified);
    }
}
