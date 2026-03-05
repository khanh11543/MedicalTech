package com.q2k.meditech.dto.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Statistics response DTO for Session Management dashboard (10.5).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionStatsDTO {
    // Summary
    private long totalActiveSessions;
    private long idleSessions;
    private long revokedToday;

    // Breakdown
    private List<DeviceCountDTO> byDeviceType;
    private List<BrowserCountDTO> byBrowser;
    private List<CountryCountDTO> byCountry;
    private List<DateCountDTO> sessionsByDate;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DeviceCountDTO {
        private String deviceType;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BrowserCountDTO {
        private String browserName;
        private long count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CountryCountDTO {
        private String country;
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
}
