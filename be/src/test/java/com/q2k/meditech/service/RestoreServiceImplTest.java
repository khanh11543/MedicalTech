package com.q2k.meditech.service;

import com.q2k.meditech.entity.BackupRecord;
import com.q2k.meditech.entity.RestoreRecord;
import com.q2k.meditech.entity.enums.BackupStatus;
import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.RestoreStatus;
import com.q2k.meditech.entity.enums.RestoreType;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.BackupRecordRepository;
import com.q2k.meditech.repository.RestoreRecordRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RestoreServiceImplTest {

    @Mock private RestoreRecordRepository restoreRecordRepository;
    @Mock private BackupRecordRepository backupRecordRepository;
    @Mock private UserRepository userRepository;
    @Mock private DatabaseService databaseService;
    @Mock private BackupService backupService;

    @InjectMocks
    private RestoreServiceImpl service;

    @Test
    void getRestoreProgress_found() {
        BackupRecord br = BackupRecord.builder().backupName("b").backupType(BackupType.MANUAL).build();
        RestoreRecord r = RestoreRecord.builder().backupRecord(br).build();
        r.setId(1L);
        when(restoreRecordRepository.findById(1L)).thenReturn(Optional.of(r));
        assertThat(service.getRestoreProgress(1L)).isSameAs(r);
    }

    @Test
    void getRestoreProgress_missing_throws() {
        when(restoreRecordRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getRestoreProgress(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getRestoreHistory() {
        Pageable p = PageRequest.of(0, 5);
        Page<RestoreRecord> page = Page.empty(p);
        when(restoreRecordRepository.findAllByOrderByStartedAtDesc(p)).thenReturn(page);
        assertThat(service.getRestoreHistory(p)).isSameAs(page);
    }

    @Test
    void getRestoreDetail() {
        BackupRecord br = BackupRecord.builder().backupName("x").backupType(BackupType.MANUAL).build();
        RestoreRecord r = RestoreRecord.builder().backupRecord(br).build();
        r.setId(2L);
        when(restoreRecordRepository.findById(2L)).thenReturn(Optional.of(r));
        assertThat(service.getRestoreDetail(2L)).isSameAs(r);
    }

    @Test
    void getRestoreSummary() {
        when(restoreRecordRepository.count()).thenReturn(3L);
        when(restoreRecordRepository.countByStatus(RestoreStatus.COMPLETED)).thenReturn(2L);
        when(restoreRecordRepository.countByStatus(RestoreStatus.FAILED)).thenReturn(1L);
        when(restoreRecordRepository.countByStatus(RestoreStatus.IN_PROGRESS)).thenReturn(0L);

        assertThat(service.getRestoreSummary().get("totalRestores")).isEqualTo(3L);
    }

    @Test
    void restoreFromBackup_notCompleted_throws(@TempDir Path tmp) throws Exception {
        Path f = tmp.resolve("b.sql");
        Files.writeString(f, "x");
        BackupRecord b = BackupRecord.builder().status(BackupStatus.FAILED).storagePath(f.toString()).build();
        b.setId(1L);
        when(backupRecordRepository.findById(1L)).thenReturn(Optional.of(b));
        assertThatThrownBy(() -> service.restoreFromBackup(1L, RestoreType.FULL, null, null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void testRestore_createsRecord(@TempDir Path tmp) throws Exception {
        ReflectionTestUtils.setField(service, "storagePath", tmp.toString());
        Path f = tmp.resolve("dump.sql");
        Files.writeString(f, "select 1");
        BackupRecord b = BackupRecord.builder().status(BackupStatus.COMPLETED).storagePath(f.toString()).build();
        b.setId(5L);
        when(backupRecordRepository.findById(5L)).thenReturn(Optional.of(b));
        when(restoreRecordRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        RestoreRecord rec = service.testRestore(5L);
        assertThat(rec.getStatus()).isEqualTo(RestoreStatus.IN_PROGRESS);
    }
}
