package com.q2k.meditech.dto.security;

import com.q2k.meditech.entity.enums.BlockScope;
import com.q2k.meditech.entity.enums.BlockType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for blocking an IP address (10.2).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockIpDTO {
    @NotBlank(message = "IP address is required")
    @Size(max = 45, message = "IP address must not exceed 45 characters")
    private String ipAddress;

    @NotBlank(message = "Reason is required")
    @Size(max = 255, message = "Reason must not exceed 255 characters")
    private String reason;

    @NotNull(message = "Block type is required")
    private BlockType blockType;

    @Builder.Default
    private BlockScope blockScope = BlockScope.ENTIRE_SYSTEM;

    // Only required for TEMPORARY blocks
    private LocalDateTime expiresAt;
}
