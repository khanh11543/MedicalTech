package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.BookedBy;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO for appointment information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentDTO {

    private Long id;

    private String appointmentCode;
    private Long patientId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;

    // Doctor info
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;
    private String doctorEmail;

    // Appointment details
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

    private String appointmentType;
    private String paymentStatus;

    /** Id of the payment for this appointment (if any) — for patient portal Pay Now */
    private Long paymentId;

    /** Prescription ID linked to this appointment (if any) */
    private Long prescriptionId;

    /** Payment status of the prescription (UNPAID/PENDING/PAID etc) */
    private String prescriptionPaymentStatus;

    /** Total cost of prescription medications */
    private java.math.BigDecimal prescriptionTotalCost;

    /** Consultation fee (from doctor) for display on patient portal */
    private BigDecimal consultationFee;

    private Boolean hasReview;

    private LocalDateTime checkedInAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}


