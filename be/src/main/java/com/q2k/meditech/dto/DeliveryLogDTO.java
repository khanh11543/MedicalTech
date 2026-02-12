package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for delivery log (email/SMS sending history)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryLogDTO {
    
    private Long id;
    
    private Long paymentId;
    
    private String deliveryType; // EMAIL, SMS
    
    private String recipient; // Email address or phone number
    
    private String status; // SENT, FAILED, PENDING
    
    private String message;
    
    private String errorMessage;
    
    private Long sentBy;
    
    private String sentByName;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime sentAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}