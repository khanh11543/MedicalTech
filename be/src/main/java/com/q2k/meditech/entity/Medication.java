package com.q2k.meditech.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "medications")
public class Medication extends BaseEntity {


    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name="generic_name")
    private String genericName;

    @Column(name="brand_name")
    private String brandName;

    private String category;

    @Column(name="dosage_form", length = 50)
    private String dosageForm;

    private String strength;

    @Column(length = 50)
    private String unit;

    private String manufacturer;

    @Column(name="country_of_origin")
    private String countryOfOrigin;

    @Lob
    private String description;

    @Lob
    @Column(name="side_effects")
    private String sideEffects;

    @Lob
    private String contraindications;

    @Column(name="storage_conditions")
    private String storageConditions;

    @Builder.Default
    @Column(name="requires_prescription")
    private Boolean requiresPrescription = true;

    @Column(name="unit_price")
    private BigDecimal unitPrice;

    @Builder.Default
    @Column(name="is_active")
    private Boolean isActive = true;
}
