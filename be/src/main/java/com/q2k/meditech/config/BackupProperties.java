package com.q2k.meditech.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Backup Configuration Properties
 * Binds to properties with prefix "app.backup"
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.backup")
public class BackupProperties {

    /** Đường dẫn lưu trữ backup files */
    private String storagePath = "./backups";

    /** Số ngày giữ lại backup tối đa */
    private int maxRetentionDays = 90;

    /** Đường dẫn tới lệnh mysqldump */
    private String mysqlDumpPath = "mysqldump";

    /** Đường dẫn tới lệnh mysql (để restore) */
    private String mysqlRestorePath = "mysql";

    /** Kích thước backup tối đa (GB) */
    private int maxBackupSizeGb = 10;

    /** Thuật toán checksum */
    private String checksumAlgorithm = "SHA-256";

    /** Cấu hình schedule */
    private Schedule schedule = new Schedule();

    @Data
    public static class Schedule {

        /** Có bật schedule tự động không */
        private boolean enabled = true;

        /** Cron expression cho backup tự động (default: 2h sáng hàng ngày) */
        private String cron = "0 0 2 * * ?";

        /** Cron expression cho cleanup backup cũ (default: 3h sáng Chủ Nhật) */
        private String cleanupCron = "0 0 3 * * SUN";
    }
}
