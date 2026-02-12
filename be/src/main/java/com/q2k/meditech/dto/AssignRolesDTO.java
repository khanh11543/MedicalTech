package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * Assign Roles DTO
 * Dùng cho API PUT /api/admin/users/{userId}/roles
 * Replace toàn bộ roles của user bằng danh sách mới
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignRolesDTO {
    
    @NotEmpty(message = "Role IDs cannot be empty")
    private Set<Long> roleIds;
}