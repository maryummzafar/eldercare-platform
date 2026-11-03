package com.eldercare_platform.repository;

import com.eldercare_platform.entity.IdentityVerificationEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IdentityVerificationEventRepository extends JpaRepository<IdentityVerificationEvent, Long> {
}