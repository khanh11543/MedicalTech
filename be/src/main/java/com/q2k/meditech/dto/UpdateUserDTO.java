package com.q2k.meditech.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Update User Request DTO
 * Dùng cho API PUT /api/admin/users/{userId}
 * Tất cả fields đều optional (chỉ update những field được gửi lên)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserDTO {
    
    @Email(message = "Email should be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;
    
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Phone must be 10-11 digits")
    private String phone;
    
    private String avatarUrl;
    
    private Boolean isVerified;
    
    private Boolean twoFactorEnabled;
    
    // Note: isActive is updated via separate API (PATCH /status)
    // Note: roles are updated via separate API (PUT /roles)
}