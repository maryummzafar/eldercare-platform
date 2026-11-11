package com.eldercare_platform.dto;

import com.eldercare_platform.enums.IdentityVerificationStatus;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class IdentityVerificationDecisionRequest {

    private IdentityVerificationStatus status;

    @Size(max = 500)
    private String note;
}