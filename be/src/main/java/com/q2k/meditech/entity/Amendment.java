package com.q2k.meditech.entity;

import lombok.*;
import jakarta.persistence.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/**
 * Amendment/Addendum Entity - Supplementary notes for finalized consultations
 */
@Entity
@Table(name = "consultation_amendments", indexes = {
    @Index(name = "idx_consultation_id", columnList = "consultation_id"),
    @Index(name = "idx_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Amendment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id", nullable = false)
    private Consultation consultation;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "signed_by_user_id")
    private User signedByUser;

    @Column(name = "signed_at")
    private java.time.LocalDateTime signedAt;

    // Helper method
    public void sign(User signedByUser) {
        this.signedByUser = signedByUser;
        this.signedAt = java.time.LocalDateTime.now();
    }
}
