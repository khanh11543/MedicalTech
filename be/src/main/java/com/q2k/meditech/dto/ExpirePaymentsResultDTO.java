package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO for expire payments job result
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExpirePaymentsResultDTO {
    
    private Integer expiredCount;
    
    private Integer qrExpiredCount;
    
    @Builder.Default
    private List<Long> expiredPaymentIds = new ArrayList<>();
    
    @Builder.Default
    private List<Long> expiredQrIds = new ArrayList<>();
    
    private LocalDateTime executedAt;
    
    private Boolean dryRun;
    
    private String message;
}