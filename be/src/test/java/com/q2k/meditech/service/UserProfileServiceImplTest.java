package com.q2k.meditech.service;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.NotificationPreferenceDTO;
import com.q2k.meditech.dto.UserDTO;
import com.q2k.meditech.dto.security.ActivityLogDTO;
import com.q2k.meditech.dto.settings.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.ActivityType;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private DoctorRepository doctorRepository;
    @Mock private PatientRepository patientRepository;
    @Mock private NotificationPreferenceRepository notificationPreferenceRepository;
    @Mock private UserDisplaySettingRepository displaySettingRepository;
    @Mock private UserPrinterSettingRepository printerSettingRepository;
    @Mock private UserQuickActionRepository quickActionRepository;
    @Mock private UserWorkstationSettingRepository workstationSettingRepository;
    @Mock private UserPrivacySettingRepository privacySettingRepository;
    @Mock private ActivityLogRepository activityLogRepository;
    @Mock private ActivityLoggingService activityLoggingService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private FileStorageService fileStorageService;

    @InjectMocks
    private UserProfileServiceImpl service;

    private User userWithRoles(Long id) {
        Role r = Role.builder().name("PATIENT").build();
        r.setId(1L);
        User u = User.builder().email("a@a.a").fullName("N").isActive(true).isVerified(true).build();
        u.setId(id);
        UserRole ur = UserRole.builder().user(u).role(r).build();
        u.addRole(ur);
        return u;
    }

    @Test
    void getProfile() {
        User u = userWithRoles(1L);
        when(userRepository.findByIdWithRoles(1L)).thenReturn(Optional.of(u));
        UserDTO dto = service.getProfile(1L);
        assertThat(dto.getId()).isEqualTo(1L);
    }

    @Test
    void updateProfile() {
        User u = userWithRoles(1L);
        when(userRepository.findByIdWithRoles(1L)).thenReturn(Optional.of(u));
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        UpdateProfileDTO upd = new UpdateProfileDTO();
        upd.setFullName("New");

        UserDTO out = service.updateProfile(1L, upd);
        assertThat(out.getFullName()).isEqualTo("New");
        verify(activityLoggingService).log(eq(1L), eq(ActivityType.PROFILE_UPDATE), anyString(), anyString(), anyLong(), isNull(), isNull());
    }

    @Test
    void uploadAvatar() {
        User u = userWithRoles(1L);
        when(userRepository.findByIdWithRoles(1L)).thenReturn(Optional.of(u));
        when(fileStorageService.storeAvatar(eq(1L), any())).thenReturn("url");
        when(userRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        MultipartFile file = mock(MultipartFile.class);

        assertThat(service.uploadAvatar(1L, file).getAvatarUrl()).isEqualTo("url");
    }

    @Test
    void getDisplaySettings_createsDefault() {
        User u = userWithRoles(1L);
        when(displaySettingRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(displaySettingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.getDisplaySettings(1L).getLanguage()).isNotNull();
    }

    @Test
    void updateDisplaySettings() {
        UserDisplaySetting s = UserDisplaySetting.builder().user(userWithRoles(1L)).language("VI").build();
        when(displaySettingRepository.findByUserId(1L)).thenReturn(Optional.of(s));
        when(displaySettingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        UserDisplaySettingsDTO dto = UserDisplaySettingsDTO.builder().theme("dark").build();
        assertThat(service.updateDisplaySettings(1L, dto).getTheme()).isEqualTo("dark");
    }

    @Test
    void notificationPreferences_roundTrip() {
        NotificationPreference p = NotificationPreference.builder().user(userWithRoles(1L)).emailEnabled(true).build();
        when(notificationPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(p));
        when(notificationPreferenceRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        NotificationPreferenceDTO dto = new NotificationPreferenceDTO();
        dto.setSmsEnabled(false);
        assertThat(service.updateNotificationPreferences(1L, dto).getSmsEnabled()).isFalse();
    }

    @Test
    void getPrinterSettings_default() {
        User u = userWithRoles(1L);
        when(printerSettingRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(printerSettingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.getPrinterSettings(1L).getPaperSize()).isEqualTo("A4");
    }

    @Test
    void testPrint_noPrinter_throws() {
        when(printerSettingRepository.findByUserId(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.testPrint(1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void testPrint_success() {
        UserPrinterSetting s = UserPrinterSetting.builder().defaultPrinter("P1").build();
        when(printerSettingRepository.findByUserId(1L)).thenReturn(Optional.of(s));

        MessageDTO m = service.testPrint(1L);
        assertThat(m.getSuccess()).isTrue();
    }

    @Test
    void getQuickActions_empty_createsDefaults() {
        User u = userWithRoles(1L);
        when(quickActionRepository.findByUserIdOrderBySortOrderAsc(1L)).thenReturn(List.of());
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(quickActionRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.getQuickActions(1L)).isNotEmpty();
    }

    @Test
    void updateQuickActions() {
        User u = userWithRoles(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(quickActionRepository.saveAll(anyList())).thenReturn(List.of());

        UpdateQuickActionsDTO dto = new UpdateQuickActionsDTO();
        dto.setActions(List.of(UserQuickActionDTO.builder().actionKey("k").label("L").enabled(true).build()));
        assertThat(service.updateQuickActions(1L, dto)).isEmpty();
        verify(quickActionRepository).deleteByUserId(1L);
    }

    @Test
    void workstationSettings_update_invalidAutoLock_throws() {
        UserWorkstationSetting s = UserWorkstationSetting.builder().user(userWithRoles(1L)).build();
        when(workstationSettingRepository.findByUserId(1L)).thenReturn(Optional.of(s));

        UserWorkstationSettingsDTO dto = UserWorkstationSettingsDTO.builder().autoLockMinutes(99).build();
        assertThatThrownBy(() -> service.updateWorkstationSettings(1L, dto)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void setPin_mismatch_throws() {
        SetPinDTO dto = new SetPinDTO();
        dto.setPin("1");
        dto.setConfirmPin("2");
        assertThatThrownBy(() -> service.setPin(1L, dto)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void verifyPin_invalid() {
        UserWorkstationSetting s = UserWorkstationSetting.builder().pinHash("h").build();
        when(workstationSettingRepository.findByUserId(1L)).thenReturn(Optional.of(s));
        when(passwordEncoder.matches("x", "h")).thenReturn(false);

        assertThatThrownBy(() -> service.verifyPin(1L, VerifyPinDTO.builder().pin("x").build()))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void getPrivacySettings_default() {
        User u = userWithRoles(1L);
        when(privacySettingRepository.findByUserId(1L)).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(privacySettingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.getPrivacySettings(1L).getSessionTimeoutMinutes()).isNotNull();
    }

    @Test
    void clearCache() {
        assertThat(service.clearCache(1L).getSuccess()).isTrue();
    }

    @Test
    void clearSearchHistory() {
        assertThat(service.clearSearchHistory(1L).getSuccess()).isTrue();
    }

    @Test
    void getOwnActivityLog() {
        Pageable p = PageRequest.of(0, 10);
        when(activityLogRepository.findByUserIdOrderByCreatedAtDesc(1L, p)).thenReturn(Page.empty());

        Page<ActivityLogDTO> page = service.getOwnActivityLog(1L, p);
        assertThat(page.getContent()).isEmpty();
    }
}
