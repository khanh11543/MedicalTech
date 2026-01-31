package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Staff Invite Request DTO
 * Dùng cho API POST /api/admin/staff-registry
 * Admin tạo lời mời cho nhân viên nội bộ
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffInviteDTO {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;
    
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone must be 10-11 digits")
    private String phone;
    
    @NotBlank(message = "Full name is required")
    @Size(max = 255, message = "Full name must not exceed 255 characters")
    private String fullName;
    
    /**
     * Role mong đợi: DOCTOR, RECEPTIONIST
     * KHÔNG cho phép PATIENT (chỉ staff nội bộ)
     */
    @NotBlank(message = "Expected role is required")
    @Pattern(regexp = "^(DOCTOR|RECEPTIONIST)$", message = "Expected role must be DOCTOR or RECEPTIONIST")
    private String expectedRole;
    
    /**
     * Department/Phòng ban (optional)
     */
    @Size(max = 100, message = "Department must not exceed 100 characters")
    private String department;
    
    /**
     * Ngày hết hạn lời mời (optional)
     * Nếu null = không giới hạn thời gian
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime inviteExpiresAt;
    
    /**
     * Ghi chú thêm (optional)
     */
    private String notes;
}