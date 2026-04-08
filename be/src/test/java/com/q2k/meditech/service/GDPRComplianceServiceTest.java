package com.q2k.meditech.service;

import com.q2k.meditech.dto.DataProcessingActivityDTO;
import com.q2k.meditech.entity.DataProcessingActivity;
import com.q2k.meditech.entity.DataRequest;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserConsent;
import com.q2k.meditech.entity.enums.ConsentStatus;
import com.q2k.meditech.entity.enums.ConsentType;
import com.q2k.meditech.repository.DataProcessingActivityRepository;
import com.q2k.meditech.repository.DataRequestRepository;
import com.q2k.meditech.repository.UserConsentRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GDPRComplianceServiceTest {

    @Mock
    private DataRequestRepository dataRequestRepository;

    @Mock
    private UserConsentRepository userConsentRepository;

    @Mock
    private DataProcessingActivityRepository dataProcessingActivityRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GDPRComplianceService service;

    @Test
    void getDashboardStatistics() {
        when(dataRequestRepository.count()).thenReturn(1L);
        when(dataRequestRepository.countByStatus("PENDING")).thenReturn(0L);
        when(dataRequestRepository.countByStatus("COMPLETED")).thenReturn(1L);
        when(dataRequestRepository.countOverdueRequests(any())).thenReturn(0L);
        when(userConsentRepository.count()).thenReturn(1L);
        when(userConsentRepository.countByStatus(ConsentStatus.ACCEPTED)).thenReturn(1L);
        when(userConsentRepository.countByStatus(ConsentStatus.REVOKED)).thenReturn(0L);
        when(dataProcessingActivityRepository.count()).thenReturn(1L);
        when(dataProcessingActivityRepository.findByIsActiveOrderByCreatedAtDesc(true)).thenReturn(List.of());
        when(dataRequestRepository.findAll(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(userConsentRepository.findAll(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        when(dataRequestRepository.findByRequestTypeOrderByCreatedAtDesc(anyString())).thenReturn(List.of());
        when(dataProcessingActivityRepository.findAll(any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of());

        assertThat(service.getDashboardStatistics().getTotalDataRequests()).isEqualTo(1L);
    }

    @Test
    void getAllDataRequests_getById_create_update() {
        User u = User.builder().email("e@e.com").fullName("N").build();
        u.setId(1L);
        DataRequest dr = DataRequest.builder().user(u).requestType("DATA_EXPORT").status("PENDING").build();
        dr.setId(10L);
        when(dataRequestRepository.findAll(any(org.springframework.data.domain.Sort.class))).thenReturn(List.of(dr));
        assertThat(service.getAllDataRequests()).hasSize(1);

        when(dataRequestRepository.findById(10L)).thenReturn(Optional.of(dr));
        assertThat(service.getDataRequestById(10L).getId()).isEqualTo(10L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(dataRequestRepository.save(any(DataRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        assertThat(service.createDataRequest(1L, "DATA_EXPORT", "r", "127.0.0.1").getRequestType())
                .isEqualTo("DATA_EXPORT");

        when(dataRequestRepository.findById(10L)).thenReturn(Optional.of(dr));
        when(dataRequestRepository.save(any(DataRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        service.updateDataRequestStatus(10L, "COMPLETED", "ok", null);
        assertThat(dr.getStatus()).isEqualTo("COMPLETED");
    }

    @Test
    void consentAndProcessingActivities() {
        User u = User.builder().email("e@e.com").fullName("N").build();
        u.setId(2L);
        when(userConsentRepository.findAll(any(org.springframework.data.domain.Sort.class))).thenReturn(List.of());
        assertThat(service.getAllUserConsents()).isEmpty();

        UserConsent c = UserConsent.builder().user(u).consentType(ConsentType.TERMS_OF_SERVICE).build();
        when(userConsentRepository.findByUserIdOrderByConsentDateDesc(2L)).thenReturn(List.of(c));
        assertThat(service.getUserConsentsByUserId(2L)).hasSize(1);

        when(userRepository.findById(2L)).thenReturn(Optional.of(u));
        when(userConsentRepository.findByUserIdAndConsentType(2L, ConsentType.MARKETING_COMMUNICATIONS))
                .thenReturn(Optional.empty());
        when(userConsentRepository.save(any(UserConsent.class))).thenAnswer(inv -> inv.getArgument(0));
        service.updateUserConsent(2L, ConsentType.MARKETING_COMMUNICATIONS, true, "ip", "ua");

        when(dataProcessingActivityRepository.findAll(any(org.springframework.data.domain.Sort.class)))
                .thenReturn(List.of());
        assertThat(service.getAllProcessingActivities()).isEmpty();
        when(dataProcessingActivityRepository.findByIsActiveOrderByCreatedAtDesc(true)).thenReturn(List.of());
        assertThat(service.getActiveProcessingActivities()).isEmpty();

        DataProcessingActivityDTO dto = DataProcessingActivityDTO.builder()
                .activityName("A")
                .purpose("P")
                .legalBasis("L")
                .build();
        DataProcessingActivity saved = DataProcessingActivity.builder().activityName("A").build();
        saved.setId(5L);
        when(dataProcessingActivityRepository.save(any(DataProcessingActivity.class))).thenReturn(saved);
        assertThat(service.createProcessingActivity(dto).getId()).isEqualTo(5L);

        when(dataProcessingActivityRepository.findById(5L)).thenReturn(Optional.of(saved));
        when(dataProcessingActivityRepository.save(any(DataProcessingActivity.class))).thenAnswer(inv -> inv.getArgument(0));
        service.updateProcessingActivity(5L, dto);
        verify(dataProcessingActivityRepository).save(saved);
    }
}
