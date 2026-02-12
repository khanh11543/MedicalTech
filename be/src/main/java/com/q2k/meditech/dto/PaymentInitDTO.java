package com.q2k.meditech.dto;

import lombok.*;

/**
 * DTO for payment initialization response (MoMo/VNPay)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentInitDTO {
    
    private Long paymentId;
    
    private String paymentCode;
    
    private String payUrl; // Deep link for app or web URL
    
    private String qrCodeUrl; // QR code image URL or base64
    
    private String orderId; // Gateway order ID
    
    private String message;
    
    private Boolean success;
}