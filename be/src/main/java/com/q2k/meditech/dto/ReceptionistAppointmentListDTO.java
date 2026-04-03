package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.BookedBy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Privacy-respecting DTO for receptionist appointment listing.
 * Masks patient phone number and omits sensitive medical fields
 * (symptoms, reasonForVisit, notes, emails).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceptionistAppointmentListDTO {

    private Long id;
    private String appointmentCode;

    // Patient info (limited — no email, phone masked)
    private Long patientId;
    private String patientName;
    private String maskedPhone; // e.g. "***567"

    // Doctor info (no email)
    private Long doctorId;
    private String doctorName;
    private String doctorSpecialization;

    // Appointment details
    private LocalDate appointmentDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private AppointmentStatus status;
    private BookedBy bookedBy;
    private String bookedByUserName;

    private Integer queueNumber;
    private LocalDateTime checkedInAt;
    private LocalDateTime createdAt;

    // Payment info
    private Long paymentId;
    private String paymentStatus;
    private BigDecimal fee;

    // Prescription payment info
    private Long prescriptionId;
    private String prescriptionPaymentStatus;
    private BigDecimal prescriptionTotalCost;

    // Service order payment info
    private String serviceOrderPaymentStatus; // UNPAID, PARTIAL, PAID, or null (no orders)

    /**
     * Convert from full AppointmentDTO to privacy-respecting receptionist DTO.
     */
    public static ReceptionistAppointmentListDTO fromAppointmentDTO(AppointmentDTO dto, String maskedOrFullPhone) {
        ReceptionistAppointmentListDTO result = fromAppointmentDTO(dto, null, null, null, maskedOrFullPhone);
        result.setPrescriptionId(dto.getPrescriptionId());
        result.setPrescriptionPaymentStatus(dto.getPrescriptionPaymentStatus());
        result.setPrescriptionTotalCost(dto.getPrescriptionTotalCost());
        return result;
    }

    /**
     * Convert from full AppointmentDTO with payment info.
     * @param maskedOrFullPhone phone already processed by PrivacyMaskingService
     */
    public static ReceptionistAppointmentListDTO fromAppointmentDTO(
            AppointmentDTO dto, String paymentStatus, BigDecimal fee, Long paymentId, String maskedOrFullPhone) {
        return ReceptionistAppointmentListDTO.builder()
                .id(dto.getId())
                .appointmentCode(dto.getAppointmentCode())
                .patientId(dto.getPatientId())
                .patientName(dto.getPatientName())
                .maskedPhone(maskedOrFullPhone)
                .doctorId(dto.getDoctorId())
                .doctorName(dto.getDoctorName())
                .doctorSpecialization(dto.getDoctorSpecialization())
                .appointmentDate(dto.getAppointmentDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .status(dto.getStatus())
                .bookedBy(dto.getBookedBy())
                .bookedByUserName(dto.getBookedByUserName())
                .queueNumber(dto.getQueueNumber())
                .checkedInAt(dto.getCheckedInAt())
                .createdAt(dto.getCreatedAt())
                .paymentId(paymentId)
                .paymentStatus(paymentStatus)
                .fee(fee)
                .prescriptionId(dto.getPrescriptionId())
                .prescriptionPaymentStatus(dto.getPrescriptionPaymentStatus())
                .prescriptionTotalCost(dto.getPrescriptionTotalCost())
                .build();
    }
}
