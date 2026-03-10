package com.q2k.meditech.dto;

import lombok.*;

import java.util.Map;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ConsentStatsDTO {
    private Long totalConsents;
    private Long acceptedCount;
    private Long declinedCount;
    private Long revokedCount;
    private Double acceptanceRate;
    private Long totalUsers;
    private Long usersWithFullConsent;
    private Long usersWithPartialConsent;
    private Long recentConsentsCount;
    private Long recentRevocationsCount;
    private Map<String, Long> consentsByType;
}
