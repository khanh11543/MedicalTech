package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.EvidenceType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "investigation_evidence",
        indexes = {
                @Index(name = "idx_inv_evidence_investigation", columnList = "investigation_id"),
                @Index(name = "idx_inv_evidence_type", columnList = "evidence_type"),
                @Index(name = "idx_inv_evidence_ref", columnList = "reference_type, reference_id")
        }
)
public class InvestigationEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investigation_id", nullable = false)
    private Investigation investigation;

    @Enumerated(EnumType.STRING)
    @Column(name = "evidence_type", nullable = false, length = 30)
    private EvidenceType evidenceType;

    // Generic reference to any entity
    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "reference_type", length = 50)
    private String referenceType; // SecurityEvent, AuditLog, ActivityLog

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by", nullable = false)
    private User addedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
