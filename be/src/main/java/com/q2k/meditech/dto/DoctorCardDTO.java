package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for Doctor card in search results
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorCardDTO {
    private Long id;
    private String fullName;
    private String avatarUrl;
    private String primarySpecialty;
    private List<String> specialties;
    private Integer experienceYears;
    private BigDecimal consultationFee;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private String hospitalAffiliation;
    private String city;
    private Boolean isAvailable;
}
