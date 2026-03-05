package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * Patient statistics for receptionist dashboard/overview.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientStatsDTO {

    private Long totalPatients;
    private Long activePatients;
    private Long deactivatedPatients;
    private Long newThisMonth;
    private Long insuredPatients;
    private Long uninsuredPatients;
    private Long malePatients;
    private Long femalePatients;
    private Long otherGenderPatients;
}
