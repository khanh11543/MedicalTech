package com.q2k.meditech.dto;

import lombok.*;

/**
 * DTO for retrying a failed refund
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RetryRefundDTO {
    /**
     * Optional: switch to a different method on retry (e.g., from AUTO to MANUAL)
     */
    private String refundMethod;

    /**
     * Optional: switch refund type (AUTO / MANUAL) on retry
     */
    private String refundType;

    private String notes;

    @Builder.Default
    private Boolean sendNotification = true;
}
