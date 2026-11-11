package com.eldercare_platform.controller;

import com.eldercare_platform.dto.HelperProfileRequest;
import com.eldercare_platform.dto.HelperResponse;
import com.eldercare_platform.enums.ServiceType;
import com.eldercare_platform.security.AuthenticatedUser;
import com.eldercare_platform.service.HelperService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/helpers")
@RequiredArgsConstructor
public class HelperController {

    private final HelperService helperService;

    /** Elder-facing search over verified, available helpers. */
    @GetMapping
    public Page<HelperResponse> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) BigDecimal maxRate,
            @RequestParam(required = false) ServiceType service,
            @PageableDefault(size = 20) Pageable pageable) {
        return helperService.search(city, maxRate, service, pageable);
    }

    @GetMapping("/me")
    public HelperResponse myProfile(@AuthenticationPrincipal AuthenticatedUser principal) {
        return helperService.getMyProfile(principal.getUser());
    }

    @GetMapping("/{helperUserId}")
    public HelperResponse getOne(@PathVariable Long helperUserId) {
        return helperService.getByUserId(helperUserId);
    }

    /** Create or update the calling helper's own profile. */
    @PutMapping("/me")
    public HelperResponse saveMyProfile(
            @AuthenticationPrincipal AuthenticatedUser principal,
            @Valid @RequestBody HelperProfileRequest request) {
        return helperService.saveMyProfile(principal.getUser(), request);
    }
}
