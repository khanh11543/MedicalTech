package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * User Role Detail DTO
 * Used in UserDetailDTO to show role assignment details
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRoleDetailDTO {
    private Long roleId;
    private String roleName;
    private String roleDescription;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime assignedAt;
    
    private Long assignedBy;
    private String assignedByEmail; // Email of the person who assigned the role
}