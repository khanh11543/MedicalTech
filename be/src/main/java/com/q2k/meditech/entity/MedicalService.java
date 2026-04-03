package com.q2k.meditech.entity;

import com.q2k.meditech.entity.enums.ServiceCategory;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * MedicalService — catalog of available medical services
 * (lab tests, imaging, ultrasound, etc.) organized by Specialty.
 * Each service belongs to one Specialty department.
 */
@Entity
@Table(name = "medical_services", indexes = {
    @Index(name = "idx_ms_category", columnList = "category"),
    @Index(name = "idx_ms_specialty_id", columnList = "specialty_id"),
    @Index(name = "idx_ms_active", columnList = "active")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalService extends BaseEntity {

    /** Category enum - used for backward compatibility and categorization */
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private ServiceCategory category;

    /** The specialty/department this service belongs to */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "specialty_id", nullable = false)
    private Specialty specialty;

    @Column(name = "service_name", nullable = false, length = 200)
    private String serviceName;

    @Column(name = "default_price", precision = 12, scale = 2)
    private BigDecimal defaultPrice;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;
}
