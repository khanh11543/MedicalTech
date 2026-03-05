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

    /** Loại tối ưu hóa */
    private OptimizationType optimizationType;

    /** Danh sách bảng cần tối ưu (null = tất cả) */
    private List<String> targetTables;

    /** Các loại cache cần xóa */
    private List<String> cacheTypes;

    /** Ghi chú */
    private String notes;
}
