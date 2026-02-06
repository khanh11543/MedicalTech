package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorDetailDTO {

    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private String licenseNumber;
    private String bio;
    private String education;
    private Integer experienceYears;
    private BigDecimal consultationFee;
    private BigDecimal followUpFee;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private String hospitalAffiliation;
    private String officeAddress;
    private Boolean isAvailable;
    private List<SpecialtyDTO> specialties;
}
