package com.q2k.meditech.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAuditFilterDTO {
    private Long medicationId;
    private String action;          // INVENTORY_IMPORT, INVENTORY_EXPORT, etc.
    private String referenceType;   // MANUAL, PRESCRIPTION, REFUND, SYSTEM
    private Long userId;
    private String from;            // yyyy-MM-dd
    private String to;              // yyyy-MM-dd
    private String search;          // search medication name/code or note
    private int page = 0;
    private int size = 20;
    private String sortBy = "changedAt";
    private String sortDir = "DESC";
}
