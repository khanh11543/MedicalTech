package com.q2k.meditech.entity.enums;

public enum BackupType {
    FULL,           // Backup toàn bộ
    INCREMENTAL,    // Backup phần thay đổi
    DIFFERENTIAL,   // Backup khác biệt từ bản full gần nhất
    MANUAL          // Backup thủ công
}
