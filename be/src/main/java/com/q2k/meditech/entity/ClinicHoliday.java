package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * ClinicHoliday - ngày lễ / nghỉ lễ toàn phòng khám.
 * Slots on holiday dates are auto-blocked during bulk creation.
 */
@Entity
@Table(name = "clinic_holidays",
        uniqueConstraints = @UniqueConstraint(name = "uk_clinic_holiday_date", columnNames = "holiday_date"),
        indexes = {
                @Index(name = "idx_clinic_holidays_date", columnList = "holiday_date"),
                @Index(name = "idx_clinic_holidays_year", columnList = "year")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicHoliday extends BaseEntity {

    @Column(name = "holiday_date", nullable = false)
    private LocalDate holidayDate;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    /** Derived column for fast year-based queries */
    @Column(name = "year", nullable = false)
    private Integer year;

    /** If true, auto-block existing AVAILABLE slots on this date */
    @Builder.Default
    @Column(name = "auto_block_slots", nullable = false)
    private Boolean autoBlockSlots = true;

    /** If true, prevent bulk-create from generating slots on this date */
    @Builder.Default
    @Column(name = "prevent_slot_creation", nullable = false)
    private Boolean preventSlotCreation = true;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @PrePersist
    @PreUpdate
    private void deriveYear() {
        if (holidayDate != null) {
            this.year = holidayDate.getYear();
        }
    }
}
