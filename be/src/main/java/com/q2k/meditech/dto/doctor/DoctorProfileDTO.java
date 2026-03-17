package com.q2k.meditech.dto.doctor;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO for doctor profile response (doctor's own view)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DoctorProfileDTO {

    private Long id;
    private String fullName;
    private String email;
    private String avatarUrl;

    // Professional info
    private String specialization;
    /**
     * Specialty IDs assigned to this doctor (from doctor_specialties).
     * Primary specialty is indicated by primarySpecialtyId.
     */
    private List<Long> specialtyIds;
    private Long primarySpecialtyId;
    private String licenseNumber;
    private Integer experienceYears;
    private String education;
    private String bio;
    private String hospitalAffiliation;
    private String officeAddress;

    // Verification
    private String verificationStatus;
    private String rejectionReason;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime submittedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime verifiedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    // Profile completeness
    private boolean profileComplete;
    private boolean documentsComplete;
    private boolean canSubmitVerification;
}
