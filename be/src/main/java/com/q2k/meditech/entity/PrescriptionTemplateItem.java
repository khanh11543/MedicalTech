package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "prescription_template_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionTemplateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private PrescriptionTemplate template;

    @Column(name = "medicine_name", nullable = false)
    private String medicineName; // Medicine name

    @Column(name = "default_dosage", nullable = false)
    private String defaultDosage; // Default dosage

    @Column(name = "default_frequency", nullable = false)
    private String defaultFrequency; // Default frequency

    @Column(name = "default_duration")
    private String defaultDuration; // Default duration

    @Column(name = "default_quantity")
    private Integer defaultQuantity; // Default quantity

    @Column(name = "unit")
    private String unit; // Unit

    @Column(name = "default_instructions", columnDefinition = "TEXT")
    private String defaultInstructions; // Default instructions

    @Column(name = "notes")
    private String notes;

    @Column(name = "item_order")
    private Integer itemOrder; // Display order
}