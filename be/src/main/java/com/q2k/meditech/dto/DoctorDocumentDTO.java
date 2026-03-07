package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for doctor document response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorDocumentDTO {
    
    private Long id;
    
    private Long doctorId;
    
    private String doctorName;
    
    private String doctorEmail;
    
    private String docType;
    
    private String docTypeDescription;
    
    private String fileUrl;
    
    private String fileHash;
    
    private String status;
    
    private Long reviewedById;
    
    private String reviewedByEmail;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime reviewedAt;
    
    private String reviewNote;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    /**
     * Get human-readable description for document type
     */
    public static String getDocTypeDescription(String docType) {
        if (docType == null) return null;
        return switch (docType) {
            case "LICENSE" -> "Practice License";
            case "ID" -> "ID Card (CCCD/CMND)";
            case "DEGREE" -> "Degree/Diploma";
            case "EXPERIENCE" -> "Experience Certificate";
            case "AFFILIATION_PROOF" -> "Employment Confirmation";
            default -> docType;
        };
    }
}