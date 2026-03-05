package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.BlockReason;
import com.q2k.meditech.entity.enums.SlotSource;
import com.q2k.meditech.entity.enums.TimeSlotStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * TimeSlot Entity - Represents a schedulable time block for a doctor.
 * Core entity of the Time Slot Management module.
 */
@Entity
@Table(name = "time_slots",
        uniqueConstraints = @UniqueConstraint(name = "unique_time_slot", columnNames = {"doctor_id", "slot_date", "start_time"}),
        indexes = {
                @Index(name = "idx_time_slots_doctor", columnList = "doctor_id"),
                @Index(name = "idx_time_slots_date", columnList = "slot_date"),
                @Index(name = "idx_time_slots_status", columnList = "status"),
                @Index(name = "idx_time_slots_doctor_date", columnList = "doctor_id, slot_date"),
                @Index(name = "idx_time_slots_source", columnList = "source"),
                @Index(name = "idx_time_slots_batch_id", columnList = "batch_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlot extends BaseEntity {

    // ───────────────── Core fields ─────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_time_slots_doctor"))
    private Doctor doctor;

    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    // ───────────────── Status & source ─────────────────

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TimeSlotStatus status = TimeSlotStatus.AVAILABLE;

    /** How this slot was created */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 20)
    private SlotSource source = SlotSource.MANUAL;

    /** Admin note */
    @Column(name = "note", length = 500)
    private String note;

    // ───────────────── Block info ─────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "block_reason", length = 30)
    private BlockReason blockReason;

    /** Free-text note for blocking */
    @Column(name = "block_note", length = 500)
    private String blockNote;

    @Column(name = "block_until")
    private LocalDateTime blockUntil;

    @Column(name = "blocked_by")
    private Long blockedBy;

    @Column(name = "blocked_at")
    private LocalDateTime blockedAt;

    // ───────────────── Batch / rollback support ─────────────────

    /** UUID of the bulk-create or template-apply batch */
    @Column(name = "batch_id", length = 36)
    private String batchId;

    // ───────────────── Helper methods ─────────────────

    public boolean isAvailable() {
        return TimeSlotStatus.AVAILABLE == status;
    }

    public boolean isBooked() {
        return TimeSlotStatus.BOOKED == status;
    }

    public boolean isBlocked() {
        return TimeSlotStatus.BLOCKED == status;
    }

    public boolean isCompleted() {
        return TimeSlotStatus.COMPLETED == status;
    }

    public boolean isReserved() {
        return TimeSlotStatus.RESERVED == status;
    }

    /** Can this slot be edited (time change)? Only AVAILABLE and BLOCKED. */
    public boolean isEditable() {
        return isAvailable() || isBlocked();
    }

    /** Can this slot be deleted? Only AVAILABLE. */
    public boolean isDeletable() {
        return isAvailable();
    }
}