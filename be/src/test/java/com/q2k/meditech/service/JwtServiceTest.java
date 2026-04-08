package com.q2k.meditech.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @InjectMocks
    private JwtService jwtService;

    @BeforeEach
    void initKey() {
        ReflectionTestUtils.setField(jwtService, "secret",
                "01234567890123456789012345678901"); // 32 bytes for HS256
        ReflectionTestUtils.setField(jwtService, "expiration", 3600_000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 86400_000L);
        ReflectionTestUtils.setField(jwtService, "mfaExpiration", 300_000L);
        jwtService.init();
    }

    @Test
    void generateAndValidateAccessToken() {
        UserDetails ud = User.withUsername("u1")
                .password("p")
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_USER")))
                .build();
        String token = jwtService.generateAccessToken(ud, 42L);
        assertThat(jwtService.extractUsername(token)).isEqualTo("u1");
        assertThat(jwtService.extractUserId(token)).isEqualTo(42L);
        assertThat(jwtService.validateToken(token, ud)).isTrue();
        assertThat(jwtService.isTokenExpired(token)).isFalse();
        assertThat(jwtService.getExpirationAsLocalDateTime(token)).isNotNull();
        assertThat(jwtService.calculateAccessTokenExpiry()).isNotNull();
        assertThat(jwtService.calculateRefreshTokenExpiry()).isNotNull();
    }

    @Test
    void refreshAndMfaTokens() {
        String refresh = jwtService.generateRefreshToken("u2", 3L);
        assertThat(jwtService.extractUserId(refresh)).isEqualTo(3L);

        String mfa = jwtService.generateMfaLoginToken("u2", 3L);
        assertThat(jwtService.validateMfaLoginToken(mfa)).isTrue();
    }

    @Test
    void validateMfaLoginToken_invalid_returnsFalse() {
        assertThat(jwtService.validateMfaLoginToken("not-a-jwt")).isFalse();
    }

    @Test
    void verificationToken_roundTrip() {
        String t = jwtService.generateVerificationToken("a@b.com");
        assertThat(jwtService.validateVerificationToken(t)).isEqualTo("a@b.com");
    }

    @Test
    void validateVerificationToken_wrongType_returnsNull() {
        UserDetails ud = User.withUsername("x").password("p").roles("U").build();
        String access = jwtService.generateAccessToken(ud, 1L);
        assertThat(jwtService.validateVerificationToken(access)).isNull();
    }
}
