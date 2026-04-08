package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.ActivityLogFilterDTO;
import com.q2k.meditech.dto.security.ActivityLogStatsDTO;
import com.q2k.meditech.entity.ActivityLog;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.ActivityLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityLogServiceImplTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @InjectMocks
    private ActivityLogServiceImpl activityLogService;

    @Test
    void getActivityLogs_returnsPage() {
        when(activityLogRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(new ActivityLog())));
        assertNotNull(activityLogService.getActivityLogs(ActivityLogFilterDTO.builder().build()));
    }

    @Test
    void getActivityLogById_notFound_throws() {
        when(activityLogRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> activityLogService.getActivityLogById(1L));
    }

    @Test
    void getActivityLogStats_returnsDto() {
        when(activityLogRepository.countSince(any())).thenReturn(0L);
        when(activityLogRepository.countByActivityType(any(), any())).thenReturn(List.of());
        when(activityLogRepository.findMostActiveUsers(any(), any(), any())).thenReturn(List.of());
        ActivityLogStatsDTO stats = activityLogService.getActivityLogStats("7d");
        assertNotNull(stats);
    }
}
