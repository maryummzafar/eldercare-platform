package com.eldercare_platform.repository;

import com.eldercare_platform.entity.HelperProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

/**
 * Search is expressed as a {@link org.springframework.data.jpa.domain.Specification}
 * (see {@code HelperService#search}) rather than a JPQL query with optional parameters.
 *
 * <p>A query of the form {@code :city IS NULL OR LOWER(h.city) = LOWER(:city)} binds a
 * null parameter of unknown type, which PostgreSQL infers as {@code bytea} and then
 * rejects with "function lower(bytea) does not exist". Building the predicate list
 * dynamically omits the clause entirely when the filter is absent.
 */
public interface HelperProfileRepository
        extends JpaRepository<HelperProfile, Long>, JpaSpecificationExecutor<HelperProfile> {

    Optional<HelperProfile> findByUserId(Long userId);

    /**
     * The admin vetting queue. Oldest first, so nobody waits behind newer signups.
     *
     * <p>No {@code @EntityGraph} here: a fetch graph turns every attribute it does not
     * list lazy, including the otherwise-eager {@code offeredServices}, which then fails
     * to load once the transaction has closed.
     */
    Page<HelperProfile> findByVerifiedOrderByIdAsc(boolean verified, Pageable pageable);

    boolean existsByUserId(Long userId);
}
