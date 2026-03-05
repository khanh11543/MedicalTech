package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for patient admin documents (ID card, insurance card, consent form).
 * NOT clinical documents — those are restricted from receptionist view.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientDocumentDTO {

    private Long id;
    private Long patientId;

    /** Document type: ID_CARD, INSURANCE_CARD, CONSENT_FORM, OTHER */
    private String documentType;

    private String fileName;
    private String fileUrl;
    private Long fileSize;
    private String mimeType;
    private String notes;

    private String uploadedByName;
    private Long uploadedByUserId;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime uploadedAt;
}
