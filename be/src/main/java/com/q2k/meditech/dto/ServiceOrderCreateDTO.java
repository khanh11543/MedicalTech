package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO for creating a new ServiceOrder
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceOrderCreateDTO {

    @NotBlank(message = "Service name is required")
    private String serviceName;

    @NotNull(message = "Category is required")
    private String category;

    /** ID of the MedicalService from catalog (optional but recommended) */
    private Long medicalServiceId;

    private BigDecimal price;

    private String priority; // ROUTINE, URGENT, STAT

    private String notes;
}
