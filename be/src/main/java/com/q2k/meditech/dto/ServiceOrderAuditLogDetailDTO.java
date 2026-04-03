package com.q2k.meditech.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceOrderAuditLogDetailDTO {
    private Long id;
    private String eventType;
    private String actorName;
    private String actorRole;
    private LocalDateTime createdAt;

    private Long appointmentId;
    private Long consultationId;
    private Long patientId;
    private String patientName;
    private Long serviceOrderId;
    private Long serviceResultId;

    private String summary;
    private Object beforeData;
    private Object afterData;

    private String ipAddress;
    private String userAgent;
}
