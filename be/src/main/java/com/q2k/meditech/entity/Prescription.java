package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.PrescriptionStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prescriptions", indexes = {
        @Index(name = "idx_prescription_patient", columnList = "patient_id"),
        @Index(name = "idx_prescription_doctor", columnList = "doctor_id"),
        @Index(name = "idx_prescription_date", columnList = "prescription_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment; // Linked to a visit (optional)

    @Column(name = "prescription_code", unique = true)
    private String prescriptionCode; // Auto-generated: PRE-{id} or UUID

    @Column(name = "prescription_date", nullable = false)
    private LocalDate prescriptionDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate; // When the prescription expires

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private PrescriptionStatus status = PrescriptionStatus.ACTIVE;

    @Column(name = "diagnosis", columnDefinition = "TEXT")
    private String diagnosis; // Diagnosis

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes; // Additional notes

    @Column(name = "follow_up_date")
    private LocalDate followUpDate; // Follow-up date

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true)
    @org.hibernate.annotations.BatchSize(size = 10)
    @Builder.Default
    private List<PrescriptionItem> items = new ArrayList<>();

    // Helper method to add item
    public void addItem(PrescriptionItem item) {
        items.add(item);
        item.setPrescription(this);
    }

    // Helper method to remove item
    public void removeItem(PrescriptionItem item) {
        items.remove(item);
        item.setPrescription(null);
    }

    // Helper method to clear and set items
    public void setItems(List<PrescriptionItem> newItems) {
        this.items.clear();
        if (newItems != null) {
            newItems.forEach(this::addItem);
        }
    }
}