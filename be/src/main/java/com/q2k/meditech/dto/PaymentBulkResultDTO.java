package com.q2k.meditech.dto;

import lombok.*;

import java.util.List;

/**
 * DTO for payment bulk action results
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentBulkResultDTO {

    private Integer totalProcessed;
    private Integer successCount;
    private Integer failCount;

    /**
     * List of individual results
     */
    private List<PaymentItemResult> results;

    /**
     * Summary message
     */
    private String message;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentItemResult {
        private Long paymentId;
        private String paymentCode;
        private Boolean success;
        private String message;
        private String errorCode;
    }

    /**
     * Helper to create success result
     */
    public static PaymentItemResult successItem(Long id, String code, String message) {
        return PaymentItemResult.builder()
                .paymentId(id)
                .paymentCode(code)
                .success(true)
                .message(message)
                .build();
    }

    /**
     * Helper to create failure result
     */
    public static PaymentItemResult failItem(Long id, String code, String message, String errorCode) {
        return PaymentItemResult.builder()
                .paymentId(id)
                .paymentCode(code)
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .build();
    }
}
