package com.eldercare_platform.repository;

import com.eldercare_platform.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId, Pageable pageable);

    long countByRecipientIdAndReadFlagFalse(Long recipientId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.readFlag = true WHERE n.recipient.id = :recipientId AND n.readFlag = false")
    int markAllRead(@Param("recipientId") Long recipientId);
}
