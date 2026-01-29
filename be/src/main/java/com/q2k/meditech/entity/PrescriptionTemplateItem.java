package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "prescription_template_items",
        indexes = {
                @Index(name="idx_template_items_template", columnList = "template_id"),
                @Index(name="idx_template_items_medication", columnList = "medication_id")
        }
)
public class PrescriptionTemplateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK prescription_templates(id)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="template_id", nullable = false)
    private PrescriptionTemplate template;

    // FK medications(id) optional
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="medication_id")
    private Medication medication;

    @Column(name="medication_name", nullable = false, length = 255)
    private String medicationName;

    @Column(length = 100)
    private String dosage;

    @Column(length = 100)
    private String frequency;

    @Column(length = 100)
    private String duration;

    private Integer quantity;

    @Column(length = 50)
    private String unit;

    @Column(name="take_with_food")
    private Boolean takeWithFood = false;

    @Lob
    private String instructions;

    @PrePersist
    void prePersist() {
        if (takeWithFood == null) takeWithFood = false;
    }
}
