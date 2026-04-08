package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.Notification;
import com.q2k.meditech.entity.Role;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserRole;
import com.q2k.meditech.entity.enums.NotificationPriority;
import com.q2k.meditech.entity.enums.NotificationType;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.NotificationRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationWebSocketService webSocketService;

    @InjectMocks
    private NotificationService service;

    @Test
    void getNotifications_nullUser_throws() {
        assertThatThrownBy(() -> service.getNotifications(null, NotificationFilterDTO.builder().build()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getNotifications_defaultPage() {
        Page<Notification> page = new PageImpl<>(List.of());
        when(notificationRepository.findByUserIdAndArchivedAtIsNullOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(page);
        when(notificationRepository.countByUserIdAndIsReadAndArchivedAtIsNull(1L, false)).thenReturn(0L);
        for (NotificationType t : NotificationType.values()) {
            when(notificationRepository.countByUserIdAndIsReadAndTypeAndArchivedAtIsNull(eq(1L), eq(false), eq(t)))
                    .thenReturn(0L);
        }
        NotificationListResponse res = service.getNotifications(1L, NotificationFilterDTO.builder().build());
        assertThat(res.getNotifications()).isEmpty();
    }

    @Test
    void getUnreadCounts() {
        when(notificationRepository.countByUserIdAndIsReadAndArchivedAtIsNull(2L, false)).thenReturn(3L);
        for (NotificationType t : NotificationType.values()) {
            when(notificationRepository.countByUserIdAndIsReadAndTypeAndArchivedAtIsNull(eq(2L), eq(false), eq(t)))
                    .thenReturn(0L);
        }
        assertThat(service.getUnreadCounts(2L).getTotal()).isEqualTo(3L);
    }

    @Test
    void markAsRead() {
        User u = User.builder().build();
        u.setId(1L);
        Notification n = Notification.builder().user(u).isRead(false).build();
        n.setId(10L);
        when(notificationRepository.findById(10L)).thenReturn(Optional.of(n));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        service.markAsRead(10L, 1L);
        assertThat(n.getIsRead()).isTrue();
    }

    @Test
    void markAllAsRead() {
        when(notificationRepository.markAllAsReadByUserId(eq(1L), any())).thenReturn(4);
        assertThat(service.markAllAsRead(1L)).isEqualTo(4);
    }

    @Test
    void acknowledgeNotification_urgent() {
        User u = User.builder().build();
        u.setId(1L);
        Notification n = Notification.builder()
                .user(u)
                .priority(NotificationPriority.URGENT)
                .acknowledged(false)
                .isRead(false)
                .build();
        n.setId(3L);
        when(notificationRepository.findById(3L)).thenReturn(Optional.of(n));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));
        service.acknowledgeNotification(3L, 1L);
        assertThat(n.getAcknowledged()).isTrue();
    }

    @Test
    void createAndSend_pushesWebSocket() {
        User u = User.builder().email("e@e.com").build();
        u.setId(7L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(u));
        Notification saved = Notification.builder()
                .user(u)
                .title("t")
                .message("m")
                .type(NotificationType.SYSTEM)
                .build();
        saved.setId(99L);
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);
        CreateNotificationDTO dto = CreateNotificationDTO.builder()
                .userId(7L)
                .title("t")
                .message("m")
                .type(NotificationType.SYSTEM)
                .build();
        Notification out = service.createAndSend(dto);
        assertThat(out.getId()).isEqualTo(99L);
        verify(webSocketService).sendToUser(eq(7L), any());
    }

    @Test
    void archiveOldNotifications() {
        when(notificationRepository.archiveOldNotifications(any(), any())).thenReturn(2);
        assertThat(service.archiveOldNotifications()).isEqualTo(2);
    }

    @Test
    void listAllNotifications() {
        Pageable p = PageRequest.of(0, 5);
        when(notificationRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), eq(p)))
                .thenReturn(Page.empty(p));
        Page<NotificationDTO> page = service.listAllNotifications(null, null, null, null, p);
        assertThat(page.getContent()).isEmpty();
    }

    @Test
    void getNotificationStats() {
        when(notificationRepository.count()).thenReturn(10L);
        when(notificationRepository.count(any(org.springframework.data.jpa.domain.Specification.class)))
                .thenReturn(2L);
        NotificationStatsDTO stats = service.getNotificationStats();
        assertThat(stats.getTotalNotifications()).isEqualTo(10L);
    }

    @Test
    void createNotifications_admin() {
        User u = User.builder().build();
        u.setId(1L);
        when(userRepository.findAllById(List.of(1L))).thenReturn(List.of(u));
        when(notificationRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        CreateNotificationDTO dto = CreateNotificationDTO.builder()
                .userIds(List.of(1L))
                .title("t")
                .message("m")
                .type(NotificationType.SYSTEM)
                .build();
        assertThat(service.createNotifications(dto)).isEqualTo(1);
    }

    @Test
    void broadcastNotification_allUsers() {
        User u = User.builder().build();
        u.setId(1L);
        when(userRepository.findAll()).thenReturn(List.of(u));
        when(notificationRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        BroadcastNotificationDTO dto = new BroadcastNotificationDTO("t", "m", "SYSTEM", false, false, true, null);
        assertThat(service.broadcastNotification(dto, null)).isEqualTo(1);
    }

    @Test
    void broadcastNotification_byRole() {
        Role r = Role.builder().name("DOCTOR").build();
        UserRole ur = UserRole.builder().role(r).build();
        Set<UserRole> roles = new HashSet<>();
        roles.add(ur);
        User doc = User.builder().userRoles(roles).build();
        User other = User.builder().userRoles(new HashSet<>()).build();
        when(userRepository.findAll()).thenReturn(List.of(doc, other));
        when(notificationRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
        BroadcastNotificationDTO dto = new BroadcastNotificationDTO("t", "m", "SYSTEM", false, false, true, null);
        assertThat(service.broadcastNotification(dto, "doctor")).isEqualTo(1);
    }

    @Test
    void deleteNotification() {
        Notification n = Notification.builder().build();
        n.setId(5L);
        when(notificationRepository.findById(5L)).thenReturn(Optional.of(n));
        service.deleteNotification(5L);
        verify(notificationRepository).delete(n);
    }

    @Test
    void markAsRead_wrongUser_throws() {
        User u = User.builder().build();
        u.setId(2L);
        Notification n = Notification.builder().user(u).build();
        n.setId(1L);
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n));
        assertThatThrownBy(() -> service.markAsRead(1L, 9L)).isInstanceOf(IllegalArgumentException.class);
    }
}
