package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for Doctor detail view (public profile)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    
    // Specialties
    private String primarySpecialty;
    private List<SpecialtyDTO> specialties;
    
    // Fees
    private BigDecimal consultationFee;
    private BigDecimal followUpFee;
    
    // Ratings
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    
    // Location
    private String hospitalAffiliation;
    private String officeAddress;
    
    // Status
    private Boolean isAvailable;
    private String verificationStatus;
}
