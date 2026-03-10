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

    /** Tên schedule */
    private String name;

    /** Loại backup */
    private BackupType backupType;

    /** Cron expression (vd: "0 0 2 * * ?" = 2h sáng hàng ngày) */
    private String cronExpression;

    /** Nơi lưu trữ */
    @Builder.Default
    private StorageLocation storageLocation = StorageLocation.LOCAL;

    /** Số ngày giữ lại backup */
    @Builder.Default
    private Integer retentionDays = 30;

    /** Có mã hóa không */
    @Builder.Default
    private Boolean encrypted = false;

    /** Thành phần backup: DATABASE, FILES, CONFIG */
    private String includes;

    /** Bật/tắt schedule */
    @Builder.Default
    private Boolean enabled = true;

    /** Đường dẫn lưu trữ */
    private String storagePath;

    /** Số lượng backup tối đa giữ lại */
    @Builder.Default
    private Integer maxBackups = 10;
}
