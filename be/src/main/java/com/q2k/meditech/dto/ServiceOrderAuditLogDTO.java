package com.q2k.meditech.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceOrderAuditLogDTO {
    private Long id;
    private String eventType;
    private String actorName;
    private String actorRole;
    private String patientName;
    private Long appointmentId;
    private Long serviceOrderId;
    private String summary;
    private LocalDateTime createdAt;
}
