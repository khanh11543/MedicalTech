package com.q2k.meditech.service;

import com.q2k.meditech.entity.BackupRecord;
import com.q2k.meditech.entity.BackupSchedule;
import com.q2k.meditech.entity.enums.BackupStatus;
import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.StorageLocation;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.BackupRecordRepository;
import com.q2k.meditech.repository.BackupScheduleRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.SecurityUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BackupServiceImplTest {

    @Mock
    private BackupRecordRepository backupRecordRepository;

    @Mock
    private BackupScheduleRepository backupScheduleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DatabaseService databaseService;

    @Mock
    private NotificationEventService notificationEventService;

    @InjectMocks
    private BackupServiceImpl service;

    @BeforeEach
    void paths() {
        ReflectionTestUtils.setField(service, "storagePath", "./target/backup-test-storage");
        ReflectionTestUtils.setField(service, "maxRetentionDays", 90);
    }

    @Test
    void getDashboard() {
        when(backupRecordRepository.findTopByStatusOrderByCompletedAtDesc(BackupStatus.COMPLETED))
                .thenReturn(Optional.empty());
        when(backupScheduleRepository.findByEnabledTrue()).thenReturn(List.of());
        when(backupRecordRepository.countByStatus(any())).thenReturn(0L);
        when(backupRecordRepository.getTotalBackupSize()).thenReturn(0L);
        assertThat(service.getDashboard()).containsKeys("lastBackup", "health", "storageInfo");
    }

    @Test
    void getHistory_and_getDetail() {
        when(backupRecordRepository.findWithFilters(isNull(), isNull(), isNull(), isNull(), isNull(), any()))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(service.getHistory(null, null, null, null, null, PageRequest.of(0, 5)).getContent()).isEmpty();
        BackupRecord r = BackupRecord.builder().backupName("b").backupType(BackupType.MANUAL).build();
        r.setId(1L);
        when(backupRecordRepository.findById(1L)).thenReturn(Optional.of(r));
        assertThat(service.getDetail(1L)).isSameAs(r);
    }

    @Test
    void verifyBackup_missingPath(@TempDir Path dir) throws Exception {
        BackupRecord r = BackupRecord.builder().backupName("b").backupType(BackupType.MANUAL).build();
        r.setId(1L);
        r.setStoragePath(null);
        when(backupRecordRepository.findById(1L)).thenReturn(Optional.of(r));
        assertThat((Boolean) service.verifyBackup(1L).get("verified")).isFalse();

        Path f = dir.resolve("dump.sql");
        Files.writeString(f, "hello", StandardCharsets.UTF_8);
        r.setStoragePath(f.toString());
        when(backupRecordRepository.findById(1L)).thenReturn(Optional.of(r));
        assertThat((Boolean) service.verifyBackup(1L).get("verified")).isTrue();
    }

    @Test
    void deleteBackup_removesFile(@TempDir Path dir) throws Exception {
        Path f = dir.resolve("x.sql");
        Files.writeString(f, "data", StandardCharsets.UTF_8);
        BackupRecord r = BackupRecord.builder().backupName("b").backupType(BackupType.MANUAL).build();
        r.setId(2L);
        r.setStoragePath(f.toString());
        when(backupRecordRepository.findById(2L)).thenReturn(Optional.of(r));
        service.deleteBackup(2L);
        verify(backupRecordRepository).delete(r);
    }

    @Test
    void downloadBackup_readable(@TempDir Path dir) throws Exception {
        Path f = dir.resolve("d.sql");
        Files.writeString(f, "z", StandardCharsets.UTF_8);
        BackupRecord r = BackupRecord.builder().backupName("b").backupType(BackupType.MANUAL).build();
        r.setId(3L);
        r.setStoragePath(f.toString());
        when(backupRecordRepository.findById(3L)).thenReturn(Optional.of(r));
        Resource res = service.downloadBackup(3L);
        assertThat(res.exists()).isTrue();
    }

    @Test
    void runManualBackup_registersAsync_andCompletes() throws Exception {
        try (MockedStatic<SecurityUtil> sec = mockStatic(SecurityUtil.class);
             MockedStatic<TransactionSynchronizationManager> ts = mockStatic(TransactionSynchronizationManager.class);
             MockedStatic<CompletableFuture> cf = mockStatic(CompletableFuture.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(null);
            ts.when(TransactionSynchronizationManager::isSynchronizationActive).thenReturn(true);
            ts.when(() -> TransactionSynchronizationManager.registerSynchronization(any(TransactionSynchronization.class)))
                    .thenAnswer(inv -> {
                        ((TransactionSynchronization) inv.getArgument(0)).afterCommit();
                        return null;
                    });
            cf.when(() -> CompletableFuture.runAsync(any(Runnable.class)))
                    .thenAnswer(inv -> {
                        ((Runnable) inv.getArgument(0)).run();
                        return CompletableFuture.completedFuture(null);
                    });

            when(backupRecordRepository.findByStatus(BackupStatus.IN_PROGRESS)).thenReturn(List.of());
            AtomicReference<BackupRecord> ref = new AtomicReference<>();
            when(backupRecordRepository.save(any(BackupRecord.class))).thenAnswer(inv -> {
                BackupRecord br = inv.getArgument(0);
                if (br.getId() == null) {
                    br.setId(100L);
                }
                ref.set(br);
                return br;
            });
            when(backupRecordRepository.findById(100L)).thenAnswer(inv -> Optional.ofNullable(ref.get()));

            doAnswer(inv -> {
                String out = inv.getArgument(0, String.class);
                Files.createDirectories(Path.of(out).getParent());
                Files.writeString(Path.of(out), "dump", StandardCharsets.UTF_8);
                return out;
            }).when(databaseService).executeMySQLDump(anyString(), any());

            Path storage = Path.of("./target/backup-test-storage");
            Files.createDirectories(storage);

            BackupRecord out = service.runManualBackup("manual", BackupType.MANUAL, List.of("DATABASE"),
                    StorageLocation.LOCAL, false);
            assertThat(out.getId()).isEqualTo(100L);
            verify(notificationEventService).onBackupCompleted(anyString());
        }
    }

    @Test
    void runManualBackup_conflict_throws() {
        try (MockedStatic<SecurityUtil> sec = mockStatic(SecurityUtil.class);
             MockedStatic<TransactionSynchronizationManager> ts = mockStatic(TransactionSynchronizationManager.class);
             MockedStatic<CompletableFuture> cf = mockStatic(CompletableFuture.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(null);
            ts.when(TransactionSynchronizationManager::isSynchronizationActive).thenReturn(true);
            ts.when(() -> TransactionSynchronizationManager.registerSynchronization(any())).thenAnswer(inv -> null);
            cf.when(() -> CompletableFuture.runAsync(any(Runnable.class)))
                    .thenAnswer(inv -> CompletableFuture.completedFuture(null));
            BackupRecord inProg = BackupRecord.builder().backupName("x").backupType(BackupType.MANUAL).build();
            when(backupRecordRepository.findByStatus(BackupStatus.IN_PROGRESS)).thenReturn(List.of(inProg));
            assertThatThrownBy(() -> service.runManualBackup("n", BackupType.MANUAL, List.of(), StorageLocation.LOCAL, false))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    @Test
    void getBackupProgress() {
        BackupRecord r = BackupRecord.builder().backupName("b").backupType(BackupType.MANUAL).build();
        r.setId(4L);
        when(backupRecordRepository.findById(4L)).thenReturn(Optional.of(r));
        assertThat(service.getBackupProgress(4L)).isSameAs(r);
    }

    @Test
    void cancelBackup() {
        BackupRecord r = BackupRecord.builder()
                .backupName("b")
                .backupType(BackupType.MANUAL)
                .status(BackupStatus.IN_PROGRESS)
                .build();
        r.setId(6L);
        when(backupRecordRepository.findById(6L)).thenReturn(Optional.of(r));
        when(backupRecordRepository.save(any(BackupRecord.class))).thenAnswer(i -> i.getArgument(0));
        service.cancelBackup(6L);
        assertThat(r.getStatus()).isEqualTo(BackupStatus.CANCELLED);
    }

    @Test
    void scheduleCrud() {
        when(backupScheduleRepository.findAll()).thenReturn(List.of());
        assertThat(service.getSchedules()).isEmpty();

        try (MockedStatic<SecurityUtil> sec = mockStatic(SecurityUtil.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(null);
            BackupSchedule sch = BackupSchedule.builder().name("S").backupType(BackupType.FULL).cronExpression("0 0 1 * * ?").build();
            when(backupScheduleRepository.existsByName("S")).thenReturn(false);
            when(backupScheduleRepository.save(any(BackupSchedule.class))).thenAnswer(i -> i.getArgument(0));
            assertThat(service.createSchedule(sch).getName()).isEqualTo("S");
        }

        BackupSchedule existing = BackupSchedule.builder().name("Old").backupType(BackupType.FULL).cronExpression("0 0 1 * * ?").build();
        existing.setId(7L);
        when(backupScheduleRepository.findById(7L)).thenReturn(Optional.of(existing));
        when(backupScheduleRepository.save(any(BackupSchedule.class))).thenAnswer(i -> i.getArgument(0));
        BackupSchedule patch = BackupSchedule.builder().name("New").backupType(BackupType.INCREMENTAL).cronExpression("0 0 2 * * ?").build();
        assertThat(service.updateSchedule(7L, patch).getName()).isEqualTo("New");

        when(backupScheduleRepository.existsById(8L)).thenReturn(true);
        service.deleteSchedule(8L);
        verify(backupScheduleRepository).deleteById(8L);

        BackupSchedule t = BackupSchedule.builder().name("T").enabled(false).backupType(BackupType.FULL).cronExpression("0 0 1 * * ?").build();
        t.setId(9L);
        when(backupScheduleRepository.findById(9L)).thenReturn(Optional.of(t));
        when(backupScheduleRepository.save(any(BackupSchedule.class))).thenAnswer(i -> i.getArgument(0));
        assertThat(service.toggleSchedule(9L, true).getEnabled()).isTrue();
    }

    @Test
    void createSchedule_duplicateName_throws() {
        try (MockedStatic<SecurityUtil> sec = mockStatic(SecurityUtil.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(null);
            BackupSchedule sch = BackupSchedule.builder().name("Dup").backupType(BackupType.FULL).cronExpression("0 0 1 * * ?").build();
            when(backupScheduleRepository.existsByName("Dup")).thenReturn(true);
            assertThatThrownBy(() -> service.createSchedule(sch)).isInstanceOf(BadRequestException.class);
        }
    }

    @Test
    void deleteSchedule_missing_throws() {
        when(backupScheduleRepository.existsById(99L)).thenReturn(false);
        assertThatThrownBy(() -> service.deleteSchedule(99L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
