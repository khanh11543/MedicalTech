package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * DTO for uploading a patient admin document.
 * Used as form metadata alongside multipart file upload.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadPatientDocumentDTO {

    @NotBlank(message = "Document type is required")
    @Pattern(regexp = "ID_CARD|INSURANCE_CARD|CONSENT_FORM|OTHER",
             message = "Document type must be ID_CARD, INSURANCE_CARD, CONSENT_FORM, or OTHER")
    private String documentType;

    private String notes;
}
