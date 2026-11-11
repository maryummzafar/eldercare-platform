package com.eldercare_platform.repository;

import com.eldercare_platform.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByBookingIdOrderByCreatedAtAsc(Long bookingId);

    /**
     * Marks everything the other side sent in this thread as read, in one statement.
     * Called when a participant opens the thread, so it must not fan out into a
     * select-then-save per message.
     */
    /**
     * On account deletion: blanks what this user wrote while keeping the rows, so the
     * other participant's thread still reads in order instead of losing half of it.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Message m SET m.body = :replacement WHERE m.sender.id = :senderId")
    int redactBySender(@Param("senderId") Long senderId, @Param("replacement") String replacement);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Message m
            SET m.readAt = :now
            WHERE m.booking.id = :bookingId
              AND m.sender.id <> :readerId
              AND m.readAt IS NULL
            """)
    int markThreadRead(@Param("bookingId") Long bookingId,
                       @Param("readerId") Long readerId,
                       @Param("now") Instant now);
}
