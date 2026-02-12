package com.q2k.meditech.dto;

import lombok.*;

/**
 * DTO for expire payments job parameters
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpirePaymentsDTO {
    
    @Builder.Default
    private Integer expiryMinutes = 15; // Default QR expiry time
    
    private Boolean dryRun; // If true, only count without updating
    
    private String targetStatus; // Optional: only expire specific status (PENDING, INITIATED)
}