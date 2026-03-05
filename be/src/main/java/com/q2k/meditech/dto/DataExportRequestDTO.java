package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DataExportRequestDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String status;
    private LocalDate requestedDate;
    private LocalDateTime processedDate;
    private Long processedBy;
    private String processedByName;
    private Boolean includeProfile;
    private Boolean includeAppointments;
    private Boolean includePrescriptions;
    private Boolean includePayments;
    private Boolean includeReviews;
    private Boolean includeActivityLogs;
    private String exportFormat;
    private String filePath;
    private Long fileSize;
    private String errorMessage;
    private Boolean emailSent;
    private LocalDateTime emailSentDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
