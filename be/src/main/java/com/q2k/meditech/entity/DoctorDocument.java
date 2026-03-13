package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.DoctorDocumentType;
import com.q2k.meditech.entity.enums.ReviewStatus;
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
        name = "doctor_documents",
        indexes = {
                @Index(name = "idx_doctor_documents_doctor", columnList = "doctor_id"),
                @Index(name = "idx_doctor_documents_status", columnList = "status"),
                @Index(name = "idx_doctor_documents_type", columnList = "doc_type")
        }
)
public class DoctorDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * doctor_id
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "doctor_id", nullable = false, foreignKey = @ForeignKey(name = "fk_doctor_documents_doctor"))
    private Doctor doctor;

    @Enumerated(EnumType.STRING)
    @Column(name="doc_type", nullable = false, length = 30)
    private DoctorDocumentType docType;

    @Column(name="file_url", nullable = false, length = 1000)
    private String fileUrl;

    /**
     * Optional: file hash to prevent tampering after upload (security feature)
     */
    @Column(name="file_hash", length = 128)
    private String fileHash;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewStatus status = ReviewStatus.PENDING;

    /**
     * Admin reviewer
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by", foreignKey = @ForeignKey(name = "fk_doctor_documents_reviewed_by"))
    private User reviewedBy;

    @Column(name="reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name="review_note", columnDefinition = "TEXT")
    private String reviewNote;

    @Builder.Default
    @Column(name="created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
