package com.eldercare_platform.repository;

import com.eldercare_platform.entity.Booking;
import com.eldercare_platform.enums.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    Page<Booking> findByElderIdOrderByScheduledStartDesc(Long elderId, Pageable pageable);

    Page<Booking> findByHelperIdOrderByScheduledStartDesc(Long helperId, Pageable pageable);

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
