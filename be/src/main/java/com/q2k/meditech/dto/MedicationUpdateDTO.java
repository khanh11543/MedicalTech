package com.q2k.meditech.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicationUpdateDTO {
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

    @DecimalMin(value = "0", message = "Price cannot be negative")
    private BigDecimal unitPrice;
}
