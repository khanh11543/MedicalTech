package com.q2k.meditech.service;

import com.q2k.meditech.config.BackupProperties;
import com.q2k.meditech.entity.BackupRecord;
import com.q2k.meditech.entity.BackupSchedule;
import com.q2k.meditech.entity.MaintenanceWindow;
import com.q2k.meditech.entity.enums.BackupStatus;
import com.q2k.meditech.entity.enums.BackupType;
import com.q2k.meditech.entity.enums.MaintenanceStatus;
import com.q2k.meditech.repository.BackupRecordRepository;
import com.q2k.meditech.repository.BackupScheduleRepository;
import com.q2k.meditech.repository.MaintenanceWindowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BackupSchedulerServiceTest {

    @Mock
    private BackupService backupService;

    @Mock
    private BackupScheduleRepository scheduleRepository;

    @Mock
    private BackupRecordRepository backupRecordRepository;

    @Mock
    private MaintenanceWindowRepository maintenanceWindowRepository;

    private BackupProperties backupProperties;

    private BackupSchedulerService service;

    @BeforeEach
    void init() {
        backupProperties = new BackupProperties();
        service = new BackupSchedulerService(
                backupService,
                scheduleRepository,
                backupRecordRepository,
                maintenanceWindowRepository,
                backupProperties);
    }

    @Test
    void executeScheduledBackups_disabled_noop() {
        backupProperties.getSchedule().setEnabled(false);
        service.executeScheduledBackups();
        verifyNoInteractions(scheduleRepository);
    }

    @Test
    void executeScheduledBackups_runsDue() {
        backupProperties.getSchedule().setEnabled(true);
        BackupSchedule sch = BackupSchedule.builder()
                .name("Daily")
                .cronExpression("0 0 2 * * ?")
                .backupType(BackupType.FULL)
                .encrypted(false)
                .maxBackups(2)
                .build();
        sch.setId(1L);
        when(scheduleRepository.findByEnabledTrueAndNextRunAtBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(sch));
        BackupRecord record = BackupRecord.builder()
                .backupName("b")
                .backupType(BackupType.FULL)
                .build();
        record.setId(10L);
        when(backupService.runManualBackup(anyString(), any(), anyList(), any(), anyBoolean()))
                .thenReturn(record);
        when(scheduleRepository.save(any(BackupSchedule.class))).thenAnswer(i -> i.getArgument(0));
        when(backupRecordRepository.findByScheduleIdOrderByStartedAtDesc(1L)).thenReturn(List.of());
        service.executeScheduledBackups();
        verify(backupService).runManualBackup(anyString(), eq(BackupType.FULL), anyList(), any(), anyBoolean());
        verify(scheduleRepository).save(sch);
    }

    @Test
    void cleanupOldBackups_deletes() {
        BackupRecord old = BackupRecord.builder().backupName("old").build();
        old.setId(5L);
        when(backupRecordRepository.findByCompletedAtBeforeAndStatus(any(), eq(BackupStatus.COMPLETED)))
                .thenReturn(List.of(old));
        service.cleanupOldBackups();
        verify(backupService).deleteBackup(5L);
    }

    @Test
    void manageMaintainanceWindows() {
        MaintenanceWindow w1 = MaintenanceWindow.builder().title("A").build();
        w1.setId(1L);
        when(maintenanceWindowRepository.findReadyToActivate(any())).thenReturn(List.of(w1));
        MaintenanceWindow w2 = MaintenanceWindow.builder().title("B").build();
        w2.setId(2L);
        when(maintenanceWindowRepository.findExpiredActive(any())).thenReturn(List.of(w2));
        when(maintenanceWindowRepository.save(any(MaintenanceWindow.class))).thenAnswer(i -> i.getArgument(0));
        service.manageMaintainanceWindows();
        assertThat(w1.getStatus()).isEqualTo(MaintenanceStatus.ACTIVE);
        assertThat(w2.getStatus()).isEqualTo(MaintenanceStatus.COMPLETED);
    }
}
