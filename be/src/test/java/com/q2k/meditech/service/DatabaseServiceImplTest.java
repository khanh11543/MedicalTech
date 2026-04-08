package com.q2k.meditech.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatabaseServiceImplTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    private DatabaseServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new DatabaseServiceImpl(jdbcTemplate);
        ReflectionTestUtils.setField(service, "datasourceUrl", "jdbc:mysql://localhost:3306/testdb");
        ReflectionTestUtils.setField(service, "dbUsername", "u");
        ReflectionTestUtils.setField(service, "dbPassword", "p");
        ReflectionTestUtils.setField(service, "mysqlDumpPath", "mysqldump");
    }

    @Test
    void getTableStats() {
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of(Map.of("table_name", "t1")));
        assertThat(service.getTableStats()).hasSize(1);
    }

    @Test
    void getFragmentationInfo() {
        when(jdbcTemplate.queryForList(anyString())).thenReturn(List.of());
        assertThat(service.getFragmentationInfo()).isEmpty();
    }

    @Test
    void getAllTableNames() {
        when(jdbcTemplate.queryForList(anyString(), eq(String.class))).thenReturn(List.of("users"));
        assertThat(service.getAllTableNames()).containsExactly("users");
    }

    @Test
    void getDatabaseSize() {
        when(jdbcTemplate.queryForMap(anyString())).thenReturn(Map.of("total_size", 100L));
        assertThat(service.getDatabaseSize()).isEqualTo(100L);
    }

    @Test
    void checkConnection_ok() {
        when(jdbcTemplate.queryForObject(eq("SELECT 1"), eq(Integer.class))).thenReturn(1);
        assertThat(service.checkConnection()).isTrue();
    }

    @Test
    void checkConnection_fail() {
        when(jdbcTemplate.queryForObject(eq("SELECT 1"), eq(Integer.class)))
                .thenThrow(new RuntimeException("down"));
        assertThat(service.checkConnection()).isFalse();
    }

    @Test
    void optimizeAllTables_runsPerTable() {
        when(jdbcTemplate.queryForList(anyString(), eq(String.class))).thenReturn(List.of("ok_table"));
        when(jdbcTemplate.queryForList(org.mockito.ArgumentMatchers.contains("OPTIMIZE TABLE")))
                .thenReturn(List.of());
        assertThat(service.optimizeAllTables()).hasSize(1);
    }

    @Test
    void analyzeAllTables_runsPerTable() {
        when(jdbcTemplate.queryForList(anyString(), eq(String.class))).thenReturn(List.of("ok_table"));
        when(jdbcTemplate.queryForList(org.mockito.ArgumentMatchers.contains("ANALYZE TABLE")))
                .thenReturn(List.of());
        assertThat(service.analyzeAllTables()).hasSize(1);
    }
}
