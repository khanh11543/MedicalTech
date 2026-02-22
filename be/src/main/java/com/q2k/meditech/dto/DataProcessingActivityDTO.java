package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for Data Processing Activity
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DataProcessingActivityDTO {
    
    private Long id;
    private String activityName;
    private String purpose;
    private String legalBasis;
    private Object dataCategories;
    private String dataSubjects;
    private String recipients;
    private String transferCountries;
    private String retentionPeriod;
    private String securityMeasures;
    private String dpoNotes;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
