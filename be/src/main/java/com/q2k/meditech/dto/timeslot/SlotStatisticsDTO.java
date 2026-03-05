package com.q2k.meditech.dto.timeslot;

import lombok.*;

/**
 * DTO for Time Slot Management KPI / statistics
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlotStatisticsDTO {

    private long totalSlots;
    private long availableSlots;
    private long bookedSlots;
    private long blockedSlots;
    private long completedSlots;
    private long reservedSlots;

    /** booked / total * 100 */
    private double utilizationRate;

    /** Doctor with fewest available slots today */
    private String lowestAvailabilityDoctor;
    private Long lowestAvailabilityDoctorId;
    private long lowestAvailabilityCount;
}
