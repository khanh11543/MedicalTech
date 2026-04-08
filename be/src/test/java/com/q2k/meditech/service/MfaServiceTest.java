package com.q2k.meditech.service;

import com.q2k.meditech.dto.auth.MfaDisableRequestDTO;
import com.q2k.meditech.dto.auth.MfaEnableRequestDTO;
import com.q2k.meditech.entity.TwoFactorBackup;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.TwoFactorBackupRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.TotpUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MfaServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TwoFactorBackupRepository twoFactorBackupRepository;

    @InjectMocks
    private MfaService service;

    @Test
    void setupAuthenticator_generatesSecretWhenMissing() {
        ReflectionTestUtils.setField(service, "issuer", "TestIssuer");
        ReflectionTestUtils.setField(service, "totpWindowSteps", 1);
        User u = User.builder().email("a@b.com").build();
        u.setId(1L);
        u.setTwoFactorSecret(null);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        try (MockedStatic<TotpUtil> totp = mockStatic(TotpUtil.class)) {
            totp.when(() -> TotpUtil.generateBase32Secret(20)).thenReturn("SECRETKEYSECRETKEY");
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            var dto = service.setupAuthenticator(1L);
            assertThat(dto.getOtpauthUrl()).contains("SECRETKEYSECRETKEY");
            assertThat(dto.getIssuer()).isEqualTo("TestIssuer");
        }
    }

    @Test
    void enableAuthenticator_success() {
        ReflectionTestUtils.setField(service, "totpWindowSteps", 5);
        User u = User.builder().email("a@b.com").build();
        u.setId(1L);
        u.setTwoFactorSecret("SECRET");
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        try (MockedStatic<TotpUtil> totp = mockStatic(TotpUtil.class)) {
            totp.when(() -> TotpUtil.verifyTotpCode(eq("SECRET"), eq("123456"), eq(5))).thenReturn(true);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
            when(twoFactorBackupRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));
            var res = service.enableAuthenticator(1L, MfaEnableRequestDTO.builder().code("123456").build());
            assertThat(res.isTwoFactorEnabled()).isTrue();
            assertThat(res.getBackupCodes()).hasSize(10);
        }
        verify(twoFactorBackupRepository).deleteByUser(u);
    }

    @Test
    void enableAuthenticator_invalidCode_throws() {
        ReflectionTestUtils.setField(service, "totpWindowSteps", 1);
        User u = User.builder().build();
        u.setTwoFactorSecret("S");
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        try (MockedStatic<TotpUtil> totp = mockStatic(TotpUtil.class)) {
            totp.when(() -> TotpUtil.verifyTotpCode(anyString(), anyString(), anyInt())).thenReturn(false);
            assertThatThrownBy(() -> service.enableAuthenticator(1L, MfaEnableRequestDTO.builder().code("000000").build()))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    @Test
    void disableAuthenticator_idempotentWhenAlreadyOff() {
        ReflectionTestUtils.setField(service, "totpWindowSteps", 1);
        User u = User.builder().build();
        u.setTwoFactorEnabled(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        service.disableAuthenticator(1L, MfaDisableRequestDTO.builder().code("123456").build());
        verify(twoFactorBackupRepository).deleteByUser(u);
    }

    @Test
    void verifyAuthenticatorCode_mfaOff_returnsTrue() {
        User u = User.builder().twoFactorEnabled(false).build();
        assertThat(service.verifyAuthenticatorCode(u, "x")).isTrue();
    }

    @Test
    void tryUseBackupCode_success() {
        User u = User.builder().build();
        u.setId(5L);
        User owner = User.builder().build();
        owner.setId(5L);
        TwoFactorBackup b = TwoFactorBackup.builder().user(owner).build();
        when(twoFactorBackupRepository.findUnusedBackupCodeByHash(anyString())).thenReturn(Optional.of(b));
        when(twoFactorBackupRepository.save(any(TwoFactorBackup.class))).thenAnswer(inv -> inv.getArgument(0));
        assertThat(service.tryUseBackupCode(u, "ABCDEFGHJK", "127.0.0.1")).isTrue();
    }

    @Test
    void setupAuthenticator_userMissing_throws() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.setupAuthenticator(99L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
