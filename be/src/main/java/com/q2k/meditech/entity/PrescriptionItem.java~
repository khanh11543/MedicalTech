package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "prescription_items")
public class PrescriptionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="prescription_id", nullable = false)
    private Prescription prescription;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="medication_id")
    private Medication medication;

    @Column(name="medication_name", nullable = false)
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

    @Column(name="morning_dose", length = 50)
    private String morningDose;

    @Column(name="noon_dose", length = 50)
    private String noonDose;

    @Column(name="evening_dose", length = 50)
    private String eveningDose;

    @Column(name="night_dose", length = 50)
    private String nightDose;

    @Column(name="take_with_food")
    private Boolean takeWithFood = false;

    @Lob
    private String instructions;

    @Column(name="created_at")
    private java.time.LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = java.time.LocalDateTime.now();
    }
}
