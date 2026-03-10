package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.BookedBy;
import jakarta.persistence.*;
import lombok.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "appointments", indexes = {
        @Index(name = "idx_appointment_date", columnList = "appointment_date"),
        @Index(name = "idx_appointment_status", columnList = "status"),
        @Index(name = "idx_appointment_doctor", columnList = "doctor_id"),
        @Index(name = "idx_appointment_patient", columnList = "patient_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(name = "appointment_time", nullable = false)
    private LocalTime appointmentTime;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PENDING;

    @Column(name = "appointment_code", unique = true)
    private String appointmentCode;

    @Column(name = "appointment_type", length = 30)
    private String appointmentType; // CONSULTATION, FOLLOW_UP, EMERGENCY, CHECKUP

    @Enumerated(EnumType.STRING)
    @Column(name = "booked_by", nullable = false, length = 20, columnDefinition = "VARCHAR(20)")
    private BookedBy bookedBy;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booked_by_user_id")
    private User bookedByUser; // User đã đặt lịch (receptionist nếu đặt hộ)

    @Column(name = "queue_number")

    private Integer queueNumber; // Số thứ tự khi check-in

    @Column(name = "reason_for_visit", columnDefinition = "TEXT")
    private String reasonForVisit;

    @Column(name = "symptoms", columnDefinition = "TEXT")
    private String symptoms;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "cancelled_by")
    private Long cancelledBy; // User ID người hủy

    @Column(name = "checked_in_at")
    private java.time.LocalDateTime checkedInAt;
    
    @Column(name = "checked_in_by")
    private Long checkedInBy; // User ID người check-in (receptionist/admin)
    
    @Column(name = "consultation_started_at")
    private java.time.LocalDateTime consultationStartedAt;
    
    @Column(name = "consultation_ended_at")
    private java.time.LocalDateTime consultationEndedAt;
    
    @Column(name = "doctor_notes", columnDefinition = "TEXT")
    private String doctorNotes;
    
    @Column(name = "diagnosis", columnDefinition = "TEXT")
    private String diagnosis;
    
    @Column(name = "prescription_text", columnDefinition = "TEXT")
    private String prescription;
    
    @Column(name = "follow_up_recommendations", columnDefinition = "TEXT")
    private String followUpRecommendations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_slot_id")
    private TimeSlot timeSlot;

    @PrePersist
    private void onPrePersist() {
        syncAppointmentTime();
        if (this.appointmentCode == null || this.appointmentCode.isBlank()) {
            this.appointmentCode = "APT-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    private void onPreUpdate() {
        syncAppointmentTime();
    }

    private void syncAppointmentTime() {
        if (this.appointmentTime == null && this.startTime != null) {
            this.appointmentTime = this.startTime;
        }
    }

    @OneToMany(mappedBy = "appointment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("changedAt DESC")
    @org.hibernate.annotations.BatchSize(size = 10)
    @Builder.Default
    private List<AppointmentHistory> histories = new ArrayList<>();

    // Helper method để thêm history
    public void addHistory(AppointmentHistory history) {
        histories.add(history);
        history.setAppointment(this);
    }
}

