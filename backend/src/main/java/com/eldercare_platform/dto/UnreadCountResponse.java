package com.eldercare_platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/** Polled frequently by the client's badge, so it stays deliberately tiny. */
@Data
@AllArgsConstructor
public class UnreadCountResponse {
    private long unread;
}
