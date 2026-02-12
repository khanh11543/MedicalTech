package com.q2k.meditech.dto;

import lombok.*;

/**
 * DTO for send invoice result
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendInvoiceResultDTO {
    
    private Boolean emailSent;
    
    private Boolean smsSent;
    
    private String emailStatus;
    
    private String smsStatus;
    
    private String message;
    
    private Boolean success;
    
    public static SendInvoiceResultDTO success(String message) {
        return SendInvoiceResultDTO.builder()
                .success(true)
                .message(message)
                .build();
    }
    
    public static SendInvoiceResultDTO error(String message) {
        return SendInvoiceResultDTO.builder()
                .success(false)
                .message(message)
                .build();
    }
}