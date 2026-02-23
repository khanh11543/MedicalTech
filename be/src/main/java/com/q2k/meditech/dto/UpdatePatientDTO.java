package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for updating patient info via admin
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePatientDTO {
    private String fullName;
    private String phone;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String insuranceNumber;
    private String insuranceProvider;
    private String emergencyContact;
    private String bloodGroup;
    private String allergies;
    private Boolean isActive;
}
