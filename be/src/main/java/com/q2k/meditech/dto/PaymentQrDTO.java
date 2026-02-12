package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Payment QR code information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentQrDTO {
    
    private Long id;
    
    private Long paymentId;
    
    private String provider; // MOMO, VNPAY, VIETQR
    
    private String qrPayload; // QR code image URL
    
    private String payUrl; // MoMo payment URL (can open in browser)
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime expiresAt;
    
    private String status; // ACTIVE, EXPIRED, REVOKED
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    // Helper method
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }
}