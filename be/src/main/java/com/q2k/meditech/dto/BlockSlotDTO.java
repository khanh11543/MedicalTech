package com.q2k.meditech.dto;

import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO for blocking a time slot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockSlotDTO {
    
    @Size(max = 255, message = "Reason must not exceed 255 characters")
    private String reason;
}
