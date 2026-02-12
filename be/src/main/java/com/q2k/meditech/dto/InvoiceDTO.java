package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for Invoice response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceDTO {
    
    private Long id;
    
    private String invoiceNumber;
    
    private Long paymentId;
    
    private String paymentCode;
    
    private Long patientId;
    
    private String patientName;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate invoiceDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dueDate;
    
    private BigDecimal subtotal;
    
    private BigDecimal discount;
    
    private BigDecimal tax;
    
    private BigDecimal total;
    
    private String status; // ISSUED, PAID, CANCELLED, REFUNDED
    
    private String notes;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    // Invoice items
    private List<InvoiceItemDTO> items;
}