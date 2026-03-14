package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/**
 * ClinicWorkingHours - clinic opening hours by day of week.
 * Used to validate that slots are within clinic operating hours.
 */
@Entity
@Table(name = "clinic_working_hours",
        uniqueConstraints = @UniqueConstraint(name = "uk_working_hours_day", columnNames = "day_of_week"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClinicWorkingHours extends BaseEntity {

    /** 1 = Monday … 7 = Sunday */
    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @Column(name = "open_time", nullable = false)
    private LocalTime openTime;

    @Column(name = "close_time", nullable = false)
    private LocalTime closeTime;

    /** If false, clinic is closed on this day */
    @Builder.Default
    @Column(name = "is_open", nullable = false)
    private Boolean isOpen = true;

    @Column(name = "day_name", length = 20)
    private String dayName;
}
