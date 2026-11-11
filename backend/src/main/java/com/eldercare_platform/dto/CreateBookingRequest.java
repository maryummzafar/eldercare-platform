package com.eldercare_platform.dto;

import com.eldercare_platform.enums.ServiceType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.Instant;

@Data
public class CreateBookingRequest {

    @NotNull(message = "Helper is required")
    private Long helperId;

    @NotNull(message = "Service type is required")
    private ServiceType serviceType;

    @NotNull(message = "Start time is required")
    @Future(message = "Start time must be in the future")
    private Instant scheduledStart;

    @NotNull(message = "End time is required")
    @Future(message = "End time must be in the future")
    private Instant scheduledEnd;

    private String serviceAddress;

    @Size(max = 1000)
    private String notes;
}
