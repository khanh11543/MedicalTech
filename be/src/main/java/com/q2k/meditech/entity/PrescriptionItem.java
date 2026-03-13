package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescription_id", nullable = false)
    private Prescription prescription;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName; // Medicine name

    @Column(name = "dosage", nullable = false)
    private String dosage; // Dosage (e.g., "500mg")

    @Column(name = "frequency", nullable = false)
    private String frequency; // Frequency (e.g., "twice daily")

    @Column(name = "duration")
    private String duration; // Duration (e.g., "7 days")

    @Column(name = "quantity")
    private Integer quantity; // Quantity

    @Column(name = "unit")
    private String unit; // Unit (tablet, packet, bottle...)

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions; // Usage instructions (e.g., "Take after meals")

    @Column(name = "notes")
    private String notes; // Additional notes

    @Column(name = "item_order")
    private Integer itemOrder; // Display order
}