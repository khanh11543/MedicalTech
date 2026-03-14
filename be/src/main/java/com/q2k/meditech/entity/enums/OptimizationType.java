package com.q2k.meditech.entity.enums;

public enum OptimizationType {
    DB_DEFRAGMENT,      // Database defragmentation
    INDEX_REBUILD,      // Rebuild indexes
    CACHE_CLEAR,        // Clear cache
    ORPHAN_CLEANUP,     // Clean up orphaned data
    VACUUM,             // Vacuum database
    DUPLICATE_REMOVE,   // Remove duplicate files
    LOG_ARCHIVE,        // Archive old logs
    OLD_DATA_CLEANUP    // Clean up old data
}
