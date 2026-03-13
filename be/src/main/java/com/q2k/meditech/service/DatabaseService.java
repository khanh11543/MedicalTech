package com.q2k.meditech.service;

import java.util.List;
import java.util.Map;

/**
 * Service interface for low-level Database operations (mysqldump, restore, etc.)
 */
public interface DatabaseService {

    /**
     * Execute mysqldump to backup database
     * @param outputPath Output file path
     * @param options Additional options
     * @return Created backup file path
     */
    String executeMySQLDump(String outputPath, Map<String, Object> options);

    /**
     * Restore database from dump file
     * @param filePath Backup file path
     */
    void restoreFromDump(String filePath);

    /**
     * Get table statistics in database
     * @return List of table info: name, rows, dataSize, indexSize, dataFree
     */
    List<Map<String, Object>> getTableStats();

    /**
     * Get database fragmentation info
     * @return List of fragmented tables and their levels
     */
    List<Map<String, Object>> getFragmentationInfo();

    /**
     * Optimize (OPTIMIZE TABLE) for all tables
     * @return Optimize result for each table
     */
    List<Map<String, Object>> optimizeAllTables();

    /**
     * Analyze (ANALYZE TABLE) for all tables
     * @return Analyze result for each table
     */
    List<Map<String, Object>> analyzeAllTables();

    /**
     * Get database size
     * @return Size in bytes
     */
    Long getDatabaseSize();

    /**
     * Get list of all table names
     */
    List<String> getAllTableNames();

    /**
     * Check database connection
     * @return true if database is operating normally
     */
    boolean checkConnection();
}
