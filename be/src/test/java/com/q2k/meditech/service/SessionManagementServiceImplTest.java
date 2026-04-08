package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.LoginAttempt;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserSession;
import com.q2k.meditech.entity.enums.SessionStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.LoginAttemptRepository;
import com.q2k.meditech.repository.UserSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionManagementServiceImplTest {

    @Mock private UserSessionRepository userSessionRepository;
    @Mock private LoginAttemptRepository loginAttemptRepository;

    @InjectMocks
    private SessionManagementServiceImpl service;

    private UserSession session() {
        User u = User.builder().fullName("U").email("a@a.a").build();
        u.setId(2L);
        return UserSession.builder()
                .id(1L).user(u)
                .status(SessionStatus.ACTIVE).build();
    }

    @Test
    void getSessions_byUserId() {
        Pageable p = PageRequest.of(0, 5);
        when(userSessionRepository.findByUserIdOrderByLastSeenAtDesc(2L, p))
                .thenReturn(new PageImpl<>(List.of(session())));

        SessionFilterDTO f = SessionFilterDTO.builder().userId(2L).pageNumber(0).pageSize(5).build();
        assertThat(service.getSessions(f).getContent()).hasSize(1);
    }

    @Test
    void getSessionById() {
        when(userSessionRepository.findById(1L)).thenReturn(Optional.of(session()));
        assertThat(service.getSessionById(1L).getId()).isEqualTo(1L);
    }

    @Test
    void getSessionById_missing_throws() {
        when(userSessionRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getSessionById(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void forceLogout_noCriteria_throws() {
        assertThatThrownBy(() -> service.forceLogout(new ForceLogoutDTO(), 1L))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void forceLogout_bySessionIds() {
        UserSession s = session();
        when(userSessionRepository.findById(1L)).thenReturn(Optional.of(s));
        when(userSessionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        ForceLogoutDTO dto = new ForceLogoutDTO();
        dto.setSessionIds(List.of(1L));
        dto.setReason("admin");
        assertThat(service.forceLogout(dto, 9L)).isEqualTo(1);
    }

    @Test
    void getSessionStats() {
        when(userSessionRepository.countTotalActiveSessions(any())).thenReturn(1L);
        when(userSessionRepository.countIdleSessions(any())).thenReturn(0L);
        when(userSessionRepository.countByStatusSince(any(), any())).thenReturn(0L);
        when(userSessionRepository.countActiveByDeviceType(any())).thenReturn(List.of());
        when(userSessionRepository.countActiveByBrowser(any())).thenReturn(List.of());
        when(userSessionRepository.countActiveByCountry(any())).thenReturn(List.of());
        when(userSessionRepository.countSessionsByDateGrouped(any(), any())).thenReturn(List.of());

        assertThat(service.getSessionStats().getTotalActiveSessions()).isEqualTo(1L);
    }

    @Test
    void getLoginAttempts() {
        Pageable p = PageRequest.of(0, 5);
        User lu = User.builder().build();
        lu.setId(1L);
        LoginAttempt a = LoginAttempt.builder().user(lu).success(true).email("e@e.com").ipAddress("127.0.0.1")
                .attemptedAt(LocalDateTime.now()).build();
        a.setId(1L);
        when(loginAttemptRepository.findByUserIdOrderByAttemptedAtDesc(1L, p)).thenReturn(new PageImpl<>(List.of(a)));

        assertThat(service.getLoginAttempts(1L, 0, 5).getContent()).hasSize(1);
    }

    @Test
    void getLoginAttemptStats() {
        when(loginAttemptRepository.countBySuccessBetween(anyBoolean(), any(), any())).thenReturn(1L);
        when(loginAttemptRepository.countDistinctIpBySuccessBetween(anyBoolean(), any(), any())).thenReturn(1L);
        when(loginAttemptRepository.countByDateGrouped(any(), any())).thenReturn(List.of());
        when(loginAttemptRepository.failedAttemptsByHourGrouped(any(), any())).thenReturn(List.of());
        when(loginAttemptRepository.findTopFailedIps(any(), any())).thenReturn(List.of());
        when(loginAttemptRepository.countByCountryGrouped(any(), any())).thenReturn(List.of());

        assertThat(service.getLoginAttemptStats("7d").getTotalAttempts()).isEqualTo(2L);
    }
}
