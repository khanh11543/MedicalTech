package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Administrative documents for patients (ID card, insurance card, consent forms).
 * NOT clinical documents — these are managed by receptionist/admin.
 */
@Entity
@Table(name = "patient_documents", indexes = {
        @Index(name = "idx_patient_doc_patient", columnList = "patient_id"),
        @Index(name = "idx_patient_doc_type", columnList = "document_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientDocument extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    /** ID_CARD, INSURANCE_CARD, CONSENT_FORM, OTHER */
    @Column(name = "document_type", nullable = false, length = 30)
    private String documentType;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;
}
