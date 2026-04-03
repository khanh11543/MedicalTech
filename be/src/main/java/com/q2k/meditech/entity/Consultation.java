package com.q2k.meditech.entity;

import lombok.*;
import com.q2k.meditech.entity.enums.ConsultationStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Consultation Record Entity - Medical examination notes by doctor
 */
@Entity
@Table(name = "consultations", indexes = {
    @Index(name = "idx_appointment_id", columnList = "appointment_id"),
    @Index(name = "idx_patient_id", columnList = "patient_id"),
    @Index(name = "idx_doctor_id", columnList = "doctor_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_is_locked", columnList = "isLocked")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Consultation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ConsultationStatus status = ConsultationStatus.DRAFT;

    // Chief complaint (required)
    @Column(name = "chief_complaint", nullable = false, columnDefinition = "TEXT")
    private String chiefComplaint;

    // History of Present Illness
    @Column(name = "hpi", columnDefinition = "TEXT")
    private String hpi;

    // Vitals - stored as JSON
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "vitals", columnDefinition = "json")
    private VitalsData vitals;

    // Physical examination findings
    @Column(name = "physical_exam", columnDefinition = "TEXT")
    private String physicalExam;

    // Diagnosis (required)
    @Column(name = "diagnosis", nullable = false, columnDefinition = "TEXT")
    private String diagnosis;

    // ICD-10 diagnostic code
    @Column(name = "diagnostic_code", length = 20)
    private String diagnosticCode;

    // Treatment plan
    @Column(name = "plan", columnDefinition = "TEXT")
    private String plan;

    // Follow-up instructions
    @Column(name = "follow_up_instructions", columnDefinition = "TEXT")
    private String followUpInstructions;

    // Record locking
    @Column(name = "isLocked", nullable = false)
    @Builder.Default
    private Boolean isLocked = false;

    // Finalization timestamp
    @Column(name = "finalized_at")
    private LocalDateTime finalizedAt;

    // Doctor who finalized
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finalized_by_user_id")
    private User finalizedByUser;

    // Amendments/Addendums - one to many relationship
    @OneToMany(mappedBy = "consultation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Amendment> amendments = new ArrayList<>();

    // Attachments - one to many relationship
    @OneToMany(mappedBy = "consultation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ConsultationAttachment> attachments = new ArrayList<>();

    // Helper methods
    public void addAmendment(Amendment amendment) {
        amendments.add(amendment);
        amendment.setConsultation(this);
    }

    public void addAttachment(ConsultationAttachment attachment) {
        attachments.add(attachment);
        attachment.setConsultation(this);
    }

    public void finalize(User finalizedByUser) {
        this.status = ConsultationStatus.FINALIZED;
        this.isLocked = true;
        this.finalizedAt = LocalDateTime.now();
        this.finalizedByUser = finalizedByUser;
    }

    /**
     * Nested class for Vitals data stored as JSON
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VitalsData {
        private BigDecimal temperature;  // °C
        private Integer systolic;        // mmHg - SBP
        private Integer diastolic;       // mmHg - DBP
        private Integer heartRate;       // bpm
        private Integer respiratoryRate; // bpm
        private Integer height;          // cm
        private Integer weight;          // kg
        private BigDecimal bmi;          // calculated
    }
}
