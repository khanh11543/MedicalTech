package com.q2k.meditech.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicationCreateDTO {

    @NotBlank(message = "Code is required")
    private String code;

    @NotBlank(message = "Name is required")
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

    @Builder.Default
    private Boolean requiresPrescription = true;

    @DecimalMin(value = "0", message = "Price cannot be negative")
    private BigDecimal unitPrice;

    @Builder.Default
    @Min(value = 0, message = "Initial quantity cannot be negative")
    private Integer initialQuantity = 0;
}
