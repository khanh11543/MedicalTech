package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorCardDTO {

    private Long id;
    private String fullName;
    private String avatarUrl;
    private List<String> specialties;
    private Integer experienceYears;
    private BigDecimal consultationFee;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private String hospitalAffiliation;
    private String officeAddress;
    private Boolean isAvailable;
}
