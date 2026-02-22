package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for GDPR Compliance Dashboard
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GDPRComplianceDashboardDTO {
    
    // Data Request Statistics
    private Long totalDataRequests;
    private Long pendingRequests;
    private Long completedRequests;
    private Long overdueRequests;
    
    // Consent Statistics
    private Long totalConsents;
    private Long activeConsents;
    private Long revokedConsents;
    
    // Processing Activities
    private Long totalProcessingActivities;
    private Long activeProcessingActivities;
    
    // Recent Data Requests
    private List<DataRequestDTO> recentDataRequests;
    
    // Recent Consents
    private List<UserConsentDTO> recentConsents;
    
    // Data Request Breakdown by Type
    private Long exportRequests;
    private Long deletionRequests;
    private Long rectificationRequests;
    
    // Processing Activities
    private List<DataProcessingActivityDTO> processingActivities;
    
    private LocalDateTime generatedAt;
}
