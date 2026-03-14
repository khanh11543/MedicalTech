package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.StorageLocation;
import lombok.*;

import java.util.List;

/**
 * DTO for Manual Backup request (FR-BACK-003)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ManualBackupRequestDTO {

    /** Backup name (e.g., "daily_backup_2026-02-17") */
    private String backupName;

    /** Backup type */
    @Builder.Default
    private BackupType backupType = BackupType.MANUAL;

    /** Components to back up: DATABASE, FILES, CONFIG */
    private List<String> includes;

    /** Storage location */
    @Builder.Default
    private StorageLocation storageLocation = StorageLocation.LOCAL;

    /** Whether to encrypt the backup */
    @Builder.Default
    private Boolean encrypted = false;
}
