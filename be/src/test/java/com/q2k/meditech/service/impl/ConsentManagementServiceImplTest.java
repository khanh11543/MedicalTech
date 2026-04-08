package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.UserConsentMapper;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserConsent;
import com.q2k.meditech.entity.enums.ConsentStatus;
import com.q2k.meditech.entity.enums.ConsentType;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.UserConsentRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.service.EmailService;
import com.q2k.meditech.util.SecurityUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConsentManagementServiceImplTest {

    @Mock private UserConsentRepository consentRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserConsentMapper mapper;
    @Mock private EmailService emailService;

    @InjectMocks
    private ConsentManagementServiceImpl service;

    private MockedStatic<SecurityUtil> securityUtil;

    @AfterEach
    void tearDown() {
        if (securityUtil != null) {
            securityUtil.close();
        }
    }

    @Test
    void getConsentStatistics_buildsDto() {
        when(consentRepository.count()).thenReturn(10L);
        when(consentRepository.countByStatus(ConsentStatus.ACCEPTED)).thenReturn(8L);
        when(consentRepository.countByStatus(ConsentStatus.DECLINED)).thenReturn(1L);
        when(consentRepository.countByStatus(ConsentStatus.REVOKED)).thenReturn(1L);
        when(consentRepository.countDistinctUsers()).thenReturn(5L);
        when(consentRepository.countRecentConsents(any())).thenReturn(2L);
        when(consentRepository.countRecentRevocations(any())).thenReturn(1L);
        List<Object[]> byType = new ArrayList<>();
        byType.add(new Object[]{"TOS", 3L});
        when(consentRepository.countActiveConsentsByType()).thenReturn(byType);
        when(consentRepository.findUsersWithFullConsent(anyLong())).thenReturn(List.of(1L, 2L));

        LocalDate from = LocalDate.now().minusDays(7);
        ConsentStatsDTO stats = service.getConsentStatistics(from, LocalDate.now());
        assertThat(stats.getTotalConsents()).isEqualTo(10L);
        assertThat(stats.getAcceptedCount()).isEqualTo(8L);
    }

    @Test
    void getConsentRecords_mapsPage() {
        UserConsent c = UserConsent.builder()
                .consentType(ConsentType.PRIVACY_POLICY).consentDate(LocalDateTime.now()).build();
        c.setId(1L);
        UserConsentDTO dto = UserConsentDTO.builder().id(1L).build();
        when(consentRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(c)));
        when(mapper.toDTO(c)).thenReturn(dto);

        Page<UserConsentDTO> page = service.getConsentRecords(ConsentFilterDTO.builder().build());
        assertThat(page.getContent()).containsExactly(dto);
    }

    @Test
    void getUserConsentDetail_userMissing_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getUserConsentDetail(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getUserConsentDetail_emptyConsents() {
        User user = User.builder().fullName("A").email("a@a.a").build();
        user.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(consentRepository.findByUserIdWithUser(1L)).thenReturn(List.of());

        UserConsentDetailDTO d = service.getUserConsentDetail(1L);
        assertThat(d.getUserId()).isEqualTo(1L);
        assertThat(d.getTotalConsents()).isZero();
    }

    @Test
    void revokeConsent_notAccepted_throws() {
        UserConsent c = UserConsent.builder()
                .consentType(ConsentType.PRIVACY_POLICY).consentDate(LocalDateTime.now())
                .status(ConsentStatus.DECLINED).build();
        c.setId(1L);
        when(consentRepository.findByIdWithUser(1L)).thenReturn(Optional.of(c));
        assertThatThrownBy(() -> service.revokeConsent(1L, RevokeConsentDTO.builder().sendNotification(false).build()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void revokeConsent_success() {
        securityUtil = mockStatic(SecurityUtil.class);
        securityUtil.when(SecurityUtil::getCurrentUserId).thenReturn(9L);
        User u = User.builder().email("e@e.e").fullName("N").build();
        u.setId(2L);
        UserConsent c = UserConsent.builder()
                .consentType(ConsentType.PRIVACY_POLICY).consentDate(LocalDateTime.now())
                .status(ConsentStatus.ACCEPTED).user(u).build();
        c.setId(1L);
        when(consentRepository.findByIdWithUser(1L)).thenReturn(Optional.of(c));
        when(consentRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(mapper.toDTO(any())).thenReturn(UserConsentDTO.builder().id(1L).build());

        service.revokeConsent(1L, RevokeConsentDTO.builder().sendNotification(false).build());
        verify(consentRepository).save(argThat(x -> x.getStatus() == ConsentStatus.REVOKED));
    }

    @Test
    void exportConsentRecords_csv() {
        when(consentRepository.findAll(any(Specification.class), any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of());

        byte[] bytes = service.exportConsentRecords(null, null, null, null, "csv");
        assertThat(bytes.length).isGreaterThan(0);
    }

    @Test
    void getExportFileName() {
        assertThat(service.getExportFileName("excel")).endsWith(".xlsx");
        assertThat(service.getExportFileName("CSV")).endsWith(".csv");
    }

    @Test
    void getConsentTrends_groups() {
        LocalDate from = LocalDate.now().minusDays(2);
        LocalDate to = LocalDate.now();
        UserConsent c = UserConsent.builder()
                .consentType(ConsentType.PRIVACY_POLICY)
                .consentDate(LocalDateTime.now())
                .status(ConsentStatus.ACCEPTED)
                .build();
        when(consentRepository.findByConsentDateBetween(any(), any())).thenReturn(List.of(c));

        ConsentTrendsDTO trends = service.getConsentTrends(from, to, "DAY", null);
        assertThat(trends.getDataPoints()).isNotEmpty();
    }
}
