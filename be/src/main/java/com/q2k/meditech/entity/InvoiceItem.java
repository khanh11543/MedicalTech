package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "invoice_items")
public class InvoiceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="invoice_id", nullable = false)
    private Invoice invoice;

    @Column(nullable = false)
    private String description;

    private Integer quantity = 1;

    @Column(name="unit_price", nullable = false)
    private BigDecimal unitPrice;

    @Column(name="total_price", nullable = false)
    private BigDecimal totalPrice;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
