package com.q2k.meditech.service;

import com.q2k.meditech.entity.UserWorkstationSetting;
import com.q2k.meditech.repository.UserWorkstationSettingRepository;
import com.q2k.meditech.util.SecurityUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.mockStatic;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PrivacyMaskingServiceTest {

    @Mock
    private UserWorkstationSettingRepository workstationSettingRepository;

    @InjectMocks
    private PrivacyMaskingService service;

    @Test
    void maskPhone_null_returnsNull() {
        assertThat(service.maskPhone(null)).isNull();
    }

    @Test
    void maskEmail_null_returnsNull() {
        assertThat(service.maskEmail(null)).isNull();
    }

    @Test
    void maskPhone_userNull_masks() {
        try (var sec = mockStatic(SecurityUtil.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(null);
            assertThat(service.maskPhone("0901234567")).isEqualTo("***4567");
        }
    }

    @Test
    void maskPhone_hideOff_returnsFull() {
        try (var sec = mockStatic(SecurityUtil.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(1L);
            UserWorkstationSetting s = new UserWorkstationSetting();
            s.setHidePhoneNumber(false);
            when(workstationSettingRepository.findByUserId(1L)).thenReturn(Optional.of(s));
            assertThat(service.maskPhone("0901234567")).isEqualTo("0901234567");
        }
    }

    @Test
    void maskEmail_hideOn_masks() {
        try (var sec = mockStatic(SecurityUtil.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(2L);
            UserWorkstationSetting s = new UserWorkstationSetting();
            s.setHideEmail(true);
            when(workstationSettingRepository.findByUserId(2L)).thenReturn(Optional.of(s));
            assertThat(service.maskEmail("ab@example.com")).isEqualTo("a***@example.com");
        }
    }

    @Test
    void alwaysMaskPhone_andEmail() {
        assertThat(PrivacyMaskingService.alwaysMaskPhone("123")).isEqualTo("***");
        assertThat(PrivacyMaskingService.alwaysMaskEmail("x@y.com")).contains("@y.com");
    }
}
