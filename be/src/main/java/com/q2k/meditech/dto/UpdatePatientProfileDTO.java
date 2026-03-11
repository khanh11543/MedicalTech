package com.q2k.meditech.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for patient self-service profile update (PUT /patient/profile).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePatientProfileDTO {

    @Size(max = 255)
    private String fullName;

    @Size(max = 20)
    private String phone;

    private LocalDate dateOfBirth;
    @Size(max = 10)
    private String gender;
    @Size(max = 2000)
    private String address;
    @Size(max = 20)
    private String idNumber; // CCCD
    @Size(max = 100)
    private String insuranceNumber;
    @Size(max = 100)
    private String insuranceProvider;
    @Size(max = 20)
    private String emergencyContact;
    @Size(max = 5)
    private String bloodGroup;
    @Size(max = 2000)
    private String allergies;
    @Size(max = 5000)
    private String medicalHistory;
}
