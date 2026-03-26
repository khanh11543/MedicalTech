package com.q2k.meditech.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicationDTO {
    private Long id;
    private String code;
    private String name;
    private String genericName;
    private String brandName;
    private String category;
    private String dosageForm;
    private String strength;
    private String unit;
    private String manufacturer;
    private String countryOfOrigin;
    private String description;
    private String sideEffects;
    private String contraindications;
    private String storageConditions;
    private Boolean requiresPrescription;
    private BigDecimal unitPrice;
    private Boolean isActive;
    // Inventory
    private Integer availableQuantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
