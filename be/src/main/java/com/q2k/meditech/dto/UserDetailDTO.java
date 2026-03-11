package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * User Detail Response DTO
 * Dùng cho API get user detail (nhiều thông tin hơn UserDTO)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDetailDTO {
    private Long id;
    private String email;
    private String phone;
    private String avatarUrl;
    private Boolean isActive;
    private Boolean isVerified;
    private Boolean twoFactorEnabled;
    private Integer failedLoginCount;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lockedUntil;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastLogin;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    private Set<UserRoleDetailDTO> roles;

    private DoctorProfileInfo doctorProfile;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DoctorProfileInfo {
        private Long id;
        private String fullName;
        private String licenseNumber;
        private String specialization;
        private Integer yearsOfExperience;
        private String bio;
        private BigDecimal consultationFee;
        private String verificationStatus;
        private BigDecimal rating;
        private Integer reviewCount;
        private List<DoctorSpecialtyInfo> specialties;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DoctorSpecialtyInfo {
        private Long id;
        private String name;
        private Boolean isPrimary;
    }
}