package com.q2k.meditech.dto.doctor;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for admin to view pending doctor verification (list view)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorVerificationDTO {

    private Long doctorId;
    private String fullName;
    private String email;
    private String avatarUrl;
    private String specialization;
    private String licenseNumber;
    private Integer experienceYears;
    private String education;
    private String bio;
    private String hospitalAffiliation;
    private String officeAddress;

    private String verificationStatus;
    private String rejectionReason;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submittedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime verifiedAt;

    private String verifiedByEmail;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    // Document summary
    private int totalDocuments;
    private int approvedDocuments;
    private int pendingDocuments;
    private int rejectedDocuments;

    // Inline document list for detail view
    private List<DocumentItem> documents;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentItem {
        private Long id;
        private String docType;
        private String docTypeDescription;
        private String fileUrl;
        private String status;
        private String reviewNote;
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime reviewedAt;
        private String reviewedByEmail;
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
        private LocalDateTime createdAt;
    }
}
