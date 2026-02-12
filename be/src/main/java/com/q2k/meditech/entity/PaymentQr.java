package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "payment_qr")
public class PaymentQr {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name="payment_id", nullable = false, unique = true)
    private Payment payment;

    @Column(nullable = false, length = 30)
    private String provider; // VNPAY/MOMO/VIETQR...

    @Lob
    @Column(name="qr_payload", nullable = false)
    private String qrPayload;

    @Column(name="pay_url", length = 1000)
    private String payUrl; // MoMo payment URL for QR generation

    @Column(name="expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(length = 20)
    private String status = "ACTIVE"; // ACTIVE/EXPIRED/REVOKED

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="created_by")
    private User createdBy;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @Column(name="revoked_at")
    private LocalDateTime revokedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
