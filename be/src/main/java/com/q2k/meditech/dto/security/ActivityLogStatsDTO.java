package com.q2k.meditech.dto.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Statistics response DTO for Activity Logs dashboard (10.4).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLogStatsDTO {
    private long totalActivities;

    private List<ActivityTypeCountDTO> byActivityType;
    private List<DateCountDTO> byDate;
    private List<ActiveUserDTO> mostActiveUsers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActivityTypeCountDTO {
        private String activityType;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DateCountDTO {
        private String date;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ActiveUserDTO {
        private Long userId;
        private String fullName;
        private long activityCount;
    }
}
