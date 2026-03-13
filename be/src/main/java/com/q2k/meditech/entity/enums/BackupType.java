package com.q2k.meditech.entity.enums;

public enum BackupType {
    FULL,           // Full backup
    INCREMENTAL,    // Incremental backup
    DIFFERENTIAL,   // Differential from latest full backup
    MANUAL          // Manual backup
}
