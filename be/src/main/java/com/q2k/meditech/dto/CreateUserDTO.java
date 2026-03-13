package com.q2k.meditech.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * Create User Request DTO
 * Used for API POST /api/admin/users (Admin creates user)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserDTO {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;
    
    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 50, message = "Password must be between 8 and 50 characters")
    @Pattern(
        regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$",
        message = "Password must contain at least one digit, one lowercase, one uppercase, and one special character"
    )
    private String password;
    
    @Size(max = 255, message = "Full name must not exceed 255 characters")
    private String fullName;

    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone must be 10-11 digits")
    private String phone;
    
    private String avatarUrl;
    
    @Builder.Default
    private Boolean isActive = true;
    
    @Builder.Default
    private Boolean isVerified = false;
    
    // Role IDs to assign to user upon creation
    private Set<Long> roleIds;

    // Doctor-specific fields (only used when role is DOCTOR)
    private String specialization;
    private String subSpecialization;
    private String yearsOfExperience;
    private String qualification;
    private String notes;

    // Specialty/Department IDs to assign to doctor
    private Set<Long> specialtyIds;
    private Long primarySpecialtyId;

    // Whether to create staff invite and send email
    @Builder.Default
    private Boolean sendInvite = false;
}