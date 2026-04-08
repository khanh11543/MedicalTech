package com.q2k.meditech.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.entity.Role;
import com.q2k.meditech.entity.UserRole;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.auth.*;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.*;
import com.q2k.meditech.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock EmailVerificationRepository emailVerificationRepository;
    @Mock UserSessionRepository userSessionRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock TrustedDeviceRepository trustedDeviceRepository;
    @Mock LoginAttemptRepository loginAttemptRepository;
    @Mock RoleRepository roleRepository;
    @Mock PasswordHistoryRepository passwordHistoryRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailService emailService;
    @Mock JwtService jwtService;
    @Mock CustomUserDetailsService userDetailsService;
    @Mock NotificationEventService notificationEventService;
    @Mock ActivityLoggingService activityLoggingService;
    @Mock MfaService mfaService;
    @Spy ObjectMapper objectMapper = new ObjectMapper();
    @Mock LoginRateLimiterService loginRateLimiterService;

    @InjectMocks AuthService authService;

    @Mock RestTemplate restTemplate;

    @BeforeEach
    void injectConfig() {
        ReflectionTestUtils.setField(authService, "googleClientId", "g");
        ReflectionTestUtils.setField(authService, "googleClientSecret", "s");
        ReflectionTestUtils.setField(authService, "googleRedirectUri", "http://localhost/cb");
        ReflectionTestUtils.setField(authService, "googleAuthUrl", "https://accounts.google.com/o/oauth2/auth");
        ReflectionTestUtils.setField(authService, "googleTokenUrl", "https://oauth2.googleapis.com/token");
        ReflectionTestUtils.setField(authService, "googleUserinfoUrl", "https://openidconnect.googleapis.com/v1/userinfo");
        ReflectionTestUtils.setField(authService, "googleScope", "openid email");
        ReflectionTestUtils.setField(authService, "facebookAppId", "f");
        ReflectionTestUtils.setField(authService, "facebookAppSecret", "fs");
        ReflectionTestUtils.setField(authService, "facebookRedirectUri", "http://localhost/fb");
        ReflectionTestUtils.setField(authService, "facebookAuthUrl", "https://facebook.com/dialog/oauth");
        ReflectionTestUtils.setField(authService, "facebookTokenUrl", "https://graph.facebook.com/oauth/access_token");
        ReflectionTestUtils.setField(authService, "facebookUserinfoUrl", "https://graph.facebook.com/me?fields=id,email");
        ReflectionTestUtils.setField(authService, "facebookScope", "email");
        ReflectionTestUtils.setField(authService, "accountLockDuration", 30);
        ReflectionTestUtils.setField(authService, "maxFailedAttempts", 5);
        ReflectionTestUtils.setField(authService, "otpExpiryMinutes", 15);
        ReflectionTestUtils.setField(authService, "resetTokenExpiryMinutes", 15);
        ReflectionTestUtils.setField(authService, "trustedDeviceDays", 7);
        ReflectionTestUtils.setField(authService, "restTemplate", restTemplate);
    }

    @Test
    void register_passwordMismatch() {
        RegisterDTO dto = new RegisterDTO();
        dto.setPassword("a");
        dto.setConfirmPassword("b");
        dto.setEmail("e@e.e");
        HttpServletRequest req = mock(HttpServletRequest.class);
        assertThatThrownBy(() -> authService.register(dto, req)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void verifyEmail_noPending() {
        when(emailVerificationRepository.findLatestByEmailAndStatus(anyString(), any()))
                .thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> authService.verifyEmail(VerifyOtpDTO.builder().email("a@a.a").otpCode("1").build()))
                .isInstanceOf(InvalidOtpException.class);
    }

    @Test
    void login_ipBlocked() {
        when(loginRateLimiterService.isIpBlocked(anyString())).thenReturn(true);
        when(loginRateLimiterService.getBlockedUntil(anyString())).thenReturn(java.time.LocalDateTime.now().plusMinutes(5));
        LoginDTO dto = new LoginDTO();
        dto.setEmail("a@a.a");
        dto.setPassword("x");
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getRemoteAddr()).thenReturn("127.0.0.1");
        assertThatThrownBy(() -> authService.login(dto, req)).isInstanceOf(AccountLockedException.class);
    }

    @Test
    void refresh_invalidToken() {
        when(refreshTokenRepository.findActiveTokenByHash(anyString(), any())).thenReturn(java.util.Optional.empty());
        HttpServletRequest req = mock(HttpServletRequest.class);
        assertThatThrownBy(() -> authService.refresh(RefreshDTO.builder().refreshToken("t").build(), req))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void logout_notAuthenticated() {
        SecurityContextHolder.clearContext();
        assertThatThrownBy(() -> authService.logout(mock(HttpServletRequest.class))).isInstanceOf(BadRequestException.class);
    }

    @Test
    void changePassword_mismatch() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("a@a.a", "x"));
        User u = User.builder().email("a@a.a").passwordHash("h").build();
        u.setId(1L);
        when(userRepository.findByEmail("a@a.a")).thenReturn(java.util.Optional.of(u));
        ChangePasswordDTO dto = new ChangePasswordDTO();
        dto.setCurrentPassword("old");
        dto.setNewPassword("n1");
        dto.setConfirmPassword("n2");
        HttpServletRequest req = mock(HttpServletRequest.class);
        assertThatThrownBy(() -> authService.changePassword(dto, req)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void forgotPassword_unknownEmail() {
        when(userRepository.findByEmail("x@x.x")).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> authService.forgotPassword(ForgotPasswordDTO.builder().email("x@x.x").build(), mock(HttpServletRequest.class)))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void resetPassword_mismatch() {
        ResetPasswordDTO dto = ResetPasswordDTO.builder()
                .email("a@a.a")
                .resetToken("t")
                .newPassword("Aa1aaaa@")
                .confirmPassword("Aa1aaaa#")
                .build();
        assertThatThrownBy(() -> authService.resetPassword(dto)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void resendOtp_alreadyVerified() {
        User u = User.builder().email("a@a.a").isVerified(true).build();
        when(userRepository.findByEmail("a@a.a")).thenReturn(java.util.Optional.of(u));
        HttpServletRequest req = mock(HttpServletRequest.class);
        assertThatThrownBy(() -> authService.resendOtp("a@a.a", req)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void verifyAccountByToken_invalid() {
        when(jwtService.validateVerificationToken("bad")).thenReturn(null);
        assertThatThrownBy(() -> authService.verifyAccountByToken("bad")).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void verifyMfaLogin_invalidToken() {
        when(jwtService.validateMfaLoginToken("t")).thenReturn(false);
        HttpServletRequest req = mock(HttpServletRequest.class);
        assertThatThrownBy(() -> authService.verifyMfaLogin(MfaVerifyLoginDTO.builder().mfaToken("t").code("123456").build(), req))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void buildGoogleAuthorizationUrl() {
        assertThat(authService.buildGoogleAuthorizationUrl()).contains("client_id");
    }

    @Test
    void exchangeGoogleCode() {
        when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"access_token\":\"at\"}", HttpStatus.OK));
        JsonNode node = authService.exchangeGoogleCode("code");
        assertThat(node.get("access_token").asText()).isEqualTo("at");
    }

    @Test
    void fetchGoogleUserInfo() {
        when(restTemplate.exchange(anyString(), any(), any(), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"sub\":\"1\"}", HttpStatus.OK));
        assertThat(authService.fetchGoogleUserInfo("tok").get("sub").asText()).isEqualTo("1");
    }

    @Test
    void processGoogleUser_existingLinkedUser() throws Exception {
        User u = User.builder().email("g@g.c").fullName("G").authProvider("GOOGLE").build();
        u.setId(1L);
        Role r = new Role();
        r.setName("PATIENT");
        UserRole ur = new UserRole();
        ur.setRole(r);
        u.getUserRoles().add(ur);
        when(userRepository.findByAuthProviderAndAuthProviderId(eq("GOOGLE"), eq("sub1")))
                .thenReturn(java.util.Optional.of(u));
        UserDetails ud = mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername("g@g.c")).thenReturn(ud);
        when(jwtService.generateAccessToken(any(), anyLong())).thenReturn("a");
        when(jwtService.generateRefreshToken(anyString(), anyLong())).thenReturn("r");
        when(jwtService.calculateRefreshTokenExpiry()).thenReturn(java.time.LocalDateTime.now().plusDays(7));
        when(jwtService.calculateAccessTokenExpiry()).thenReturn(java.time.LocalDateTime.now().plusHours(1));

        ObjectMapper realOm = new ObjectMapper();
        JsonNode googleUser = realOm.readTree("{\"email\":\"g@g.c\",\"sub\":\"sub1\",\"name\":\"G\"}");
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getRemoteAddr()).thenReturn("127.0.0.1");
        when(req.getHeader("User-Agent")).thenReturn("JUnit");

        assertThat(authService.processGoogleUser(googleUser, req).getAccessToken()).isEqualTo("a");
    }

    @Test
    void buildFacebookAuthorizationUrl() {
        assertThat(authService.buildFacebookAuthorizationUrl()).contains("client_id");
    }

    @Test
    void exchangeFacebookCode() {
        when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"access_token\":\"at\"}", HttpStatus.OK));
        assertThat(authService.exchangeFacebookCode("c").get("access_token").asText()).isEqualTo("at");
    }

    @Test
    void fetchFacebookUserInfo() {
        when(restTemplate.getForEntity(startsWith("https://"), eq(String.class)))
                .thenReturn(new ResponseEntity<>("{\"id\":\"1\"}", HttpStatus.OK));
        assertThat(authService.fetchFacebookUserInfo("tok").get("id").asText()).isEqualTo("1");
    }

    @Test
    void processFacebookUser_existing() throws Exception {
        User u = User.builder().email("f@f.c").fullName("F").authProvider("FACEBOOK").build();
        u.setId(2L);
        Role r = new Role();
        r.setName("PATIENT");
        UserRole ur = new UserRole();
        ur.setRole(r);
        u.getUserRoles().add(ur);
        when(userRepository.findByAuthProviderAndAuthProviderId(eq("FACEBOOK"), eq("fb1")))
                .thenReturn(java.util.Optional.of(u));
        when(userDetailsService.loadUserByUsername("f@f.c")).thenReturn(mock(UserDetails.class));
        when(jwtService.generateAccessToken(any(), anyLong())).thenReturn("a");
        when(jwtService.generateRefreshToken(anyString(), anyLong())).thenReturn("r");
        when(jwtService.calculateRefreshTokenExpiry()).thenReturn(java.time.LocalDateTime.now().plusDays(7));
        when(jwtService.calculateAccessTokenExpiry()).thenReturn(java.time.LocalDateTime.now().plusHours(1));

        ObjectMapper realOm = new ObjectMapper();
        JsonNode fb = realOm.readTree("{\"id\":\"fb1\",\"email\":\"f@f.c\",\"name\":\"F\"}");
        HttpServletRequest req = mock(HttpServletRequest.class);
        when(req.getRemoteAddr()).thenReturn("127.0.0.1");
        when(req.getHeader("User-Agent")).thenReturn("JUnit");

        assertThat(authService.processFacebookUser(fb, req).getAccessToken()).isEqualTo("a");
    }
}
