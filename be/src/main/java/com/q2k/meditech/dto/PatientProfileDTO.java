package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Combined User + Patient profile for patient self-service (GET /patient/profile).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientProfileDTO {

    private Long userId;
    private Long patientId;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String idNumber; // CCCD
    private String insuranceNumber;
    private String insuranceProvider;
    private String emergencyContact;
    private String bloodGroup;
    private String allergies;
    private String medicalHistory;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
