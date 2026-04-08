package com.q2k.meditech.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class GeoLocationServiceTest {

    @InjectMocks
    private GeoLocationService service;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(service, "databasePath", "/nonexistent/path.mmdb");
        service.init();
    }

    @Test
    void isAvailable_falseWhenDbMissing() {
        assertThat(service.isAvailable()).isFalse();
    }

    @Test
    void lookup_whenUnavailable_returnsNull() {
        assertThat(service.lookup("8.8.8.8")).isNull();
    }

    @Test
    void lookup_blank_returnsNull() {
        ReflectionTestUtils.setField(service, "available", true);
        assertThat(service.lookup("  ")).isNull();
    }

    @Test
    void lookup_privateIp_returnsLocal() {
        ReflectionTestUtils.setField(service, "available", true);
        GeoLocationService.GeoInfo info = service.lookup("127.0.0.1");
        assertThat(info).isNotNull();
        assertThat(info.getCountry()).isEqualTo("Local");
    }
}
