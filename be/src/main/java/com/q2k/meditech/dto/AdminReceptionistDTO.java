package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for admin receptionist management - combines User + Receptionist profile info
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminReceptionistDTO {
    // Receptionist profile fields
    private Long receptionistId;
    private String fullName;
    private String employeeId;
    private String department;
    private String shift;
    private Boolean isActive;

    // User fields
    private Long userId;
    private String email;
    private String phone;
    private String avatarUrl;
    private Boolean isVerified;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastLogin;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
