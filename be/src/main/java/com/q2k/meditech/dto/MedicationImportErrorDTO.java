package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicationImportErrorDTO {
    private int rowNumber;
    private String code;
    private String message;
}

