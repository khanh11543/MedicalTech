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

    @Size(max = 2000, message = "Education must not exceed 2000 characters")
    private String education;

    @Size(max = 3000, message = "Bio must not exceed 3000 characters")
    private String bio;

    @Size(max = 255, message = "Hospital affiliation must not exceed 255 characters")
    private String hospitalAffiliation;

    @Size(max = 500, message = "Office address must not exceed 500 characters")
    private String officeAddress;
}
