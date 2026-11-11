package com.eldercare_platform.repository;

import com.eldercare_platform.entity.VerificationCode;
import com.eldercare_platform.enums.CodePurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface VerificationCodeRepository extends JpaRepository<VerificationCode, Long> {

    /** The newest code of this purpose, used or not, for the resend cooldown. */
    Optional<VerificationCode> findFirstByUserIdAndPurposeOrderByCreatedAtDesc(Long userId, CodePurpose purpose);

    /** Retires every outstanding code of this purpose, so only the newest one works. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE VerificationCode c
            SET c.consumedAt = :now
            WHERE c.user.id = :userId AND c.purpose = :purpose AND c.consumedAt IS NULL
            """)
    int retireOutstanding(@Param("userId") Long userId,
                          @Param("purpose") CodePurpose purpose,
                          @Param("now") Instant now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM VerificationCode c WHERE c.user.id = :userId")
    int deleteByUser(@Param("userId") Long userId);
}
