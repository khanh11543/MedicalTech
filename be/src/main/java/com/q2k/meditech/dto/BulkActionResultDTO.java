package com.q2k.meditech.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

/**
 * DTO for bulk action results
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkActionResultDTO {
    
    private Integer totalProcessed;
    private Integer successCount;
    private Integer failCount;
    
    /**
     * List of individual results
     */
    private List<ItemResult> results;
    
    /**
     * Summary message
     */
    private String message;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemResult {
        private Long appointmentId;
        private String appointmentCode;
        private Boolean success;
        private String message;
        private String errorCode;
    }
    
    /**
     * Helper to create success result
     */
    public static ItemResult successItem(Long id, String code, String message) {
        return ItemResult.builder()
                .appointmentId(id)
                .appointmentCode(code)
                .success(true)
                .message(message)
                .build();
    }
    
    /**
     * Helper to create failure result
     */
    public static ItemResult failItem(Long id, String code, String message, String errorCode) {
        return ItemResult.builder()
                .appointmentId(id)
                .appointmentCode(code)
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .build();
    }
}
