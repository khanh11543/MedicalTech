package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.SecurityEventDTO;
import com.q2k.meditech.dto.security.SecurityEventFilterDTO;
import com.q2k.meditech.dto.security.SecurityEventStatsDTO;
import com.q2k.meditech.entity.SecurityEvent;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.SecurityEventStatus;
import com.q2k.meditech.entity.enums.SecurityEventType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.SecurityEventRepository;
import com.q2k.meditech.repository.UserRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecurityEventServiceImplTest {

    @Mock private SecurityEventRepository securityEventRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private SecurityEventServiceImpl service;

    private SecurityEvent eventNew() {
        return SecurityEvent.builder()
                .id(1L).status(SecurityEventStatus.NEW).eventType(SecurityEventType.FAILED_LOGIN)
                .severity(SecuritySeverity.LOW).description("d").build();
    }

    @Test
    void getSecurityEvents() {
        when(securityEventRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(eventNew())));

        Page<SecurityEventDTO> p = service.getSecurityEvents(SecurityEventFilterDTO.builder().build());
        assertThat(p.getContent()).hasSize(1);
    }

    @Test
    void getSecurityEventById() {
        when(securityEventRepository.findById(1L)).thenReturn(Optional.of(eventNew()));
        assertThat(service.getSecurityEventById(1L).getId()).isEqualTo(1L);
    }

    @Test
    void getSecurityEventById_missing_throws() {
        when(securityEventRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getSecurityEventById(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void reviewSecurityEvent_wrongStatus_throws() {
        SecurityEvent e = eventNew();
        e.setStatus(SecurityEventStatus.REVIEWED);
        when(securityEventRepository.findById(1L)).thenReturn(Optional.of(e));
        assertThatThrownBy(() -> service.reviewSecurityEvent(1L, 9L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void reviewSecurityEvent_success() {
        when(securityEventRepository.findById(1L)).thenReturn(Optional.of(eventNew()));
        when(securityEventRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.reviewSecurityEvent(1L, 9L).getStatus()).isEqualTo(SecurityEventStatus.REVIEWED);
    }

    @Test
    void resolveSecurityEvent_alreadyResolved_throws() {
        SecurityEvent e = eventNew();
        e.setStatus(SecurityEventStatus.RESOLVED);
        when(securityEventRepository.findById(1L)).thenReturn(Optional.of(e));
        assertThatThrownBy(() -> service.resolveSecurityEvent(1L, 2L, "n")).isInstanceOf(BadRequestException.class);
    }

    @Test
    void resolveSecurityEvent_success() {
        User resolver = User.builder().fullName("A").build();
        resolver.setId(2L);
        when(securityEventRepository.findById(1L)).thenReturn(Optional.of(eventNew()));
        when(userRepository.findById(2L)).thenReturn(Optional.of(resolver));
        when(securityEventRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.resolveSecurityEvent(1L, 2L, "fixed").getStatus()).isEqualTo(SecurityEventStatus.RESOLVED);
    }

    @Test
    void getSecurityEventStats() {
        when(securityEventRepository.countSince(any())).thenReturn(1L);
        when(securityEventRepository.countBySeverityAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(securityEventRepository.countByStatusAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(securityEventRepository.countByEventTypeGrouped(any(), any())).thenReturn(List.of());
        when(securityEventRepository.countBySeverityGrouped(any())).thenReturn(List.of());
        when(securityEventRepository.countByDateGrouped(any(), any())).thenReturn(List.of());

        SecurityEventStatsDTO s = service.getSecurityEventStats("7d");
        assertThat(s.getTotalEvents()).isEqualTo(1L);
    }
}
