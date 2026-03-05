package com.q2k.meditech.dto.settings;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSettingsDTO {

    // Payment Methods
    private boolean cashEnabled;
    private boolean cardEnabled;
    private boolean bankTransferEnabled;
    private boolean insuranceEnabled;
    private boolean momoEnabled;
    private boolean zalopayEnabled;
    private boolean vnpayEnabled;

    // Payment Gateways
    private List<PaymentGatewayDTO> gateways;

    // Pricing & Fees
    private double taxRate;
    private String transactionFeePayor; // clinic, patient, split
    private double transactionFeePercent;
    private String currency;

    // Refund Policy
    private boolean enableRefundPolicy;
    private int refundProcessingDays;
    private boolean refundToOriginalMethod;
    private boolean refundToBankTransfer;
    private boolean refundToCredit;
    private boolean allowPartialRefund;
    private double refundFeePercent;

    // Invoice Settings
    private boolean autoGenerateInvoice;
    private String invoicePrefix;
    private String invoiceNumberFormat; // sequential, date-based, custom
    private boolean includeTaxOnInvoice;
    private String invoiceFooterText;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PaymentGatewayDTO {
        private String name;
        private String apiKey;
        private String secretKey;
        private String merchantId;
        private boolean testMode;
        private boolean enabled;
    }
}
