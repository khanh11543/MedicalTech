package com.q2k.meditech.service;

import com.q2k.meditech.entity.SystemOptimizationLog;
import com.q2k.meditech.entity.enums.OptimizationType;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.util.SecurityUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemOptimizationServiceImplTest {

    @Mock private SystemOptimizationLogRepository optimizationLogRepository;
    @Mock private DatabaseService databaseService;
    @Mock private UserRepository userRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private LoginAttemptRepository loginAttemptRepository;
    @Mock private UserSessionRepository userSessionRepository;
    @Mock private CacheManager cacheManager;
    @Mock private Cache cache;

    @InjectMocks
    private SystemOptimizationServiceImpl service;

    private MockedStatic<SecurityUtil> securityUtil;

    @AfterEach
    void tearDown() {
        if (securityUtil != null) {
            securityUtil.close();
        }
    }

    @Test
    void getDatabaseHealth_success() throws Exception {
        when(databaseService.checkConnection()).thenReturn(true);
        when(databaseService.getTableStats()).thenReturn(List.of(Map.of("t", "a")));
        when(databaseService.getDatabaseSize()).thenReturn(1000L);
        when(databaseService.getFragmentationInfo()).thenReturn(List.of());

        Map<String, Object> h = service.getDatabaseHealth();
        assertThat(h.get("connectionActive")).isEqualTo(true);
        assertThat(h).containsKey("healthScore");
    }

    @Test
    void defragmentDatabase_logsOptimization() {
        stubSaveLog();
        when(databaseService.optimizeAllTables()).thenReturn(List.of());
        when(databaseService.getDatabaseSize()).thenReturn(1L);

        SystemOptimizationLog log = service.defragmentDatabase();
        assertThat(log.getOptimizationType()).isEqualTo(OptimizationType.DB_DEFRAGMENT);
    }

    @Test
    void rebuildIndexes() {
        stubSaveLog();
        when(databaseService.analyzeAllTables()).thenReturn(List.of());
        when(databaseService.getDatabaseSize()).thenReturn(1L);
        assertThat(service.rebuildIndexes().getOptimizationType()).isEqualTo(OptimizationType.INDEX_REBUILD);
    }

    @Test
    void cleanOrphanedRecords() {
        stubSaveLog();
        when(databaseService.getDatabaseSize()).thenReturn(1L);
        assertThat(service.cleanOrphanedRecords().getOptimizationType()).isEqualTo(OptimizationType.ORPHAN_CLEANUP);
    }

    @Test
    void vacuumDatabase() {
        stubSaveLog();
        when(databaseService.optimizeAllTables()).thenReturn(List.of());
        when(databaseService.getDatabaseSize()).thenReturn(1L);
        assertThat(service.vacuumDatabase().getOptimizationType()).isEqualTo(OptimizationType.VACUUM);
    }

    @Test
    void getCacheStats() {
        when(cacheManager.getCacheNames()).thenReturn(Set.of("c1"));
        when(cacheManager.getCache("c1")).thenReturn(cache);

        Map<String, Object> s = service.getCacheStats();
        assertThat(s.get("totalCaches")).isEqualTo(1);
    }

    @Test
    void clearCache_all() {
        stubSaveLog();
        when(cacheManager.getCacheNames()).thenReturn(Set.of("x"));
        when(cacheManager.getCache("x")).thenReturn(cache);
        when(databaseService.getDatabaseSize()).thenReturn(1L);

        assertThat(service.clearCache(null).getOptimizationType()).isEqualTo(OptimizationType.CACHE_CLEAR);
        verify(cache).clear();
    }

    @Test
    void previewCleanup() {
        when(auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(any(), any())).thenReturn(List.of());

        Map<String, Object> p = service.previewCleanup(List.of("audit_logs"), LocalDateTime.now());
        assertThat(p).containsKey("audit_logs");
    }

    @Test
    void executeCleanup() {
        stubSaveLog();
        when(auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(any(), any())).thenReturn(List.of());
        when(databaseService.getDatabaseSize()).thenReturn(1L);

        assertThat(service.executeCleanup(List.of("audit_logs"), LocalDateTime.now()).getOptimizationType())
                .isEqualTo(OptimizationType.OLD_DATA_CLEANUP);
    }

    @Test
    void getDiskUsage(@TempDir Path tmp) {
        ReflectionTestUtils.setField(service, "storagePath", tmp.toString());
        when(databaseService.getDatabaseSize()).thenReturn(500L);

        Map<String, Object> d = service.getDiskUsage();
        assertThat(d).containsKeys("totalSpace", "backupSize");
    }

    @Test
    void findDuplicateFiles_emptyDir(@TempDir Path tmp) {
        ReflectionTestUtils.setField(service, "storagePath", tmp.toString());
        assertThat(service.findDuplicateFiles()).isEmpty();
    }

    @Test
    void archiveLogs() {
        stubSaveLog();
        when(auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(any(), any())).thenReturn(List.of());
        when(databaseService.getDatabaseSize()).thenReturn(1L);

        assertThat(service.archiveLogs(LocalDateTime.now()).getOptimizationType())
                .isEqualTo(OptimizationType.LOG_ARCHIVE);
    }

    @Test
    void getOptimizationHistory() {
        Pageable p = PageRequest.of(0, 5);
        Page<SystemOptimizationLog> page = new PageImpl<>(List.of());
        when(optimizationLogRepository.findAllByOrderByStartedAtDesc(p)).thenReturn(page);

        assertThat(service.getOptimizationHistory(p)).isSameAs(page);
    }

    private void stubSaveLog() {
        securityUtil = mockStatic(SecurityUtil.class);
        securityUtil.when(SecurityUtil::getCurrentUserId).thenReturn(null);
        when(optimizationLogRepository.save(any())).thenAnswer(i -> i.getArgument(0));
    }
}
