package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for ServiceOrder responses
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceOrderDTO {
    private Long id;
    private Long consultationId;
    private Long appointmentId;
    private String serviceName;
    private String category;
    private BigDecimal price;
    private String priority;
    private String notes;
    private String status;
    private LocalDateTime orderedAt;
    private String orderedByDoctorName;
    private String targetDepartment;
    private Long assignedDoctorId;
    private String assignedDoctorName;
    private String performedBy;
    private String result;
    private LocalDateTime completedAt;
    private Long serviceResultId;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime paidAt;
    private String paidByName;
    // Worklist context fields
    private String patientName;
    private String appointmentCode;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
