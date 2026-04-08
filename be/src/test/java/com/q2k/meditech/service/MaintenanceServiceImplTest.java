package com.q2k.meditech.service;

import com.q2k.meditech.entity.MaintenanceWindow;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.MaintenanceStatus;
import com.q2k.meditech.entity.enums.MaintenanceType;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.MaintenanceWindowRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.SecurityUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MaintenanceServiceImplTest {

    @Mock
    private MaintenanceWindowRepository maintenanceWindowRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MaintenanceServiceImpl service;

    @Test
    void getMaintenanceDashboard() {
        when(maintenanceWindowRepository.existsByStatus(MaintenanceStatus.ACTIVE)).thenReturn(false);
        when(maintenanceWindowRepository.findByStatus(MaintenanceStatus.ACTIVE)).thenReturn(List.of());
        when(maintenanceWindowRepository.findUpcoming(any())).thenReturn(List.of());
        when(maintenanceWindowRepository.findByStatus(MaintenanceStatus.SCHEDULED)).thenReturn(List.of());
        when(maintenanceWindowRepository.findByStatus(MaintenanceStatus.COMPLETED)).thenReturn(List.of());
        when(maintenanceWindowRepository.findByStatus(MaintenanceStatus.CANCELLED)).thenReturn(List.of());
        Map<String, Object> dash = service.getMaintenanceDashboard();
        assertThat(dash).containsKey("isActive");
    }

    @Test
    void scheduleMaintenance_success() {
        try (var sec = mockStatic(SecurityUtil.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(null);
            LocalDateTime start = LocalDateTime.now().plusHours(1);
            LocalDateTime end = start.plusHours(2);
            MaintenanceWindow mw = MaintenanceWindow.builder()
                    .title("T")
                    .startTime(start)
                    .endTime(end)
                    .build();
            when(maintenanceWindowRepository.save(any(MaintenanceWindow.class))).thenAnswer(inv -> inv.getArgument(0));
            MaintenanceWindow saved = service.scheduleMaintenance(mw);
            assertThat(saved.getStatus()).isEqualTo(MaintenanceStatus.SCHEDULED);
        }
    }

    @Test
    void scheduleMaintenance_invalidTimes_throws() {
        LocalDateTime now = LocalDateTime.now();
        MaintenanceWindow mw = MaintenanceWindow.builder()
                .startTime(now.plusHours(2))
                .endTime(now.plusHours(1))
                .build();
        assertThatThrownBy(() -> service.scheduleMaintenance(mw)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void activateMaintenanceNow() {
        try (var sec = mockStatic(SecurityUtil.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(null);
            when(maintenanceWindowRepository.existsByStatus(MaintenanceStatus.ACTIVE)).thenReturn(false);
            when(maintenanceWindowRepository.save(any(MaintenanceWindow.class))).thenAnswer(inv -> inv.getArgument(0));
            MaintenanceWindow w = service.activateMaintenanceNow("msg", 30, List.of("1.1.1.1"));
            assertThat(w.getStatus()).isEqualTo(MaintenanceStatus.ACTIVE);
        }
    }

    @Test
    void activateMaintenanceNow_alreadyActive_throws() {
        when(maintenanceWindowRepository.existsByStatus(MaintenanceStatus.ACTIVE)).thenReturn(true);
        assertThatThrownBy(() -> service.activateMaintenanceNow("m", 1, null))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void deactivateMaintenance() {
        MaintenanceWindow w = MaintenanceWindow.builder().status(MaintenanceStatus.ACTIVE).build();
        w.setId(1L);
        when(maintenanceWindowRepository.findById(1L)).thenReturn(Optional.of(w));
        when(maintenanceWindowRepository.save(any(MaintenanceWindow.class))).thenAnswer(inv -> inv.getArgument(0));
        MaintenanceWindow out = service.deactivateMaintenance(1L);
        assertThat(out.getStatus()).isEqualTo(MaintenanceStatus.COMPLETED);
    }

    @Test
    void updateMaintenance() {
        MaintenanceWindow existing = MaintenanceWindow.builder()
                .status(MaintenanceStatus.SCHEDULED)
                .title("Old")
                .build();
        existing.setId(2L);
        when(maintenanceWindowRepository.findById(2L)).thenReturn(Optional.of(existing));
        when(maintenanceWindowRepository.save(any(MaintenanceWindow.class))).thenAnswer(inv -> inv.getArgument(0));
        MaintenanceWindow patch = MaintenanceWindow.builder().title("New").build();
        assertThat(service.updateMaintenance(2L, patch).getTitle()).isEqualTo("New");
    }

    @Test
    void cancelMaintenance() {
        MaintenanceWindow w = MaintenanceWindow.builder().status(MaintenanceStatus.SCHEDULED).build();
        w.setId(3L);
        when(maintenanceWindowRepository.findById(3L)).thenReturn(Optional.of(w));
        service.cancelMaintenance(3L);
        verify(maintenanceWindowRepository).save(w);
        assertThat(w.getStatus()).isEqualTo(MaintenanceStatus.CANCELLED);
    }

    @Test
    void getMaintenanceHistory() {
        Page<MaintenanceWindow> p = new PageImpl<>(List.of());
        when(maintenanceWindowRepository.findHistory(PageRequest.of(0, 5))).thenReturn(p);
        assertThat(service.getMaintenanceHistory(PageRequest.of(0, 5))).isSameAs(p);
    }

    @Test
    void isMaintenanceActive_getActive_getUpcoming_getDetail() {
        when(maintenanceWindowRepository.existsByStatus(MaintenanceStatus.ACTIVE)).thenReturn(true);
        assertThat(service.isMaintenanceActive()).isTrue();
        MaintenanceWindow a = MaintenanceWindow.builder().build();
        when(maintenanceWindowRepository.findByStatus(MaintenanceStatus.ACTIVE)).thenReturn(List.of(a));
        assertThat(service.getActiveMaintenance()).isSameAs(a);
        when(maintenanceWindowRepository.findUpcoming(any())).thenReturn(List.of());
        assertThat(service.getUpcomingMaintenance()).isEmpty();
        MaintenanceWindow d = MaintenanceWindow.builder().build();
        d.setId(9L);
        when(maintenanceWindowRepository.findById(9L)).thenReturn(Optional.of(d));
        assertThat(service.getMaintenanceDetail(9L)).isSameAs(d);
    }

    @Test
    void getMaintenanceDetail_missing_throws() {
        when(maintenanceWindowRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getMaintenanceDetail(99L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
