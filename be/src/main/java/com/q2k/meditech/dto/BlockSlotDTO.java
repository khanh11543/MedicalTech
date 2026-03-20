package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO for blocking a time slot
 * Reason is REQUIRED - doctor must explicitly provide reason for blocking
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockSlotDTO {
    
    @NotBlank(message = "Reason for blocking is required")
    @Size(max = 255, message = "Reason must not exceed 255 characters")
    private String reason;
}
