package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.OptimizationType;
import lombok.*;

import java.util.List;

/**
 * DTO for Optimization request (FR-BACK-006)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OptimizeRequestDTO {

    /** Optimization type */
    private OptimizationType optimizationType;

    /** List of tables to optimize (null = all) */
    private List<String> targetTables;

    /** Cache types to clear */
    private List<String> cacheTypes;

    /** Notes */
    private String notes;
}
