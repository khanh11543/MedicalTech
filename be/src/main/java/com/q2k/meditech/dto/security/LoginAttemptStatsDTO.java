package com.q2k.meditech.dto.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Statistics response DTO for Login Attempts (10.5).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttemptStatsDTO {
    private long totalAttempts;
    private long successfulAttempts;
    private long failedAttempts;
    private long uniqueIpsWithFailures;

    // Trends
    private List<DateCountDTO> byDate;
    private List<HourCountDTO> failedByHour;
    private List<IpCountDTO> topFailedIps;
    private List<CountryCountDTO> byCountry;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DateCountDTO {
        private String date;
        private long successCount;
        private long failedCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HourCountDTO {
        private int hour;   // 0-23
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IpCountDTO {
        private String ipAddress;
        private long failedCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CountryCountDTO {
        private String country;
        private long count;
    }
}
