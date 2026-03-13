package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.StorageLocation;
import lombok.*;

/**
 * DTO for Backup Schedule create/update
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackupScheduleDTO {

    private Long id;

    /** Schedule name */
    private String name;

    /** Backup type */
    private BackupType backupType;

    /** Cron expression (e.g. "0 0 2 * * ?" = 2 AM daily) */
    private String cronExpression;

    /** Storage location */
    @Builder.Default
    private StorageLocation storageLocation = StorageLocation.LOCAL;

    /** Number of days to retain backups */
    @Builder.Default
    private Integer retentionDays = 30;

    /** Whether to encrypt */
    @Builder.Default
    private Boolean encrypted = false;

    /** Backup components: DATABASE, FILES, CONFIG */
    private String includes;

    /** Enable/disable schedule */
    @Builder.Default
    private Boolean enabled = true;

    /** Storage path */
    private String storagePath;

    /** Maximum number of backups to retain */
    @Builder.Default
    private Integer maxBackups = 10;
}
