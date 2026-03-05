package com.q2k.meditech.dto.timeslot;

import lombok.*;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for the preview step of bulk create / template apply
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkCreatePreviewDTO {

    private int totalSlotsToCreate;
    private int conflictCount;
    private int skippedHolidayCount;
    private List<ConflictDetail> conflicts;
    private List<LocalDate> holidayDates;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConflictDetail {
        private Long doctorId;
        private String doctorName;
        private LocalDate date;
        private String startTime;
        private String endTime;
        private String existingStatus; // status of the slot that already exists
    }
}
