package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * TimeSlot Entity - Represents available time slots for doctors
 * Maps to 'time_slots' table in database
 */
@Entity
@Table(name = "time_slots",
        uniqueConstraints = @UniqueConstraint(name = "unique_time_slot", columnNames = {"doctor_id", "slot_date", "start_time"}),
        indexes = {
                @Index(name = "idx_time_slots_doctor", columnList = "doctor_id"),
                @Index(name = "idx_time_slots_date", columnList = "slot_date"),
                @Index(name = "idx_time_slots_status", columnList = "status"),
                @Index(name = "idx_time_slots_doctor_date", columnList = "doctor_id, slot_date")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlot extends BaseEntity {

    /**
     * Doctor cho slot này
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_time_slots_doctor"))
    private User doctor; // User with DOCTOR role

    /**
     * Ngày của slot
     */
    @Column(name = "slot_date", nullable = false)
    private LocalDate slotDate;

    /**
     * Giờ bắt đầu
     */
    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    /**
     * Giờ kết thúc
     */
    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /**
     * Status: AVAILABLE, BOOKED, BLOCKED, COMPLETED
     */
    @Builder.Default
    @Column(name = "status", nullable = false, length = 20)
    private String status = "AVAILABLE";

    // Helper methods
    public boolean isAvailable() {
        return "AVAILABLE".equals(status);
    }

    public boolean isBooked() {
        return "BOOKED".equals(status);
    }
}