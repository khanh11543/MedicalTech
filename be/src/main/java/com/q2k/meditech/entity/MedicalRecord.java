package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "medical_records")
public class MedicalRecord extends BaseEntity {

    @Column(name="record_code", nullable = false, unique = true, length = 20)
    private String recordCode;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="appointment_id")
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name="doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name="visit_date", nullable = false)
    private LocalDate visitDate;

    @Lob
    @Column(name="chief_complaint")
    private String chiefComplaint;

    @Lob
    @Column(name="present_illness")
    private String presentIllness;

    // JSON: vital_signs, lab_results, attachments
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="vital_signs", columnDefinition = "json")
    private Object vitalSigns;

    @Lob
    @Column(name="physical_exam")
    private String physicalExam;

    @Lob
    private String diagnosis;

    @Column(name="diagnosis_code", length = 20)
    private String diagnosisCode;

    @Lob
    @Column(name="treatment_plan")
    private String treatmentPlan;

    @Lob
    private String prescription;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="lab_results", columnDefinition = "json")
    private Object labResults;

    @Column(name="follow_up_date")
    private LocalDate followUpDate;

    @Lob
    @Column(name="follow_up_notes")
    private String followUpNotes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name="attachments", columnDefinition = "json")
    private Object attachments;

    @Builder.Default
    @Column(name="is_confidential")
    private Boolean isConfidential = false;
}
