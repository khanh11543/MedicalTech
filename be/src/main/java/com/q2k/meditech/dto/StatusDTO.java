package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Status DTO
 * Dùng cho API PATCH /api/admin/users/{userId}/status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusDTO {
    
    @NotNull(message = "isActive is required")
    private Boolean isActive;
    
    private String reason; // Lý do enable/disable (optional)
}