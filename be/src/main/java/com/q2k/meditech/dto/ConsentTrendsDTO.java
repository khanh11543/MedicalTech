package com.q2k.meditech.dto;

import lombok.*;

import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ConsentTrendsDTO {
    private List<TrendDataPoint> dataPoints;
    private String groupBy;
    private String consentType;
    private Long totalAccepted;
    private Long totalDeclined;
    private Long totalRevoked;

    @Data @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TrendDataPoint {
        private String period;
        private Long accepted;
        private Long declined;
        private Long revoked;
        private Long total;
    }
}
