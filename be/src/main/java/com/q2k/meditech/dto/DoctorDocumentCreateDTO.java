package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO for creating/uploading a doctor document
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorDocumentCreateDTO {
    
    @NotBlank(message = "Document type is required")
    @Pattern(regexp = "LICENSE|ID|DEGREE|EXPERIENCE|AFFILIATION_PROOF", 
             message = "Document type must be one of: LICENSE, ID, DEGREE, EXPERIENCE, AFFILIATION_PROOF")
    private String docType;
    
    @NotBlank(message = "File URL is required")
    @Size(max = 1000, message = "File URL must not exceed 1000 characters")
    private String fileUrl;
    
    @Size(max = 128, message = "File hash must not exceed 128 characters")
    private String fileHash;
}