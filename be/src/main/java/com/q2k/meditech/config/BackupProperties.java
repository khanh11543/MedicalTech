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

    /** Storage path for backup files */
    private String storagePath = "./backups";

    /** Maximum number of days to retain backups */
    private int maxRetentionDays = 90;

    /** Path to mysqldump command */
    private String mysqlDumpPath = "mysqldump";

    /** Path to mysql command (for restore) */
    private String mysqlRestorePath = "mysql";

    /** Maximum backup size (GB) */
    private int maxBackupSizeGb = 10;

    /** Checksum algorithm */
    private String checksumAlgorithm = "SHA-256";

    /** Schedule configuration */
    private Schedule schedule = new Schedule();

    @Data
    public static class Schedule {

        /** Whether automatic scheduling is enabled */
        private boolean enabled = true;

        /** Cron expression for automatic backup (default: 2 AM daily) */
        private String cron = "0 0 2 * * ?";

        /** Cron expression for old backup cleanup (default: 3 AM Sunday) */
        private String cleanupCron = "0 0 3 * * SUN";
    }
}
