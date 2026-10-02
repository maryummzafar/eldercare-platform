package com.eldercare_platform.service;

import com.eldercare_platform.dto.AdminHelperResponse;
import com.eldercare_platform.dto.HelperProfileRequest;
import com.eldercare_platform.dto.HelperResponse;
import com.eldercare_platform.entity.HelperProfile;
import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.ServiceType;
import com.eldercare_platform.enums.UserRole;
import com.eldercare_platform.exception.ApiException;
import com.eldercare_platform.repository.HelperProfileRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class HelperService {

    private final HelperProfileRepository helperProfileRepository;

    /** Creates the caller's helper profile, or updates it if they already have one. */
    @Transactional
    public HelperResponse saveMyProfile(User helper, HelperProfileRequest request) {
        if (helper.getRole() != UserRole.HELPER) {
            throw ApiException.forbidden("Only helpers can maintain a helper profile");
        }

        HelperProfile profile = helperProfileRepository.findByUserId(helper.getId())
                .orElseGet(() -> HelperProfile.builder()
                        .user(helper)
                        .offeredServices(new HashSet<>())
                        .build());

        profile.setBio(request.getBio());
        profile.setHourlyRate(request.getHourlyRate());
        profile.setCity(request.getCity());
        profile.setOfferedServices(new HashSet<>(request.getOfferedServices()));

        if (request.getAcceptingBookings() != null) {
            profile.setAcceptingBookings(request.getAcceptingBookings());
        }

        // Note: `verified` is intentionally not settable here — only an admin can grant it.
        return HelperResponse.from(helperProfileRepository.save(profile));
    }

    @Transactional(readOnly = true)
    public HelperResponse getMyProfile(User helper) {
        return HelperResponse.from(helperProfileRepository.findByUserId(helper.getId())
                .orElseThrow(() -> ApiException.notFound("You have not set up a helper profile yet")));
    }

    /**
     * Finds bookable helpers. Every filter is optional; an absent one contributes no
     * predicate at all rather than binding a null parameter, which PostgreSQL cannot
     * type-infer. Verified + acceptingBookings are always enforced, so an unvetted
     * helper can never surface to an elder.
     */
    @Transactional(readOnly = true)
    public Page<HelperResponse> search(String city, BigDecimal maxRate, ServiceType service, Pageable pageable) {
        Specification<HelperProfile> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isTrue(root.get("verified")));
            predicates.add(cb.isTrue(root.get("acceptingBookings")));

            if (city != null && !city.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase(Locale.ROOT)));
            }
            if (maxRate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("hourlyRate"), maxRate));
            }
            if (service != null) {
                predicates.add(cb.isMember(service, root.get("offeredServices")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return helperProfileRepository.findAll(spec, pageable).map(HelperResponse::from);
    }

    @Transactional(readOnly = true)
    public HelperResponse getByUserId(Long helperUserId) {
        HelperProfile profile = helperProfileRepository.findByUserId(helperUserId)
                .orElseThrow(() -> ApiException.notFound("Helper not found"));

        if (!profile.isVerified()) {
            throw ApiException.notFound("Helper not found");
        }
        return HelperResponse.from(profile);
    }

    /** Admin-only: helpers filtered by verification state, with contact details for vetting. */
    @Transactional(readOnly = true)
    public Page<AdminHelperResponse> listForAdmin(boolean verified, Pageable pageable) {
        return helperProfileRepository.findByVerifiedOrderByIdAsc(verified, pageable)
                .map(AdminHelperResponse::from);
    }

    /** Admin-only: marks a helper as vetted, making them visible in search. */
    @Transactional
    public AdminHelperResponse setVerified(Long helperUserId, boolean verified) {
        HelperProfile profile = helperProfileRepository.findByUserId(helperUserId)
                .orElseThrow(() -> ApiException.notFound("Helper not found"));
        profile.setVerified(verified);
        return AdminHelperResponse.from(profile);
    }
}
