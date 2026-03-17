package com.q2k.meditech.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.UserDTO;
import com.q2k.meditech.dto.auth.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.VerificationStatus;
import com.q2k.meditech.exception.*;
import com.q2k.meditech.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Authentication Service
 * Handles all authentication-related operations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final UserSessionRepository userSessionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final RoleRepository roleRepository;
    private final PasswordHistoryRepository passwordHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final NotificationEventService notificationEventService;
    private final ActivityLoggingService activityLoggingService;
    private final MfaService mfaService;
    private final ObjectMapper objectMapper;
    private final LoginRateLimiterService loginRateLimiterService;

    // Google OAuth2 configuration
    @Value("${google.oauth2.client-id}")
    private String googleClientId;

    @Value("${google.oauth2.client-secret}")
    private String googleClientSecret;

    @Value("${google.oauth2.redirect-uri}")
    private String googleRedirectUri;

    @Value("${google.oauth2.auth-url}")
    private String googleAuthUrl;

    @Value("${google.oauth2.token-url}")
    private String googleTokenUrl;

    @Value("${google.oauth2.userinfo-url}")
    private String googleUserinfoUrl;

    @Value("${google.oauth2.scope}")
    private String googleScope;

    // Facebook OAuth2 configuration
    @Value("${facebook.oauth2.app-id}")
    private String facebookAppId;

    @Value("${facebook.oauth2.app-secret}")
    private String facebookAppSecret;

    @Value("${facebook.oauth2.redirect-uri}")
    private String facebookRedirectUri;

    @Value("${facebook.oauth2.auth-url}")
    private String facebookAuthUrl;

    @Value("${facebook.oauth2.token-url}")
    private String facebookTokenUrl;

    @Value("${facebook.oauth2.userinfo-url}")
    private String facebookUserinfoUrl;

    @Value("${facebook.oauth2.scope}")
    private String facebookScope;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.account-lock-duration:30}") // minutes
    private int accountLockDuration;

    @Value("${app.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${app.otp-expiry-minutes:15}")
    private int otpExpiryMinutes;

    @Value("${app.reset-token-expiry-minutes:15}")
    private int resetTokenExpiryMinutes;

    private static final SecureRandom secureRandom = new SecureRandom();

    /**
     * Register new patient account
     */
    @Transactional
    public UserDTO register(RegisterDTO registerDTO, HttpServletRequest request) {
        // Validate passwords match
        if (!registerDTO.getPassword().equals(registerDTO.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        // Check if email already exists in users table
        if (userRepository.findByEmail(registerDTO.getEmail()).isPresent()) {
            throw new DuplicateResourceException("Email already registered");
        }

        // Check if phone already exists in users table
        if (registerDTO.getPhone() != null && 
            userRepository.findByPhone(registerDTO.getPhone()).isPresent()) {
            throw new DuplicateResourceException("Phone number already registered");
        }

        // Check if there's already a pending verification for this email
        emailVerificationRepository.findLatestByEmailAndStatus(
            registerDTO.getEmail(), VerificationStatus.PENDING)
            .ifPresent(verification -> {
                // If expired, mark it as expired
                if (verification.isExpired()) {
                    verification.markAsExpired();
                    emailVerificationRepository.save(verification);
                    return;
                }
                // If not expired, expire it so user can re-register with new OTP
                // This allows retry when previous email send failed
                verification.markAsExpired();
                emailVerificationRepository.save(verification);
            });

        // Generate and send OTP
        String otpCode = emailService.generateOtp();
        String passwordHash = passwordEncoder.encode(registerDTO.getPassword());
        
        // Create email verification with registration data (NO user created yet)
        createEmailVerificationForRegistration(
            registerDTO.getEmail(), 
            otpCode, 
            passwordHash,
            registerDTO.getPhone(),
            request
        );
        
        // Send OTP email - don't let email failure crash registration
        try {
            emailService.sendOtpEmail(registerDTO.getEmail(), otpCode);
        } catch (Exception e) {
            log.warn("Failed to send OTP email to {}: {}. User can request resend later.", 
                registerDTO.getEmail(), e.getMessage());
        }

        // Return a temporary DTO (user not created yet)
        return UserDTO.builder()
            .email(registerDTO.getEmail())
            .phone(registerDTO.getPhone())
            .isActive(false)
            .isVerified(false)
            .build();
    }

    /**
     * Verify email with OTP
     */
    @Transactional
    public MessageDTO verifyEmail(VerifyOtpDTO verifyOtpDTO) {
        // Find latest pending verification
        EmailVerification verification = emailVerificationRepository
            .findLatestByEmailAndStatus(verifyOtpDTO.getEmail(), VerificationStatus.PENDING)
            .orElseThrow(() -> new InvalidOtpException("No pending verification found"));

        // Check if expired
        if (verification.isExpired()) {
            verification.markAsExpired();
            emailVerificationRepository.save(verification);
            throw new InvalidOtpException("OTP has expired");
        }

        // Check attempts
        if (!verification.canRetry()) {
            verification.markAsExpired();
            emailVerificationRepository.save(verification);
            throw new InvalidOtpException("Maximum verification attempts exceeded");
        }

        // Verify OTP
        if (!verification.getOtpCode().equals(verifyOtpDTO.getOtpCode())) {
            verification.incrementAttempt();
            emailVerificationRepository.save(verification);
            throw new InvalidOtpException("Invalid OTP code");
        }

        // Mark as verified
        verification.markAsVerified();
        emailVerificationRepository.save(verification);

        // Check if this is a registration flow (no user exists yet)
        if (verification.getUser() == null) {
            // Create user NOW after successful OTP verification
            if (verification.getPasswordHash() == null) {
                throw new BadRequestException("Invalid verification record - missing password");
            }

            // Double-check email is still available
            if (userRepository.findByEmail(verification.getEmail()).isPresent()) {
                throw new DuplicateResourceException("Email already registered");
            }

            // Double-check phone is still available (if provided)
            if (verification.getPhone() != null && 
                userRepository.findByPhone(verification.getPhone()).isPresent()) {
                throw new DuplicateResourceException("Phone number already registered");
            }

            // Create new user
            User newUser = User.builder()
                .email(verification.getEmail())
                .passwordHash(verification.getPasswordHash())
                .phone(verification.getPhone())
                .isActive(true)  // Active immediately after verification
                .isVerified(true)  // Verified immediately
                .failedLoginCount(0)
                .twoFactorEnabled(false)
                .build();

            // Assign PATIENT role by default
            Role patientRole = roleRepository.findByName("PATIENT")
                .orElseThrow(() -> new ResourceNotFoundException("Role PATIENT not found"));
            
            UserRole userRole = new UserRole();
            userRole.setRole(patientRole);
            newUser.addRole(userRole);

            newUser = userRepository.save(newUser);

            // Update verification record to link to the new user
            verification.setUser(newUser);
            emailVerificationRepository.save(verification);

            // Send welcome email
            emailService.sendWelcomeEmail(newUser.getEmail(), newUser.getEmail());

            log.info("New user created and verified: {}", newUser.getEmail());

            // Send notification: new patient registered
            try {
                notificationEventService.onNewPatientRegistered(newUser);
            } catch (Exception e) {
                log.warn("Failed to send new patient notification: {}", e.getMessage());
            }
        } else {
            // This is for email change flow - just activate existing user
            User user = verification.getUser();
            user.setIsVerified(true);
            user.setIsActive(true);
            userRepository.save(user);

            // Send welcome email
            emailService.sendWelcomeEmail(user.getEmail(), user.getEmail());

            log.info("Existing user verified: {}", user.getEmail());
        }

        return MessageDTO.success("Email verified successfully");
    }

    /**
     * Login
     */
    @Transactional(noRollbackFor = {BadCredentialsException.class, AccountLockedException.class, UnverifiedAccountException.class})
    public LoginResponseDTO login(LoginDTO loginDTO, HttpServletRequest request) {
        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        // Layer 2: Check IP rate limit
        if (loginRateLimiterService.isIpBlocked(ipAddress)) {
            LocalDateTime blockedUntil = loginRateLimiterService.getBlockedUntil(ipAddress);
            log.warn("IP {} is blocked until {}", ipAddress, blockedUntil);
            throw new AccountLockedException(
                "Too many login attempts from this IP. Please try again after " + blockedUntil);
        }

        User user = userRepository.findByEmail(loginDTO.getEmail())
            .orElse(null);

        try {
            // Check if user exists
            if (user == null) {
                loginRateLimiterService.recordFailedAttempt(ipAddress);
                recordLoginAttempt(null, loginDTO.getEmail(), false, 
                    "User not found", ipAddress, userAgent);
                // Check if IP just got blocked after this attempt
                if (loginRateLimiterService.isIpBlocked(ipAddress)) {
                    LocalDateTime ipBlockedUntil = loginRateLimiterService.getBlockedUntil(ipAddress);
                    throw new AccountLockedException(
                        "Too many login attempts from this IP. Please try again after " + ipBlockedUntil);
                }
                throw new BadCredentialsException("Invalid email or password");
            }

            // Check if account is locked
            if (user.isAccountLocked()) {
                recordLoginAttempt(user, loginDTO.getEmail(), false, 
                    "Account locked", ipAddress, userAgent);
                throw new AccountLockedException(
                    "Account is locked until " + user.getLockedUntil());
            }

            // Check if account is active (account must be activated after email verification)
            if (!user.getIsActive()) {
                recordLoginAttempt(user, loginDTO.getEmail(), false, 
                    "Account not activated", ipAddress, userAgent);
                throw new UnverifiedAccountException("Please verify your email to activate your account");
            }

            // Check if email is verified
            if (!user.getIsVerified()) {
                recordLoginAttempt(user, loginDTO.getEmail(), false, 
                    "Email not verified", ipAddress, userAgent);
                throw new UnverifiedAccountException("Please verify your email first");
            }

            // Verify password (passwordHash may be null for legacy OAuth accounts)
            if (user.getPasswordHash() == null || !passwordEncoder.matches(loginDTO.getPassword(), user.getPasswordHash())) {
                handleFailedLogin(user, loginDTO.getEmail(), ipAddress, userAgent);
                loginRateLimiterService.recordFailedAttempt(ipAddress);
                // Check if account just got locked after this attempt
                if (user.isAccountLocked()) {
                    throw new AccountLockedException(
                        "Account is locked until " + user.getLockedUntil());
                }
                // Check if IP just got blocked after this attempt
                if (loginRateLimiterService.isIpBlocked(ipAddress)) {
                    LocalDateTime ipBlockedUntil = loginRateLimiterService.getBlockedUntil(ipAddress);
                    throw new AccountLockedException(
                        "Too many login attempts from this IP. Please try again after " + ipBlockedUntil);
                }
                throw new BadCredentialsException("Invalid email or password");
            }

            // If user is using a temporary (recovery) password, check it hasn't expired
            if (user.getResetTokenExpiry() != null && LocalDateTime.now().isAfter(user.getResetTokenExpiry())) {
                user.setResetToken(null);
                user.setResetTokenExpiry(null);
                user.setResetTokenUsedAt(null);
                user.setPasswordHash(passwordEncoder.encode(generateTemporaryPassword())); // invalidate old temp password
                userRepository.save(user);
                throw new BadCredentialsException("Password recovery has expired. Please request a new password via Forgot password.");
            }

            // Layer 3: Reset failed attempts on successful login
            user.setFailedLoginCount(0);
            user.setLockedUntil(null);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Reset IP rate limit on successful login
            loginRateLimiterService.resetIp(ipAddress);

            // Record successful login
            recordLoginAttempt(user, loginDTO.getEmail(), true, null, ipAddress, userAgent);

            // Activity log
            activityLoggingService.log(user, com.q2k.meditech.entity.enums.ActivityType.LOGIN,
                    "User logged in", ipAddress, userAgent);

            // If MFA enabled, return a short-lived MFA token instead of session tokens
            if (Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
                String mfaToken = jwtService.generateMfaLoginToken(user.getEmail(), user.getId());
                return LoginResponseDTO.builder()
                        .mfaRequired(true)
                        .mfaToken(mfaToken)
                        .mfaExpiresAt(jwtService.getExpirationAsLocalDateTime(mfaToken))
                        .token(null)
                        .build();
            }

            // Generate tokens (normal login)
            TokenDTO token = generateTokens(user, loginDTO.getDeviceId(), loginDTO.getDeviceName(),
                    ipAddress, userAgent);
            return LoginResponseDTO.builder()
                    .mfaRequired(false)
                    .token(token)
                    .build();

        } catch (Exception ex) {
            // Log any unexpected errors
            log.error("Login error for email {}: {}", loginDTO.getEmail(), ex.getMessage());
            throw ex;
        }
    }

    /**
     * Refresh token
     */
    @Transactional
    public TokenDTO refresh(RefreshDTO refreshDTO, HttpServletRequest request) {
        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        String refreshTokenHash = hashToken(refreshDTO.getRefreshToken());

        // Find refresh token
        RefreshToken refreshToken = refreshTokenRepository
            .findActiveTokenByHash(refreshTokenHash, LocalDateTime.now())
            .orElseThrow(() -> new InvalidTokenException("Invalid or expired refresh token"));

        // Revoke old refresh token
        refreshToken.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(refreshToken);

        // Find associated session
        UserSession session = userSessionRepository.findByRefreshTokenHash(refreshTokenHash)
            .orElseThrow(() -> new InvalidTokenException("Session not found"));

        User user = refreshToken.getUser();

        // Generate new tokens
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String newAccessToken = jwtService.generateAccessToken(userDetails, user.getId());
        String newRefreshToken = jwtService.generateRefreshToken(user.getEmail(), user.getId());

        // Create new refresh token entity
        RefreshToken newRefreshTokenEntity = RefreshToken.builder()
            .user(user)
            .tokenHash(hashToken(newRefreshToken))
            .issuedAt(LocalDateTime.now())
            .expiresAt(jwtService.calculateRefreshTokenExpiry())
            .replacedByToken(null)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .build();

        refreshToken.setReplacedByToken(newRefreshTokenEntity);
        refreshTokenRepository.save(refreshToken);
        refreshTokenRepository.save(newRefreshTokenEntity);

        // Update session
        session.setRefreshTokenHash(hashToken(newRefreshToken));
        session.setLastSeenAt(LocalDateTime.now());
        session.setExpiresAt(jwtService.calculateRefreshTokenExpiry());
        userSessionRepository.save(session);

        return TokenDTO.builder()
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken)
            .tokenType("Bearer")
            .expiresAt(jwtService.calculateAccessTokenExpiry())
            .refreshExpiresAt(jwtService.calculateRefreshTokenExpiry())
            .sessionKey(session.getSessionKey())
            .build();
    }

    /**
     * Logout
     */
    @Transactional
    public MessageDTO logout(HttpServletRequest request) {
        // Get current user from security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadRequestException("User not authenticated");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Extract token from header
        String token = extractTokenFromRequest(request);
        if (token != null) {
            try {
                // Find session by token (implementation depends on how you store session-token mapping)
                // For now, revoke all active sessions
                userSessionRepository.revokeAllUserSessions(user, LocalDateTime.now(), "User logout");
                refreshTokenRepository.revokeAllUserTokens(user, LocalDateTime.now());
            } catch (Exception ex) {
                log.error("Error during logout: {}", ex.getMessage());
            }
        }

        // Activity log
        String ipAddress = getClientIp(request);
        String userAgent2 = request.getHeader("User-Agent");
        activityLoggingService.log(user, com.q2k.meditech.entity.enums.ActivityType.LOGOUT,
                "User logged out", ipAddress, userAgent2);

        return MessageDTO.success("Logged out successfully");
    }

    /**
     * Change password
     */
    @Transactional
    public MessageDTO changePassword(ChangePasswordDTO changePasswordDTO, HttpServletRequest request) {
        // Get current user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Validate passwords match
        if (!changePasswordDTO.getNewPassword().equals(changePasswordDTO.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        // Verify current password
        if (!passwordEncoder.matches(changePasswordDTO.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        // Check new password is not same as current
        if (passwordEncoder.matches(changePasswordDTO.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password must be different from current password");
        }

        // Check against last 3 passwords in history
        var recentPasswords = passwordHistoryRepository.findTop3ByUserIdOrderByCreatedAtDesc(user.getId());
        for (PasswordHistory ph : recentPasswords) {
            if (passwordEncoder.matches(changePasswordDTO.getNewPassword(), ph.getPasswordHash())) {
                throw new BadRequestException("New password cannot be the same as any of your last 3 passwords");
            }
        }

        // Save current password to history before changing
        PasswordHistory history = PasswordHistory.builder()
                .user(user)
                .passwordHash(user.getPasswordHash())
                .build();
        passwordHistoryRepository.save(history);

        // Update password
        user.setPasswordHash(passwordEncoder.encode(changePasswordDTO.getNewPassword()));
        // Clear forgot-password temp state so account is back to normal
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        user.setResetTokenUsedAt(null);
        userRepository.save(user);

        // Revoke all sessions except current (optional - for security)
        // userSessionRepository.revokeAllUserSessions(user, LocalDateTime.now(), "Password changed");

        // Activity log
        String ipAddress = getClientIp(request);
        String ua = request.getHeader("User-Agent");
        activityLoggingService.log(user, com.q2k.meditech.entity.enums.ActivityType.PASSWORD_CHANGE,
                "Password changed", ipAddress, ua);

        return MessageDTO.success("Password changed successfully");
    }

    /**
     * Forgot password - generate temporary password, set on user, send by email.
     * Temporary password is valid for 15 minutes only; user must login and change password in Profile.
     * Always returns success message (do not reveal whether email exists).
     */
    @Transactional
    public MessageDTO forgotPassword(ForgotPasswordDTO forgotPasswordDTO, HttpServletRequest request) {
        var optionalUser = userRepository.findByEmail(forgotPasswordDTO.getEmail());
        if (optionalUser.isEmpty()) {
            log.info("Forgot password requested for unknown email: {}", forgotPasswordDTO.getEmail());
            throw new ResourceNotFoundException("Email is not registered.");
        }

        User user = optionalUser.get();
        String tempPassword = generateTemporaryPassword();
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setResetToken(hashToken("temp-" + tempPassword));
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(resetTokenExpiryMinutes));
        user.setResetTokenUsedAt(null);
        userRepository.save(user);

        emailService.sendForgotPasswordTempPasswordEmail(user.getEmail(), tempPassword, resetTokenExpiryMinutes);

        return MessageDTO.success("A new password has been sent to your email. It is valid for " + resetTokenExpiryMinutes + " minutes. Please sign in and go to Profile to change your password.");
    }

    /**
     * Reset password with token
     */
    @Transactional
    public MessageDTO resetPassword(ResetPasswordDTO resetPasswordDTO) {
        // Validate passwords match
        if (!resetPasswordDTO.getNewPassword().equals(resetPasswordDTO.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }

        User user = userRepository.findByEmail(resetPasswordDTO.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Verify reset token
        if (user.getResetToken() == null || 
            !user.getResetToken().equals(hashToken(resetPasswordDTO.getResetToken()))) {
            throw new InvalidTokenException("Invalid reset token");
        }

        // Check if token is expired
        if (user.getResetTokenExpiry() == null || 
            user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Reset token has expired");
        }

        // Check if token was already used
        if (user.getResetTokenUsedAt() != null) {
            throw new InvalidTokenException("Reset token has already been used");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(resetPasswordDTO.getNewPassword()));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        user.setResetTokenUsedAt(LocalDateTime.now());
        userRepository.save(user);

        // Revoke all sessions for security
        userSessionRepository.revokeAllUserSessions(user, LocalDateTime.now(), "Password reset");
        refreshTokenRepository.revokeAllUserTokens(user, LocalDateTime.now());

        return MessageDTO.success("Password reset successfully");
    }

    // ==================== Helper Methods ====================

    private TokenDTO generateTokens(User user, String deviceId, String deviceName, 
                                    String ipAddress, String userAgent) {
        // Load user details
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());

        // Generate tokens
        String accessToken = jwtService.generateAccessToken(userDetails, user.getId());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail(), user.getId());

        // Create refresh token entity
        RefreshToken refreshTokenEntity = RefreshToken.builder()
            .user(user)
            .tokenHash(hashToken(refreshToken))
            .issuedAt(LocalDateTime.now())
            .expiresAt(jwtService.calculateRefreshTokenExpiry())
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .build();
        refreshTokenRepository.save(refreshTokenEntity);

        // Create user session
        String sessionKey = UUID.randomUUID().toString();
        String safeDeviceId = deviceId != null ? deviceId.substring(0, Math.min(deviceId.length(), 500)) : "unknown";
        String safeDeviceName = deviceName != null ? deviceName.substring(0, Math.min(deviceName.length(), 255)) : "Unknown Device";
        UserSession session = UserSession.builder()
            .user(user)
            .sessionKey(sessionKey)
            .deviceId(safeDeviceId)
            .deviceName(safeDeviceName)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .expiresAt(jwtService.calculateRefreshTokenExpiry())
            .lastSeenAt(LocalDateTime.now())
            .refreshTokenHash(hashToken(refreshToken))
            .build();
        userSessionRepository.save(session);

        return TokenDTO.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresAt(jwtService.calculateAccessTokenExpiry())
            .refreshExpiresAt(jwtService.calculateRefreshTokenExpiry())
            .sessionKey(sessionKey)
            .userId(user.getId())
            .email(user.getEmail())
            .roles(user.getUserRoles().stream()
                    .map(ur -> ur.getRole().getName())
                    .collect(Collectors.toSet()))
            .build();
    }

    private void handleFailedLogin(User user, String email, String ipAddress, String userAgent) {
        int currentCount = user.getFailedLoginCount() != null ? user.getFailedLoginCount() : 0;
        user.setFailedLoginCount(currentCount + 1);

        log.warn("Failed login attempt for {}: count={}/{}", email, user.getFailedLoginCount(), maxFailedAttempts);

        if (user.getFailedLoginCount() >= maxFailedAttempts) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(accountLockDuration));
            log.warn("Account {} LOCKED until {}", email, user.getLockedUntil());
        }

        userRepository.save(user);
        userRepository.flush(); // Force immediate DB write
        recordLoginAttempt(user, email, false, "Invalid password", ipAddress, userAgent);

        // Send lock notification after DB save to avoid blocking persistence
        if (user.getFailedLoginCount() >= maxFailedAttempts) {
            try {
                emailService.sendAccountLockedEmail(user.getEmail());
            } catch (Exception e) {
                log.warn("Failed to send account locked email to {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }

    private void recordLoginAttempt(User user, String email, boolean success, 
                                    String failureReason, String ipAddress, String userAgent) {
        LoginAttempt attempt = LoginAttempt.builder()
            .user(user)
            .email(email)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .success(success)
            .failureReason(failureReason)
            .attemptedAt(LocalDateTime.now())
            .build();
        loginAttemptRepository.save(attempt);
    }

    private void createEmailVerificationForRegistration(String email, String otpCode,
                                                       String passwordHash, String phone,
                                                       HttpServletRequest request) {
        EmailVerification verification = EmailVerification.builder()
            .user(null)  // No user yet - will be created after OTP verification
            .email(email)
            .otpCode(otpCode)
            .passwordHash(passwordHash)  // Store temporarily
            .phone(phone)  // Store temporarily
            .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
            .attemptCount(0)
            .status(VerificationStatus.PENDING)
            .ipAddress(getClientIp(request))
            .userAgent(request.getHeader("User-Agent"))
            .build();
        emailVerificationRepository.save(verification);
    }

    private void createEmailVerification(User user, String email, String otpCode, 
                                         HttpServletRequest request) {
        EmailVerification verification = EmailVerification.builder()
            .user(user)
            .email(email)
            .otpCode(otpCode)
            .expiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
            .attemptCount(0)
            .status(VerificationStatus.PENDING)
            .ipAddress(getClientIp(request))
            .userAgent(request.getHeader("User-Agent"))
            .build();
        emailVerificationRepository.save(verification);
    }

    private UserDTO convertToUserDTO(User user) {
        return UserDTO.builder()
            .id(user.getId())
            .email(user.getEmail())
            .phone(user.getPhone())
            .avatarUrl(user.getAvatarUrl())
            .isActive(user.getIsActive())
            .isVerified(user.getIsVerified())
            .twoFactorEnabled(user.getTwoFactorEnabled())
            .failedLoginCount(user.getFailedLoginCount())
            .lockedUntil(user.getLockedUntil())
            .lastLogin(user.getLastLogin())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .roles(user.getUserRoles().stream()
                .map(ur -> ur.getRole().getName())
                .collect(Collectors.toSet()))
            .build();
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /** Generate a readable temporary password (letters + digits, 10 chars) for email recovery */
    private String generateTemporaryPassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(secureRandom.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Resend OTP for email verification
     */
    @Transactional
    public MessageDTO resendOtp(String email, HttpServletRequest request) {
        // Check if email is already registered (user exists and is verified)
        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getIsVerified()) {
                throw new BadRequestException("This email is already verified");
            }
        });

        // Find latest pending verification
        EmailVerification existingVerification = emailVerificationRepository
            .findLatestByEmailAndStatus(email, VerificationStatus.PENDING)
            .orElse(null);

        if (existingVerification != null) {
            // Expire the old one
            existingVerification.markAsExpired();
            emailVerificationRepository.save(existingVerification);

            // Create new verification reusing stored password hash and phone
            String newOtpCode = emailService.generateOtp();
            createEmailVerificationForRegistration(
                email, newOtpCode,
                existingVerification.getPasswordHash(),
                existingVerification.getPhone(),
                request
            );

            // Send new OTP
            emailService.sendOtpEmail(email, newOtpCode);
        } else {
            // Try to find any expired verification with registration data
            emailVerificationRepository.findLatestByEmail(email)
                .filter(v -> v.getPasswordHash() != null)
                .ifPresentOrElse(
                    expiredVerification -> {
                        String newOtpCode = emailService.generateOtp();
                        createEmailVerificationForRegistration(
                            email, newOtpCode,
                            expiredVerification.getPasswordHash(),
                            expiredVerification.getPhone(),
                            request
                        );
                        emailService.sendOtpEmail(email, newOtpCode);
                    },
                    () -> {
                        throw new BadRequestException("No registration found for this email. Please register first.");
                    }
                );
        }

        return MessageDTO.success("A new OTP has been sent to your email");
    }

    /**
     * Verify account using token link (for admin-created accounts)
     */
    @Transactional
    public MessageDTO verifyAccountByToken(String token) {
        String email = jwtService.validateVerificationToken(token);
        if (email == null) {
            throw new InvalidTokenException("Invalid or expired verification link");
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getIsVerified()) {
            return MessageDTO.success("Account is already verified");
        }

        user.setIsVerified(true);
        user.setIsActive(true);
        userRepository.save(user);

        log.info("Account verified via token link: {}", email);
        return MessageDTO.success("Account verified successfully! You can now login.");
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * Verify MFA token + Authenticator code to complete login.
     */
    @Transactional
    public TokenDTO verifyMfaLogin(MfaVerifyLoginDTO dto, HttpServletRequest request) {
        if (!jwtService.validateMfaLoginToken(dto.getMfaToken())) {
            throw new InvalidTokenException("Invalid or expired MFA token");
        }

        String email = jwtService.extractUsername(dto.getMfaToken());
        Long userId = jwtService.extractUserId(dto.getMfaToken());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!user.getEmail().equalsIgnoreCase(email)) {
            throw new InvalidTokenException("Invalid MFA token");
        }

        // Must have MFA enabled to use this endpoint
        if (!Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            throw new BadRequestException("Two-factor authentication is not enabled for this account");
        }

        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        String code = dto.getCode().trim();

        boolean ok;
        if (code.matches("^[0-9]{6}$")) {
            ok = mfaService.verifyAuthenticatorCode(user, code);
        } else {
            ok = mfaService.tryUseBackupCode(user, code, ipAddress);
        }
        if (!ok) {
            recordLoginAttempt(user, user.getEmail(), false,
                    "Invalid MFA or backup code", ipAddress, userAgent);
            throw new InvalidOtpException("Invalid Authenticator code or backup code");
        }

        // Successful MFA completion — issue tokens
        recordLoginAttempt(user, user.getEmail(), true, null, ipAddress, userAgent);
        return generateTokens(
                user,
                request.getHeader("User-Agent"),
                "MFA Verified (Web)",
                ipAddress,
                userAgent
        );
    }

    // ==================== Google OAuth2 Methods ====================

    /**
     * Build Google OAuth2 authorization URL for redirect
     */
    public String buildGoogleAuthorizationUrl() {
        return UriComponentsBuilder.fromUriString(googleAuthUrl)
                .queryParam("client_id", googleClientId)
                .queryParam("redirect_uri", googleRedirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", googleScope)
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                .build()
                .toUriString();
    }

    /**
     * Exchange Google authorization code for access token
     */
    public JsonNode exchangeGoogleCode(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", googleClientId);
        params.add("client_secret", googleClientSecret);
        params.add("code", code);
        params.add("grant_type", "authorization_code");
        params.add("redirect_uri", googleRedirectUri);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        ResponseEntity<String> response = restTemplate.postForEntity(googleTokenUrl, request, String.class);

        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            log.error("Failed to parse Google token response", e);
            throw new RuntimeException("Failed to parse Google token response");
        }
    }

    /**
     * Fetch Google user info using access token
     */
    public JsonNode fetchGoogleUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);

        HttpEntity<Void> request = new HttpEntity<>(headers);
        ResponseEntity<String> response = restTemplate.exchange(
                googleUserinfoUrl, HttpMethod.GET, request, String.class);

        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            log.error("Failed to parse Google userinfo response", e);
            throw new RuntimeException("Failed to parse Google userinfo response");
        }
    }

    /**
     * Process Google OAuth2 user: find or create user, then generate JWT tokens
     */
    @Transactional
    public TokenDTO processGoogleUser(JsonNode googleUser, HttpServletRequest request) {
        String email = googleUser.get("email").asText();
        String name = googleUser.has("name") ? googleUser.get("name").asText() : email;
        String picture = googleUser.has("picture") ? googleUser.get("picture").asText() : null;
        String googleId = googleUser.get("sub").asText();

        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        // Step 1: Find by auth_provider + auth_provider_id (returning user)
        User user = userRepository.findByAuthProviderAndAuthProviderId("GOOGLE", googleId).orElse(null);

        if (user == null) {
            // Step 2: Find by email (link existing local account)
            user = userRepository.findByEmail(email).orElse(null);
        }

        if (user == null) {
            // Step 3: Create new user
            log.info("Creating new user from Google OAuth: {}", email);
            user = User.builder()
                    .email(email)
                    .fullName(name)
                    .avatarUrl(picture)
                    .authProvider("GOOGLE")
                    .authProviderId(googleId)
                    .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .isActive(true)
                    .isVerified(true)
                    .failedLoginCount(0)
                    .twoFactorEnabled(false)
                    .lastLogin(LocalDateTime.now())
                    .build();

            Role patientRole = roleRepository.findByName("PATIENT")
                    .orElseThrow(() -> new ResourceNotFoundException("Role PATIENT not found"));

            UserRole userRole = new UserRole();
            userRole.setRole(patientRole);
            user.addRole(userRole);

            user = userRepository.save(user);
            log.info("New Google user created: {} (ID: {})", email, user.getId());
        } else {
            // Existing user — update Google info if first time linking
            log.info("Existing user logging in via Google: {}", email);
            if (user.getAuthProvider() == null || "LOCAL".equals(user.getAuthProvider())) {
                user.setAuthProvider("GOOGLE");
                user.setAuthProviderId(googleId);
            }
            if (user.getAvatarUrl() == null && picture != null) {
                user.setAvatarUrl(picture);
            }
            if (user.getFullName() == null && name != null) {
                user.setFullName(name);
            }
            user.setLastLogin(LocalDateTime.now());
            user = userRepository.save(user);
        }

        // Activity log
        activityLoggingService.log(user, com.q2k.meditech.entity.enums.ActivityType.LOGIN,
                "Google OAuth2 login", ipAddress, userAgent);

        return generateTokens(user, "google-oauth", "Google OAuth Login", ipAddress, userAgent);
    }

    // ==================== Facebook OAuth2 Methods ====================

    /**
     * Build Facebook OAuth2 authorization URL for redirect
     */
    public String buildFacebookAuthorizationUrl() {
        return UriComponentsBuilder.fromUriString(facebookAuthUrl)
                .queryParam("client_id", facebookAppId)
                .queryParam("redirect_uri", facebookRedirectUri)
                .queryParam("scope", facebookScope)
                .queryParam("response_type", "code")
                .build()
                .toUriString();
    }

    /**
     * Exchange Facebook authorization code for access token
     */
    public JsonNode exchangeFacebookCode(String code) {
        String url = UriComponentsBuilder.fromUriString(facebookTokenUrl)
                .queryParam("client_id", facebookAppId)
                .queryParam("client_secret", facebookAppSecret)
                .queryParam("code", code)
                .queryParam("redirect_uri", facebookRedirectUri)
                .build()
                .toUriString();

        ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

        try {
            return objectMapper.readTree(response.getBody());
        } catch (Exception e) {
            log.error("Failed to parse Facebook token response", e);
            throw new RuntimeException("Failed to parse Facebook token response");
        }
    }

    /**
     * Fetch Facebook user info using access token
     */
    public JsonNode fetchFacebookUserInfo(String accessToken) {
        String url = facebookUserinfoUrl + "&access_token=" + accessToken;

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return objectMapper.readTree(response.getBody());
        } catch (HttpClientErrorException e) {
            log.warn("Facebook API error when fetching user info: {}", e.getResponseBodyAsString());
            try {
                JsonNode errorBody = objectMapper.readTree(e.getResponseBodyAsString());
                if (errorBody.has("error")) {
                    JsonNode error = errorBody.get("error");
                    int subCode = error.has("error_subcode") ? error.get("error_subcode").asInt() : 0;
                    // Subcode 1351040: account has no valid email — retry without email field
                    if (subCode == 1351040) {
                        log.info("Facebook account has no verified email, retrying without email field");
                        String fallbackUrl = "https://graph.facebook.com/v19.0/me?fields=id,name,picture.type(large)&access_token=" + accessToken;
                        ResponseEntity<String> fallbackResponse = restTemplate.getForEntity(fallbackUrl, String.class);
                        return objectMapper.readTree(fallbackResponse.getBody());
                    }
                    String msg = error.has("error_user_msg") ? error.get("error_user_msg").asText() : error.get("message").asText();
                    throw new BadRequestException("Facebook login failed: " + msg);
                }
            } catch (BadRequestException bre) {
                throw bre;
            } catch (Exception parseEx) {
                log.error("Failed to parse Facebook error response", parseEx);
            }
            throw new BadRequestException("Failed to retrieve user information from Facebook. Please try again.");
        } catch (Exception e) {
            log.error("Failed to fetch Facebook userinfo", e);
            throw new RuntimeException("Failed to fetch Facebook userinfo");
        }
    }

    /**
     * Process Facebook OAuth2 user: find or create user, then generate JWT tokens
     */
    @Transactional
    public TokenDTO processFacebookUser(JsonNode fbUser, HttpServletRequest request) {
        String facebookId = fbUser.get("id").asText();
        String name = fbUser.has("name") ? fbUser.get("name").asText() : null;
        String email = fbUser.has("email") ? fbUser.get("email").asText() : null;
        String picture = null;
        if (fbUser.has("picture") && fbUser.get("picture").has("data")
                && fbUser.get("picture").get("data").has("url")) {
            picture = fbUser.get("picture").get("data").get("url").asText();
            if (picture.length() > 2048) {
                picture = null;
            }
        }

        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        // Step 1: Find by auth_provider + auth_provider_id (returning user)
        User user = userRepository.findByAuthProviderAndAuthProviderId("FACEBOOK", facebookId).orElse(null);

        if (user == null && email != null) {
            // Step 2: Find by real email (link existing local account)
            user = userRepository.findByEmail(email).orElse(null);
        }

        if (user == null) {
            // Step 3: Create new user — use real email if available, otherwise generate placeholder
            String userEmail = (email != null) ? email : (facebookId + "@facebook.com");
            log.info("Creating new user from Facebook OAuth: {}", userEmail);
            user = User.builder()
                    .email(userEmail)
                    .fullName(name)
                    .avatarUrl(picture)
                    .authProvider("FACEBOOK")
                    .authProviderId(facebookId)
                    .passwordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .isActive(true)
                    .isVerified(true)
                    .failedLoginCount(0)
                    .twoFactorEnabled(false)
                    .lastLogin(LocalDateTime.now())
                    .build();

            Role patientRole = roleRepository.findByName("PATIENT")
                    .orElseThrow(() -> new ResourceNotFoundException("Role PATIENT not found"));

            UserRole userRole = new UserRole();
            userRole.setRole(patientRole);
            user.addRole(userRole);

            user = userRepository.save(user);
            log.info("New Facebook user created: {} (ID: {})", userEmail, user.getId());
        } else {
            log.info("Existing user logging in via Facebook: {}", user.getEmail());
            if (user.getAuthProvider() == null || "LOCAL".equals(user.getAuthProvider())) {
                user.setAuthProvider("FACEBOOK");
                user.setAuthProviderId(facebookId);
            }
            if (user.getAvatarUrl() == null && picture != null) {
                user.setAvatarUrl(picture);
            }
            if (user.getFullName() == null && name != null) {
                user.setFullName(name);
            }
            user.setLastLogin(LocalDateTime.now());
            user = userRepository.save(user);
        }

        activityLoggingService.log(user, com.q2k.meditech.entity.enums.ActivityType.LOGIN,
                "Facebook OAuth2 login", ipAddress, userAgent);

        return generateTokens(user, "facebook-oauth", "Facebook OAuth Login", ipAddress, userAgent);
    }
}
