package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryLogDTO {
    private Long id;
    private Long medicationId;
    private String medicationName;
    private String medicationCode;
    private String type;
    private Integer quantityBefore;
    private Integer quantityAfter;
    private Integer delta;
    private String note;
    private LocalDateTime changedAt;

    // Audit fields
    private Long userId;
    private String userName;
    private String referenceType;
    private Long referenceId;
    private String ipAddress;
    private String userAgent;
}
