package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Data Request
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataRequestDTO {
    
    private Long id;
    private Long userId;
    private String username;
    private String userEmail;
    private String requestType;
    private String status;
    private String requestReason;
    private String adminNotes;
    private Long processedBy;
    private String processedByName;
    private LocalDateTime processedAt;
    private String dataFilePath;
    private String ipAddress;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
