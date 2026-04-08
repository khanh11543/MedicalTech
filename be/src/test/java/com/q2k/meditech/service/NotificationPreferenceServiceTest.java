package com.q2k.meditech.service;

import com.q2k.meditech.dto.NotificationPreferenceDTO;
import com.q2k.meditech.entity.NotificationPreference;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.NotificationPreferenceRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationPreferenceServiceTest {

    @Mock
    private NotificationPreferenceRepository preferenceRepository;

    @Mock
    private UserRepository userRepository;

    private NotificationPreferenceService service;

    @BeforeEach
    void wire() {
        service = new NotificationPreferenceService();
        ReflectionTestUtils.setField(service, "preferenceRepository", preferenceRepository);
        ReflectionTestUtils.setField(service, "userRepository", userRepository);
    }

    @Test
    void getPreferences_nullUserId_throws() {
        assertThatThrownBy(() -> service.getPreferences(null)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getPreferences_existing() {
        User u = User.builder().build();
        u.setId(1L);
        NotificationPreference p = new NotificationPreference();
        p.setUser(u);
        p.setEmailEnabled(true);
        p.setId(10L);
        when(preferenceRepository.findByUserId(1L)).thenReturn(Optional.of(p));
        NotificationPreferenceDTO dto = service.getPreferences(1L);
        assertThat(dto.getUserId()).isEqualTo(1L);
        assertThat(dto.getEmailEnabled()).isTrue();
    }

    @Test
    void getPreferences_createsDefault() {
        User u = User.builder().email("e@e.com").build();
        u.setId(2L);
        when(preferenceRepository.findByUserId(2L)).thenReturn(Optional.empty());
        when(userRepository.findById(2L)).thenReturn(Optional.of(u));
        NotificationPreference saved = new NotificationPreference();
        saved.setUser(u);
        saved.setId(20L);
        when(preferenceRepository.save(any(NotificationPreference.class))).thenReturn(saved);
        service.getPreferences(2L);
        verify(preferenceRepository).save(any(NotificationPreference.class));
    }

    @Test
    void updatePreferences_updatesFields() {
        User u = User.builder().build();
        u.setId(3L);
        NotificationPreference p = new NotificationPreference();
        p.setUser(u);
        when(preferenceRepository.findByUserId(3L)).thenReturn(Optional.of(p));
        when(preferenceRepository.save(any(NotificationPreference.class))).thenAnswer(inv -> inv.getArgument(0));
        NotificationPreferenceDTO in = new NotificationPreferenceDTO();
        in.setEmailEnabled(false);
        in.setDesktopEnabled(true);
        NotificationPreferenceDTO out = service.updatePreferences(3L, in);
        assertThat(out.getEmailEnabled()).isFalse();
    }
}
