package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.RestoreType;
import lombok.*;

import java.util.List;

/**
 * DTO for Restore request (FR-BACK-004)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestoreRequestDTO {

    /** ID of the backup to restore */
    private Long backupId;

    /** Restore type: FULL, PARTIAL, TEST */
    @Builder.Default
    private RestoreType restoreType = RestoreType.FULL;

    /** List of items to restore (used for PARTIAL) */
    private List<String> items;

    /** Decryption password (if backup is encrypted) */
    private String password;

    /** Whether to create a backup before restoring */
    @Builder.Default
    private Boolean createPreRestoreBackup = true;
}
