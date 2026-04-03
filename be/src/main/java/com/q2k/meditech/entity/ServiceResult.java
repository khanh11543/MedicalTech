package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ServiceResult — stores the detailed result of a medical service
 * entered by the department doctor (e.g. radiology findings, lab values).
 */
@Entity
@Table(name = "service_results", indexes = {
    @Index(name = "idx_sr_service_order_id", columnList = "service_order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ServiceResult extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_order_id", nullable = false, unique = true)
    private ServiceOrder serviceOrder;

    @Column(name = "findings", columnDefinition = "TEXT")
    private String findings;

    @Column(name = "conclusion", columnDefinition = "TEXT")
    private String conclusion;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "completed_by_doctor_id")
    private Doctor completedByDoctor;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Builder.Default
    @Column(name = "is_draft", nullable = false)
    private Boolean isDraft = true;

    @OneToMany(mappedBy = "serviceResult", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ServiceResultAttachment> attachments = new ArrayList<>();

    public void addAttachment(ServiceResultAttachment attachment) {
        attachments.add(attachment);
        attachment.setServiceResult(this);
    }
}
