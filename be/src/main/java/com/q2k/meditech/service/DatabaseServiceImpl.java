package com.q2k.meditech.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.*;
import java.util.*;

/**
 * Low-level Database operations: mysqldump, restore, table stats, etc.
 */
@Service
@Slf4j
public class DatabaseServiceImpl implements DatabaseService {

    private final JdbcTemplate jdbcTemplate;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String dbUsername;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    @Value("${app.backup.mysql-dump-path:mysqldump}")
    private String mysqlDumpPath;

    public DatabaseServiceImpl(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public String executeMySQLDump(String outputPath, Map<String, Object> options) {
        log.info("Executing mysqldump to: {}", outputPath);

        // Parse connection info from datasource URL
        // jdbc:mysql://localhost:3307/medical_appointment_system?...
        String host = "localhost";
        String port = "3307";
        String dbName = "medical_appointment_system";

        try {
            String url = datasourceUrl;
            if (url.contains("://")) {
                String hostPart = url.split("://")[1].split("\\?")[0];
                if (hostPart.contains("/")) {
                    String[] parts = hostPart.split("/");
                    dbName = parts[1];
                    String hostPort = parts[0];
                    if (hostPort.contains(":")) {
                        host = hostPort.split(":")[0];
                        port = hostPort.split(":")[1];
                    } else {
                        host = hostPort;
                        port = "3306";
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not parse datasource URL, using defaults: {}", e.getMessage());
        }

        List<String> command = new ArrayList<>(Arrays.asList(
                mysqlDumpPath,
                "-h", host,
                "-P", port,
                "-u", dbUsername,
                "-p" + dbPassword,
                "--single-transaction",
                "--routines",
                "--triggers",
                "--result-file=" + outputPath,
                dbName
        ));

        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Read output
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                String error = "mysqldump failed with exit code " + exitCode + ": " + output;
                log.error(error);
                throw new RuntimeException(error);
            }

            log.info("mysqldump completed successfully: {}", outputPath);
            return outputPath;

        } catch (IOException | InterruptedException e) {
            log.error("mysqldump execution error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to execute mysqldump: " + e.getMessage(), e);
        }
    }

    @Override
    public void restoreFromDump(String filePath) {
        log.info("Restoring database from: {}", filePath);

        String host = "localhost";
        String port = "3307";
        String dbName = "medical_appointment_system";

        try {
            String url = datasourceUrl;
            if (url.contains("://")) {
                String hostPart = url.split("://")[1].split("\\?")[0];
                if (hostPart.contains("/")) {
                    String[] parts = hostPart.split("/");
                    dbName = parts[1];
                    String hostPort = parts[0];
                    if (hostPort.contains(":")) {
                        host = hostPort.split(":")[0];
                        port = hostPort.split(":")[1];
                    } else {
                        host = hostPort;
                        port = "3306";
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not parse datasource URL, using defaults: {}", e.getMessage());
        }

        List<String> command = Arrays.asList(
                "mysql",
                "-h", host,
                "-P", port,
                "-u", dbUsername,
                "-p" + dbPassword,
                dbName
        );

        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectInput(new File(filePath));
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                String error = "mysql restore failed with exit code " + exitCode + ": " + output;
                log.error(error);
                throw new RuntimeException(error);
            }

            log.info("Database restore completed successfully from: {}", filePath);

        } catch (IOException | InterruptedException e) {
            log.error("Database restore error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to restore database: " + e.getMessage(), e);
        }
    }

    @Override
    public List<Map<String, Object>> getTableStats() {
        String sql = "SELECT table_name, table_rows, data_length, index_length, data_free, " +
                "ROUND((data_length + index_length) / 1024 / 1024, 2) AS total_size_mb " +
                "FROM information_schema.TABLES " +
                "WHERE table_schema = DATABASE() " +
                "ORDER BY (data_length + index_length) DESC";

        return jdbcTemplate.queryForList(sql);
    }

    @Override
    public List<Map<String, Object>> getFragmentationInfo() {
        String sql = "SELECT table_name, data_free, data_length, " +
                "ROUND(data_free / (data_length + 1) * 100, 2) AS fragmentationPct " +
                "FROM information_schema.TABLES " +
                "WHERE table_schema = DATABASE() AND data_free > 0 " +
                "ORDER BY data_free DESC";

        return jdbcTemplate.queryForList(sql);
    }

    @Override
    public List<Map<String, Object>> optimizeAllTables() {
        List<String> tableNames = getAllTableNames();
        List<Map<String, Object>> results = new ArrayList<>();

        for (String tableName : tableNames) {
            try {
                List<Map<String, Object>> result = jdbcTemplate.queryForList("OPTIMIZE TABLE " + tableName);
                Map<String, Object> tableResult = new LinkedHashMap<>();
                tableResult.put("table", tableName);
                tableResult.put("status", "SUCCESS");
                tableResult.put("details", result);
                results.add(tableResult);
            } catch (Exception e) {
                Map<String, Object> tableResult = new LinkedHashMap<>();
                tableResult.put("table", tableName);
                tableResult.put("status", "FAILED");
                tableResult.put("error", e.getMessage());
                results.add(tableResult);
            }
        }

        return results;
    }

    @Override
    public List<Map<String, Object>> analyzeAllTables() {
        List<String> tableNames = getAllTableNames();
        List<Map<String, Object>> results = new ArrayList<>();

        for (String tableName : tableNames) {
            try {
                List<Map<String, Object>> result = jdbcTemplate.queryForList("ANALYZE TABLE " + tableName);
                Map<String, Object> tableResult = new LinkedHashMap<>();
                tableResult.put("table", tableName);
                tableResult.put("status", "SUCCESS");
                tableResult.put("details", result);
                results.add(tableResult);
            } catch (Exception e) {
                Map<String, Object> tableResult = new LinkedHashMap<>();
                tableResult.put("table", tableName);
                tableResult.put("status", "FAILED");
                tableResult.put("error", e.getMessage());
                results.add(tableResult);
            }
        }

        return results;
    }

    @Override
    public Long getDatabaseSize() {
        String sql = "SELECT SUM(data_length + index_length) AS total_size " +
                "FROM information_schema.TABLES " +
                "WHERE table_schema = DATABASE()";

        Map<String, Object> result = jdbcTemplate.queryForMap(sql);
        Object totalSize = result.get("total_size");
        return totalSize != null ? ((Number) totalSize).longValue() : 0L;
    }

    @Override
    public List<String> getAllTableNames() {
        String sql = "SELECT table_name FROM information_schema.TABLES " +
                "WHERE table_schema = DATABASE() " +
                "ORDER BY table_name";

        return jdbcTemplate.queryForList(sql, String.class);
    }

    @Override
    public boolean checkConnection() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return true;
        } catch (Exception e) {
            log.error("Database connection check failed: {}", e.getMessage());
            return false;
        }
    }
}
