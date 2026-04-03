package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceResultDTO {
    private Long id;
    private Long serviceOrderId;
    private String findings;
    private String conclusion;
    private String notes;
    private String completedByDoctorName;
    private Long completedByDoctorId;
    private LocalDateTime completedAt;
    private Boolean isDraft;
    private List<ServiceResultAttachmentDTO> attachments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Context fields from service order
    private String serviceName;
    private String category;
    private String patientName;
    private String appointmentCode;
    private String orderedByDoctorName;
}
