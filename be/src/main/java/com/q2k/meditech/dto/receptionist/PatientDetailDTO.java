package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Full patient detail for receptionist view.
 * Contains address, insurance detail, emergency contact.
 * Sensitive clinical data NOT included (count only via PatientClinicalSummaryDTO).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientDetailDTO {

    private Long id;
    private Long userId;
    private String mrn;

    // Personal info
    private String name;
    private String email;
    private String phone;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfBirth;

    private Integer age;
    private String gender;
    private String avatarUrl;

    // Address (visible in detail only, not in list)
    private String address;

    // Insurance
    private String insuranceNumber;
    private String insuranceProvider;
    private String insuranceStatus;

    // Emergency contact
    private String emergencyContact;

    // Stats
    private Long totalAppointments;
    private Long completedAppointments;
    private Long cancelledAppointments;
    private Long noShowAppointments;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastVisit;

    // Account
    private Boolean isActive;
    private Boolean isVerified;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}
