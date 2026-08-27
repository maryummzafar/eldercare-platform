package com.eldercare_platform.dto;

import com.eldercare_platform.entity.Booking;
import com.eldercare_platform.enums.BookingStatus;
import com.eldercare_platform.enums.ServiceType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
public class BookingResponse {

    private Long id;
    private Long elderId;
    private String elderName;
    private Long helperId;
    private String helperName;
    private ServiceType serviceType;
    private BookingStatus status;
    private Instant scheduledStart;
    private Instant scheduledEnd;
    private Instant actualStart;
    private Instant actualEnd;
    private BigDecimal hourlyRate;
    private BigDecimal estimatedTotal;
    private BigDecimal finalTotal;
    private String serviceAddress;
    private String notes;
    private Instant createdAt;

    public static BookingResponse from(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .elderId(booking.getElder().getId())
                .elderName(booking.getElder().getName())
                .helperId(booking.getHelper().getId())
                .helperName(booking.getHelper().getName())
                .serviceType(booking.getServiceType())
                .status(booking.getStatus())
                .scheduledStart(booking.getScheduledStart())
                .scheduledEnd(booking.getScheduledEnd())
                .actualStart(booking.getActualStart())
                .actualEnd(booking.getActualEnd())
                .hourlyRate(booking.getHourlyRate())
                .estimatedTotal(booking.getEstimatedTotal())
                .finalTotal(booking.getFinalTotal())
                .serviceAddress(booking.getServiceAddress())
                .notes(booking.getNotes())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
