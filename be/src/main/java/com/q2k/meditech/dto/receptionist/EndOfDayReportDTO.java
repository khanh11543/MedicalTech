package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO for end-of-day report (Tab 5.4)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EndOfDayReportDTO {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate reportDate;

    private String generatedBy;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private java.time.LocalDateTime generatedAt;

    // Summary totals
    private BigDecimal totalRevenue;
    private Integer totalTransactions;
    private BigDecimal cashTotal;
    private Integer cashTransactions;
    private BigDecimal momoTotal;
    private Integer momoTransactions;

    // Pending summary
    private Integer pendingCount;
    private BigDecimal pendingAmount;

    // Transaction list (no PHI — only codes and amounts)
    private List<TransactionSummary> transactions;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionSummary {
        private String transactionCode;
        private String appointmentCode;

        @JsonFormat(pattern = "HH:mm:ss")
        private java.time.LocalTime paidTime;

        private BigDecimal amount;
        private String paymentMethod;
        private String status;
        private String collectedBy;
    }
}
