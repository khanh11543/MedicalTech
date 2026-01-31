package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Staff Registry Response DTO
 * Dùng cho tất cả APIs liên quan đến staff registry
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffRegistryDTO {
    
    private Long id;
    
    private String staffCode;
    
    private String email;
    
    private String phone;
    
    private String fullName;
    
    private String expectedRole;
    
    private String department;
    
    /**
     * Status: PENDING, REGISTERED, DISABLED, EXPIRED
     */
    private String status;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime inviteExpiresAt;
    
    /**
     * User ID nếu đã đăng ký
     */
    private Long registeredUserId;
    
    /**
     * Email của user đã đăng ký (để hiển thị)
     */
    private String registeredUserEmail;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime registeredAt;
    
    /**
     * Admin đã mời
     */
    private Long invitedBy;

    private String invitedByEmail;

    /**
     * Ngày tạo lời mời
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime invitedAt;

    /**
     * Admin đã disable (nếu có)
     */
    private Long disabledBy;
    
    private String disabledByEmail;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime disabledAt;
    
    private String disableReason;
    
    private String notes;
    
    /**
     * Invitation token (để frontend tạo link đăng ký)
     * Optional - có thể null nếu không dùng
     */
    private String invitationToken;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    /**
     * Helper flag - có hết hạn không
     */
    private Boolean isExpired;
    
    /**
     * Helper flag - có thể đăng ký không
     */
    private Boolean canRegister;
}