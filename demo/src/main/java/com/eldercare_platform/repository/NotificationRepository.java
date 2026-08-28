package com.eldercare_platform.repository;

import com.eldercare_platform.entity.Notification;
import com.eldercare_platform.enums.NotificationType;
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

    /**
     * Clears one booking's notifications of a single type for one recipient.
     *
     * Scoped by type on purpose: opening a chat means the reader saw the messages,
     * not that they saw the booking was accepted, so status notifications survive.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Notification n
            SET n.readFlag = true
            WHERE n.recipient.id = :recipientId
              AND n.bookingId = :bookingId
              AND n.type = :type
              AND n.readFlag = false
            """)
    int markReadForBooking(@Param("recipientId") Long recipientId,
                           @Param("bookingId") Long bookingId,
                           @Param("type") NotificationType type);
}
