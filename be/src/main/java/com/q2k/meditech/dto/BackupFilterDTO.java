package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.BackupStatus;
import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.StorageLocation;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO for filtering Backup History (FR-BACK-002)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackupFilterDTO {

    private BackupType type;
    private BackupStatus status;
    private StorageLocation location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;

    // Pagination
    @Builder.Default
    private Integer pageNumber = 0;

    @Builder.Default
    private Integer pageSize = 10;

    // Sorting
    @Builder.Default
    private String sortBy = "startedAt";

    @Builder.Default
    private String sortDir = "DESC";
}
