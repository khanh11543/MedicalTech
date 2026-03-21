package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.TimeOffStatus;
import com.q2k.meditech.entity.enums.TimeOffType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "time_off_requests", indexes = {
        @Index(name = "idx_tor_doctor_date", columnList = "doctor_id, request_date"),
        @Index(name = "idx_tor_status", columnList = "status")
})
public class TimeOffRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private TimeOffType type;

    /** Request effective date */
    @Column(name = "request_date", nullable = false)
    private LocalDate date;

    /** Null for FULL_DAY */
    @Column(name = "start_time")
    private LocalTime startTime;

    /** Null for FULL_DAY */
    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(length = 500)
    private String reason;

    @Column(length = 1000)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TimeOffStatus status = TimeOffStatus.PENDING_REVIEW;

    /** How many non-cancelled appointments fall in this time range */
    @Column(name = "affected_appointments_count")
    @Builder.Default
    private int affectedAppointmentsCount = 0;

    /**
     * True if any conflicting appointment is in CHECKED_IN / CALLED / IN_PROGRESS state.
     * Heavy conflicts cannot be auto-approved.
     */
    @Column(name = "has_heavy_conflict")
    @Builder.Default
    private boolean hasHeavyConflict = false;

    /** Admin review note (e.g. rejection reason) */
    @Column(name = "review_notes", length = 1000)
    private String reviewNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
