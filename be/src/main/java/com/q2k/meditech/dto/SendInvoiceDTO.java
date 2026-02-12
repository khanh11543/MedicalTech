package com.q2k.meditech.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * DTO for sending invoice via Email/SMS
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendInvoiceDTO {
    
    private Boolean sendEmail;
    
    private Boolean sendSms;
    
    @Email(message = "Invalid email format")
    private String email; // Override patient email
    
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone must be 10-11 digits")
    private String phone; // Override patient phone
    
    private String message; // Custom message to include
}