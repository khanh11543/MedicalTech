package com.q2k.meditech.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class SmsServiceTest {

    private final SmsService service = new SmsService();

    @BeforeEach
    void initService() {
        ReflectionTestUtils.setField(service, "smsProvider", "mock");
        ReflectionTestUtils.setField(service, "esmsApiKey", "");
        ReflectionTestUtils.setField(service, "esmsSecretKey", "");
        service.init();
    }

    @Test
    void sendInvoiceSms_runsMockPath() {
        service.sendInvoiceSms("0326166145", "INV1", "10000");
    }

    @Test
    void sendPaymentConfirmationSms_runsMockPath() {
        service.sendPaymentConfirmationSms("0326166145", "P1", "5000");
    }

    @Test
    void sendRefundSms_runsMockPath() {
        service.sendRefundSms("0326166145", "P1", "1000");
    }

    @Test
    void normalizePhoneNumber_invalid_throws() {
        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(service, "normalizePhoneNumber", "12"))
                .isInstanceOf(RuntimeException.class);
    }
}
