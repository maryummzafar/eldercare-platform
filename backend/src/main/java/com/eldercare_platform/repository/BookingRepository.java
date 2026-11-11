package com.eldercare_platform.repository;

import com.eldercare_platform.entity.Booking;
import com.eldercare_platform.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Page<Booking> findByElderIdOrderByScheduledStartDesc(Long elderId, Pageable pageable);

    Page<Booking> findByHelperIdOrderByScheduledStartDesc(Long helperId, Pageable pageable);

    /** Every booking this user is on, from either side, in the given states. */
    @Query("""
            SELECT b FROM Booking b
            WHERE (b.elder.id = :userId OR b.helper.id = :userId)
              AND b.status IN :statuses
            """)
    List<Booking> findForParticipantInStatuses(
            @Param("userId") Long userId,
            @Param("statuses") Collection<BookingStatus> statuses);

    /**
     * On account deletion: the elder's home address and free-text notes are personal
     * data, but the booking row itself stays as the helper's record of the visit.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Booking b SET b.serviceAddress = NULL, b.notes = NULL WHERE b.elder.id = :elderId")
    int scrubElderDetails(@Param("elderId") Long elderId);

    /**
     * Bookings for this helper that overlap the given window and still hold the slot.
     * Two intervals overlap when each starts before the other ends.
     */
    @Query("""
            SELECT b FROM Booking b
            WHERE b.helper.id = :helperId
              AND b.status IN :blockingStatuses
              AND b.scheduledStart < :end
              AND b.scheduledEnd > :start
            """)
    List<Booking> findOverlapping(
            @Param("helperId") Long helperId,
            @Param("start") Instant start,
            @Param("end") Instant end,
            @Param("blockingStatuses") Collection<BookingStatus> blockingStatuses);
}
