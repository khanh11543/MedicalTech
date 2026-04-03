package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for department worklist items — enriched with patient and appointment info
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorklistItemDTO {
    private Long id;
    private String serviceName;
    private String category;
    private String targetDepartment;
    private BigDecimal price;
    private String priority;
    private String notes;
    private String status;
    private LocalDateTime orderedAt;
    private String orderedByDoctorName;
    private Long assignedDoctorId;
    private String assignedDoctorName;
    private String patientName;
    private Long patientId;
    private String appointmentCode;
    private Long appointmentId;
    private Long consultationId;
    private Boolean hasResult;
    private LocalDateTime completedAt;
}
