package com.eldercare_platform.repository;

import com.eldercare_platform.entity.User;
import com.eldercare_platform.enums.IdentityVerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Page<User> findByIdentityVerificationStatusOrderByIdentityVerificationUpdatedAtAsc(
            IdentityVerificationStatus status, Pageable pageable);
}
