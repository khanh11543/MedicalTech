package com.q2k.meditech.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventorySummaryDTO {
    private long totalMedications;
    private long activeMedications;
    private long inStockCount;       // quantity > 0
    private long lowStockCount;      // 1 <= quantity <= 10
    private long outOfStockCount;    // quantity == 0
    private long totalUnits;         // sum of all quantities
}
