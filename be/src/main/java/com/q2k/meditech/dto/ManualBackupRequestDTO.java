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

    /** Tên backup (vd: "daily_backup_2026-02-17") */
    private String backupName;

    /** Loại backup */
    @Builder.Default
    private BackupType backupType = BackupType.MANUAL;

    /** Thành phần cần backup: DATABASE, FILES, CONFIG */
    private List<String> includes;

    /** Nơi lưu trữ */
    @Builder.Default
    private StorageLocation storageLocation = StorageLocation.LOCAL;

    /** Có mã hóa backup không */
    @Builder.Default
    private Boolean encrypted = false;
}
