package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * DTO for updating invoice information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceUpdateDTO {
    
    private String notes;
    
    private LocalDate dueDate;
    
    private String status; // PAID, UNPAID, OVERDUE, CANCELLED
}