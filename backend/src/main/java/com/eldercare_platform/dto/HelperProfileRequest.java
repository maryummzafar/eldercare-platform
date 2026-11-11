package com.eldercare_platform.dto;

import com.eldercare_platform.enums.ServiceType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Set;

@Data
public class HelperProfileRequest {

    @Size(max = 1000)
    private String bio;

    @NotNull(message = "Hourly rate is required")
    @DecimalMin(value = "1.00", message = "Hourly rate must be at least 1.00")
    @DecimalMax(value = "10000.00", message = "Hourly rate is unrealistically high")
    private BigDecimal hourlyRate;

    @Size(max = 100, message = "City must be at most 100 characters")
    private String city;

    @NotEmpty(message = "Select at least one service you offer")
    private Set<ServiceType> offeredServices;

    private Boolean acceptingBookings;
}
