package com.q2k.meditech.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class WebhookSecurityServiceTest {

    private final WebhookSecurityService service = new WebhookSecurityService();

    @BeforeEach
    void setSecret() {
        ReflectionTestUtils.setField(service, "momoSecretKey", "secret");
    }

    @Test
    void computeHmacSha256_matchesMac() throws Exception {
        String data = "payload";
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String expected = Base64.getEncoder().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));

        assertThat(service.computeHmacSha256(data, "secret")).isEqualTo(expected);
    }

    @Test
    void verifyMomoSignature_valid() throws Exception {
        String data = "x";
        String sig = service.computeHmacSha256(data, "secret");
        assertThat(service.verifyMomoSignature(sig, data)).isTrue();
    }

    @Test
    void verifyMomoSignature_invalid() {
        assertThat(service.verifyMomoSignature("bad", "data")).isFalse();
    }

    @Test
    void isAlreadyProcessed_idempotency() {
        assertThat(service.isAlreadyProcessed("t1")).isFalse();
        assertThat(service.isAlreadyProcessed("t1")).isTrue();
    }

    @Test
    void clearProcessedTransaction() {
        service.isAlreadyProcessed("t2");
        service.clearProcessedTransaction("t2");
        assertThat(service.isAlreadyProcessed("t2")).isFalse();
    }

    @Test
    void getCachedTransactionCount_and_cleanup() {
        service.isAlreadyProcessed("a");
        service.isAlreadyProcessed("b");
        assertThat(service.getCachedTransactionCount()).isEqualTo(2);
        service.cleanup();
        assertThat(service.getCachedTransactionCount()).isZero();
    }
}
