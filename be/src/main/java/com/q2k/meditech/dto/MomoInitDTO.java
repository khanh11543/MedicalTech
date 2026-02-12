package com.q2k.meditech.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO for MoMo payment initialization
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MomoInitDTO {
    
    @Size(max = 500, message = "Order info must not exceed 500 characters")
    private String orderInfo;
    
    private String redirectUrl; // Optional custom redirect URL
    
    private String ipnUrl; // Optional custom IPN URL
}