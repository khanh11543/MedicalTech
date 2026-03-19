package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorReviewsStatsDTO {

    // Performance stats for the doctor (appointment/prescription related)
    private Long totalAppointments;
    private Long patientsTreated;
    private Long prescriptionsWritten;
    private BigDecimal consultationHours;

    // Rating stats for the doctor (review related)
    private BigDecimal averageRating;
    private Integer totalReviews;
    private Long recentReviewsCount;

    // Count of reviews per star rating (1..5)
    private List<RatingDistributionItem> ratingDistribution;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RatingDistributionItem {
        private Integer rating;
        private Long count;
    }
}

