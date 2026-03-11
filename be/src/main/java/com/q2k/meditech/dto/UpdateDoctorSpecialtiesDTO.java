package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDoctorSpecialtiesDTO {
    @NotEmpty(message = "At least one specialty is required")
    private Set<Long> specialtyIds;

    @NotNull(message = "Primary specialty is required")
    private Long primarySpecialtyId;
}
