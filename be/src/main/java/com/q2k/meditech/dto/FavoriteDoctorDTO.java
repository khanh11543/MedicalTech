package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteDoctorDTO {

    private Long id;
    private Long doctorId;
    private String doctorName;
    private String avatarUrl;
    private List<String> specialties;
    private Integer experienceYears;
    private BigDecimal consultationFee;
    private BigDecimal ratingAvg;
    private Integer ratingCount;
    private String hospitalAffiliation;
    private Boolean isAvailable;
    private LocalDateTime createdAt;
}
