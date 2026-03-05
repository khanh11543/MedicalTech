package com.q2k.meditech.entity.enums;

public enum OptimizationType {
    DB_DEFRAGMENT,      // Chống phân mảnh database
    INDEX_REBUILD,      // Rebuild indexes
    CACHE_CLEAR,        // Xóa cache
    ORPHAN_CLEANUP,     // Dọn dẹp dữ liệu orphan
    VACUUM,             // Vacuum database
    DUPLICATE_REMOVE,   // Xóa file trùng lặp
    LOG_ARCHIVE,        // Lưu trữ log cũ
    OLD_DATA_CLEANUP    // Dọn dẹp dữ liệu cũ
}
