package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "payments")
public class Payment extends BaseEntity {

    @Column(name="payment_code", nullable = false, unique = true, length = 20)
    private String paymentCode;

    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name="appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="patient_id", nullable = false)
    private Patient patient;

    @Column(nullable = false)
    private BigDecimal amount;

    @Builder.Default
    @Column(name="discount_amount")
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name="tax_amount")
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name="total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(length = 3)
    private String currency = "VND";

    @Column(name="payment_method", length = 30)
    private String paymentMethod; // CASH/VNPAY/MOMO...

    @Builder.Default
    @Column(name="payment_status", length = 20)
    private String paymentStatus = "PENDING";

    @Column(name="transaction_id", length = 100)
    private String transactionId;

    @Column(name="momo_order_id", length = 100)
    private String momoOrderId; // Latest MoMo orderId (may include -R suffix for refreshes)

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="gateway_response", columnDefinition = "json")
    private Object gatewayResponse;

    @Column(name="paid_at")
    private LocalDateTime paidAt;

    @Column(name="refunded_at")
    private LocalDateTime refundedAt;

    @Column(name="refund_amount")
    private BigDecimal refundAmount;

    @Lob
    @Column(name="refund_reason")
    private String refundReason;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="processed_by")
    private User processedBy;

    @Column(name="amount_received")
    private BigDecimal amountReceived;

    @Column(name="change_given")
    private BigDecimal changeGiven;

    @Lob
    private String notes;

    @OneToOne(mappedBy = "payment", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private PaymentQr paymentQr;
}
