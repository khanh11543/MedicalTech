package com.q2k.meditech.service;

import com.q2k.meditech.entity.ActivityLog;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.ActivityType;
import com.q2k.meditech.repository.ActivityLogRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityLoggingServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ActivityLoggingService activityLoggingService;

    @Test
    void logByUserId_persistsEntry() {
        User ref = new User();
        ref.setId(5L);
        when(userRepository.getReferenceById(5L)).thenReturn(ref);

        activityLoggingService.log(5L, ActivityType.LOGIN, "desc", "R", 1L, "127.0.0.1", "agent");

        ArgumentCaptor<ActivityLog> cap = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository).save(cap.capture());
        assertEquals(ActivityType.LOGIN, cap.getValue().getActivityType());
    }

    @Test
    void logWithUser_delegatesToUserId() {
        User u = User.builder().build();
        u.setId(7L);
        when(userRepository.getReferenceById(7L)).thenReturn(u);
        activityLoggingService.log(u, ActivityType.LOGOUT, "out", "ip", "ua");
        verify(activityLogRepository).save(any(ActivityLog.class));
    }
}
