package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for processing a refund request
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessRefundDTO {
    
    private LocalDateTime processedDate; // Optional, default = now
    
    private String transactionReference; // Optional, external transaction reference
    
    private String processingNotes; // Optional

    // Refund method & type for manual refunds
    private String refundMethod; // CASH, MOMO, BANK_TRANSFER, etc.
    private String refundType;   // AUTO or MANUAL

    // Evidence for manual/cash refunds
    private String evidenceUrl;
    private String workstationId;
    private Boolean cashierConfirmed;
    
    @Builder.Default
    private Boolean sendNotification = true; // Send notification to patient
}
