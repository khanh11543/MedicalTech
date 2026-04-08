package com.q2k.meditech.service;

import com.q2k.meditech.entity.MedicationInventoryLog;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.MedicationInventoryLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryAuditLogServiceImplTest {

    @Mock MedicationInventoryLogRepository logRepository;

    @InjectMocks InventoryAuditLogServiceImpl service;

    @Test
    void getAuditLogs_page() {
        when(logRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(service.getAuditLogs(null, null, null, null, null, null, null, 0, 10, "changedAt", "DESC")
                .getContent()).isEmpty();
    }

    @Test
    void getAuditLogDetail_notFound() {
        when(logRepository.findById(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getAuditLogDetail(9L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getAuditStats_builds() {
        when(logRepository.count()).thenReturn(0L);
        when(logRepository.countSince(any())).thenReturn(0L);
        when(logRepository.countByTypeSince(any())).thenReturn(List.<Object[]>of());
        when(logRepository.findDistinctTypes()).thenReturn(List.of());
        when(logRepository.findDistinctReferenceTypes()).thenReturn(List.of());
        assertThat(service.getAuditStats().getTotalLogs()).isZero();
    }
}
