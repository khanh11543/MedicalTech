package com.q2k.meditech.dto;

import lombok.*;

/**
 * DTO for MoMo webhook callback
 * Based on MoMo IPN specification
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MomoWebhookDTO {
    
    private String partnerCode;
    
    private String orderId;
    
    private String requestId;
    
    private Long amount;
    
    private String orderInfo;
    
    private String orderType;
    
    private Long transId; // MoMo transaction ID
    
    private Integer resultCode; // 0 = success, others = error
    
    private String message;
    
    private String payType;
    
    private Long responseTime;
    
    private String extraData;
    
    private String signature;
}