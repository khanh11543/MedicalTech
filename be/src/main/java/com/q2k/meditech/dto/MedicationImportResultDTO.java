package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicationImportResultDTO {
    private int totalRows;
    private int successCount;
    private int createdCount;
    private int updatedCount;
    private int skippedCount;
    private List<MedicationImportErrorDTO> errors;
}

