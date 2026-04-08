package com.q2k.meditech.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class LoginRateLimiterServiceTest {

    @InjectMocks
    private LoginRateLimiterService service;

    @BeforeEach
    void configure() {
        ReflectionTestUtils.setField(service, "ipMaxFailedAttempts", 3);
        ReflectionTestUtils.setField(service, "ipBlockDuration", 60);
        ReflectionTestUtils.setField(service, "ipFailWindow", 60);
    }

    @Test
    void isIpBlocked_falseInitially() {
        assertThat(service.isIpBlocked("1.1.1.1")).isFalse();
        assertThat(service.getBlockedUntil("1.1.1.1")).isNull();
    }

    @Test
    void recordFailedAttempt_blocksAfterThreshold() {
        String ip = "2.2.2.2";
        service.recordFailedAttempt(ip);
        service.recordFailedAttempt(ip);
        assertThat(service.isIpBlocked(ip)).isFalse();
        service.recordFailedAttempt(ip);
        assertThat(service.isIpBlocked(ip)).isTrue();
        assertThat(service.getBlockedUntil(ip)).isAfter(LocalDateTime.now());
    }

    @Test
    void resetIp_clearsState() {
        String ip = "3.3.3.3";
        service.recordFailedAttempt(ip);
        service.recordFailedAttempt(ip);
        service.recordFailedAttempt(ip);
        service.resetIp(ip);
        assertThat(service.isIpBlocked(ip)).isFalse();
    }
}
