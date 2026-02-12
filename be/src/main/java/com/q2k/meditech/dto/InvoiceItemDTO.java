package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * DTO for Invoice Item
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceItemDTO {
    
    private Long id;
    
    private String description;
    
    private Integer quantity;
    
    private BigDecimal unitPrice;
    
    private BigDecimal totalPrice;
}