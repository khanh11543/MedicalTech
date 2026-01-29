package com.q2k.meditech.entity;

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
                @Index(name = "idx_doctor_documents_type", columnList = "document_type")
        }
)
public class DoctorDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FK doctors(id)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="doctor_id", nullable = false)
    private Doctor doctor;

    @Column(name="document_type", nullable = false, length = 50)
    private String documentType; // LICENSE, ID_CARD, DEGREE, EXPERIENCE

    @Column(name="file_url", nullable = false, length = 1000)
    private String fileUrl;

    @Column(length = 20)
    private String status = "PENDING"; // PENDING/APPROVED/REJECTED

    @Lob
    @Column(name="review_note")
    private String reviewNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="reviewed_by")
    private User reviewedBy;

    @Column(name="reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name="uploaded_at")
    private LocalDateTime uploadedAt;

    @PrePersist
    void prePersist() {
        if (uploadedAt == null) uploadedAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
    }
}
