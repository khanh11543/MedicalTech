package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for admin patient management - combines User + Patient profile info
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPatientDTO {
    // Patient profile fields
    private Long patientId;
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String insuranceNumber;
    private String insuranceProvider;
    private String emergencyContact;
    private String bloodGroup;
    private String allergies;
    private String medicalHistory;

    // User fields
    private Long userId;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private Boolean isActive;
    private Boolean isVerified;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastLogin;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    // Stats
    private Long totalAppointments;
}
