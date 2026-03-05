package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.Map;

/**
 * TimeSlotTemplate Entity - Stores reusable time slot templates
 * Admins can create templates and apply them to doctors
 */
@Entity
@Table(name = "time_slot_templates",
        indexes = {
                @Index(name = "idx_template_name", columnList = "template_name"),
                @Index(name = "idx_template_active", columnList = "is_active")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlotTemplate extends BaseEntity {

    @Column(name = "template_name", nullable = false, length = 100)
    private String templateName;

    @Column(name = "description", length = 500)
    private String description;

    /**
     * Days of week this template applies to
     * Stored as JSON: ["MON", "TUE", "WED", "THU", "FRI"]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "days_of_week", columnDefinition = "json", nullable = false)
    private List<String> daysOfWeek;

    /**
     * Time slots configuration
     * Stored as JSON: [{"startTime": "08:00", "endTime": "12:00"}, {"startTime": "13:00", "endTime": "17:00"}]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "time_slots", columnDefinition = "json", nullable = false)
    private List<Map<String, String>> timeSlots;

    /**
     * Break times configuration
     * Stored as JSON: [{"startTime": "12:00", "endTime": "13:00"}]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "break_times", columnDefinition = "json")
    private List<Map<String, String>> breakTimes;

    /**
     * Duration of each slot in minutes
     */
    @Builder.Default
    @Column(name = "slot_duration", nullable = false)
    private Integer slotDuration = 30;

    /**
     * Whether this template is active
     */
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
