package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO for Daily Revenue Summary Report (Tab 6.2).
 * Cashier shift-end reconciliation.
 * No refunds or write-offs (admin-only).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyRevenueReportDTO {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate reportDate;

    private String generatedBy;
    private String branch;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime generatedAt;

    // --- Summary cards ---
    private BigDecimal totalRevenue;
    private BigDecimal cashTotal;
    private int cashTransactions;
    private BigDecimal momoTotal;
    private int momoTransactions;
    private int pendingPaymentsCount;
    private BigDecimal pendingPaymentsAmount;

    // --- Transaction table ---
    private List<TransactionRow> transactions;

    // --- Pending list ---
    private List<PendingRow> pendingPayments;

    // --- End-of-day extras ---
    private BigDecimal cashDrawerExpectedBalance;

    // ==================== Inner DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionRow {
        private String transactionCode;   // paymentCode

        @JsonFormat(pattern = "HH:mm:ss")
        private LocalTime paidTime;

        private String appointmentCode;
        private String patientName;       // full name (receptionist can see)
        private BigDecimal amount;
        private String paymentMethod;     // CASH / MOMO
        private String collectedBy;       // processedBy fullName
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PendingRow {
        private String paymentCode;
        private String appointmentCode;
        private String patientName;
        private String maskedPhone;
        private BigDecimal amount;

        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime createdAt;
    }
}
