package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for patient communication log items.
 * Shows SMS/email history for a specific patient.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientCommunicationDTO {

    private Long id;

    /** EMAIL or SMS */
    private String channel;

    private String recipient;
    private String subject;
    private String templateName;
    private String status;
    private String errorMessage;

    private String sentByName;
    private Long sentByUserId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime sentAt;

    /** Link to related entity, e.g., appointment */
    private String referenceType;
    private Long referenceId;
}
