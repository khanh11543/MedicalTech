package com.q2k.meditech.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.ServiceOrderAuditLogFilterDTO;
import com.q2k.meditech.entity.ServiceOrderAuditLog;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.ServiceOrderAuditLogRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.context.request.RequestContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ServiceOrderAuditLogServiceTest {

    @Mock ServiceOrderAuditLogRepository repository;
    @Mock UserRepository userRepository;
    @Mock ObjectMapper objectMapper;

    @InjectMocks ServiceOrderAuditLogService service;

    @Test
    void event_builder() {
        var req = ServiceOrderAuditLogService.event("TYPE").summary("s").appointment(1L);
        assertThat(req).isNotNull();
    }

    @Test
    void logEvent_withSecurityUser_saves() {
        try (MockedStatic<SecurityUtil> su = mockStatic(SecurityUtil.class);
             MockedStatic<RequestContextHolder> rh = mockStatic(RequestContextHolder.class)) {
            su.when(SecurityUtil::getCurrentUserId).thenReturn(5L);
            rh.when(RequestContextHolder::getRequestAttributes).thenReturn(null);
            User actor = User.builder().email("a@b.c").fullName("A").build();
            actor.setId(5L);
            when(userRepository.findById(5L)).thenReturn(Optional.of(actor));

            service.logEvent(ServiceOrderAuditLogService.event("E").summary("x"));

            verify(repository).save(any(ServiceOrderAuditLog.class));
        }
    }

    @Test
    void getAuditLogs_page() {
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(service.getAuditLogs(ServiceOrderAuditLogFilterDTO.builder().build()).getContent()).isEmpty();
    }

    @Test
    void getDetail_notFound() {
        when(repository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getDetail(1L)).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void getTimeline_maps() {
        when(repository.findByAppointmentIdOrderByCreatedAtAsc(2L)).thenReturn(List.of());
        assertThat(service.getTimeline(2L)).isEmpty();
    }

    @Test
    void getEventTypes_delegates() {
        when(repository.findDistinctEventTypes()).thenReturn(List.of("A"));
        assertThat(service.getEventTypes()).containsExactly("A");
    }
}
