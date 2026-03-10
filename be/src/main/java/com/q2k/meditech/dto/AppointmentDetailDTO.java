package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.BookedBy;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Comprehensive DTO for appointment detail view
 * Includes all related data for the detail page
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentDetailDTO {

    // Basic appointment info
    private Long id;
    private String appointmentCode;
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private AppointmentStatus status;
    private BookedBy bookedBy;
    private String bookedByUserName;
    private Integer queueNumber;
    private String reasonForVisit;
    private String symptoms;
    private String notes;
    private String cancellationReason;
    private LocalDateTime checkedInAt;
    private String appointmentType;
    private String doctorNotes;
    private String diagnosis;
    private Integer duration; // in minutes
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Flat patient info (for frontend compatibility)
    private Long patientId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;
    private String patientAvatar;
    private String patientDob;
    private String patientGender;
    private String patientAddress;

    // Flat doctor info (for frontend compatibility)
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String doctorEmail;
    private String doctorPhone;
    private String doctorAvatar;
    private BigDecimal doctorConsultationFee;
    private Integer doctorExperience;

    // Payment info
    private Long paymentId;
    private BigDecimal paymentAmount;
    private String paymentMethod;
    private LocalDateTime paymentDate;
    private String paymentStatus;

    // Patient detailed info (nested)
    private PatientInfo patient;

    // Doctor detailed info (nested)
    private DoctorInfo doctor;

    // Appointment history
    private List<AppointmentHistoryDTO> history;

    // Statistics
    private AppointmentStats stats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PatientInfo {
        private Long id;
        private Long userId;
        private String fullName;
        private String email;
        private String phone;
        private String gender;
        private LocalDate dateOfBirth;
        private String address;
        private String bloodType;
        private String allergies;
        private String emergencyContact;
        private String emergencyPhone;
        private String avatarUrl;
        private Integer totalAppointments;
        private Integer completedAppointments;
        private Integer cancelledAppointments;
        private Integer noShowCount;
        private LocalDateTime lastVisitDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DoctorInfo {
        private Long id;
        private Long userId;
        private String fullName;
        private String email;
        private String phone;
        private String specialization;
        private String licenseNumber;
        private String bio;
        private String education;
        private Integer experienceYears;
        private BigDecimal consultationFee;
        private BigDecimal ratingAvg;
        private Integer totalReviews;
        private String avatarUrl;
        private Boolean isAvailable;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AppointmentStats {
        private Long patientTotalWithDoctor;  // Total appointments patient has with this doctor
        private Long doctorTotalToday;        // Doctor's total appointments today
        private Integer doctorQueuePosition;  // Current position in doctor's queue
        private Integer waitingCount;         // Number of patients waiting
    }
}
