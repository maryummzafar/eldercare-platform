package com.eldercare_platform.repository;

import com.eldercare_platform.entity.HelperProfile;
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

    boolean existsByUserId(Long userId);
}
