package com.q2k.meditech.dto.doctor;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.Set;

/**
 * DTO for doctor to update their professional profile (Phase 3)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateDoctorProfileDTO {

    @Size(max = 255, message = "Specialization must not exceed 255 characters")
    private String specialization;

    /**
     * Optional: update specialties using the normalized specialty table.
     * When provided, this will update doctor_specialties and also sync legacy specialization string
     * to the primary specialty name.
     */
    private Set<Long> specialtyIds;

    private Long primarySpecialtyId;

    @Size(max = 50, message = "License number must not exceed 50 characters")
    private String licenseNumber;

    @Min(value = 0, message = "Experience years must be non-negative")
    private Integer experienceYears;

    private String education;

    private String bio;

    @Size(max = 255, message = "Hospital affiliation must not exceed 255 characters")
    private String hospitalAffiliation;

    private String officeAddress;
}
