package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for frequent patients sub-tab.
 * Shows visit frequency, most visited doctor, lifetime spending.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FrequentPatientDTO {

    private Long id;
    private Long userId;
    private String mrn;
    private String name;
    private Integer age;
    private String gender;
    private String maskedPhone;
    private String insuranceStatus;

    private Long totalVisits;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastVisit;

    private String mostVisitedDoctorName;
    private Long mostVisitedDoctorId;
    private Long visitCountWithTopDoctor;

    private BigDecimal lifetimeSpending;

    /** Days since last completed visit — used for lapsed detection */
    private Long daysSinceLastVisit;

    /** Lapsed status: ACTIVE / LAPSED / LONG_LAPSED */
    private String lapsedStatus;

    /** VIP flag: true if totalVisits >= 20 */
    private Boolean isVip;
}
