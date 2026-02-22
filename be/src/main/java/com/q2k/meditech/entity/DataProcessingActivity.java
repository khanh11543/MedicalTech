package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "data_processing_activities")
public class DataProcessingActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "activity_name", nullable = false, length = 100)
    private String activityName;

    @Lob
    @Column(name = "purpose", nullable = false)
    private String purpose;

    @Column(name = "legal_basis", nullable = false, length = 100)
    private String legalBasis;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data_categories", columnDefinition = "json")
    private Object dataCategories;

    @Column(name = "data_subjects", length = 200)
    private String dataSubjects;

    @Lob
    @Column(name = "recipients")
    private String recipients;

    @Column(name = "transfer_countries", length = 500)
    private String transferCountries;

    @Column(name = "retention_period", length = 100)
    private String retentionPeriod;

    @Lob
    @Column(name = "security_measures")
    private String securityMeasures;

    @Lob
    @Column(name = "dpo_notes")
    private String dpoNotes;

    @Builder.Default
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
