package com.q2k.meditech.dto.timeslot;

import lombok.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * DTO for the calendar view – KPI stats per day.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarDayDTO {

    private LocalDate date;
    private int totalSlots;
    private int availableSlots;
    private int bookedSlots;
    private int blockedSlots;
    private int completedSlots;
    private int reservedSlots;

    /** Details per doctor (doctorId → counts) */
    private Map<Long, DoctorDaySummary> doctorSummaries;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DoctorDaySummary {
        private Long doctorId;
        private String doctorName;
        private int total;
        private int available;
        private int booked;
        private int blocked;
    }
}
