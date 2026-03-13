package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * Assign Roles DTO
 * Used for API PUT /api/admin/users/{userId}/roles
 * Replaces all user roles with a new list
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignRolesDTO {
    
    @NotEmpty(message = "Role IDs cannot be empty")
    private Set<Long> roleIds;
}