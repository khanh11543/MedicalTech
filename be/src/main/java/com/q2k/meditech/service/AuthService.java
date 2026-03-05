package com.q2k.meditech.service;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.UserDTO;
import com.q2k.meditech.dto.auth.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.VerificationStatus;
import com.q2k.meditech.exception.*;
import com.q2k.meditech.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    @Value("${app.account-lock-duration:30}") // minutes
    private int accountLockDuration;

    @Value("${app.max-failed-attempts:5}")
    private int maxFailedAttempts;

    @Value("${app.otp-expiry-minutes:15}")
    private int otpExpiryMinutes;

    @Value("${app.reset-token-expiry-minutes:60}")
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
    @Transactional
    public TokenDTO login(LoginDTO loginDTO, HttpServletRequest request) {
        String ipAddress = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        User user = userRepository.findByEmail(loginDTO.getEmail())
            .orElse(null);

        try {
            // Check if user exists
            if (user == null) {
                recordLoginAttempt(null, loginDTO.getEmail(), false, 
                    "User not found", ipAddress, userAgent);
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

            // Verify password
            if (!passwordEncoder.matches(loginDTO.getPassword(), user.getPasswordHash())) {
                handleFailedLogin(user, loginDTO.getEmail(), ipAddress, userAgent);
                throw new BadCredentialsException("Invalid email or password");
            }

            // Reset failed attempts on successful login
            user.setFailedLoginCount(0);
            user.setLockedUntil(null);
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            // Record successful login
            recordLoginAttempt(user, loginDTO.getEmail(), true, null, ipAddress, userAgent);

            // Activity log
            activityLoggingService.log(user, com.q2k.meditech.entity.enums.ActivityType.LOGIN,
                    "User logged in", ipAddress, userAgent);

            // Generate tokens
            return generateTokens(user, loginDTO.getDeviceId(), loginDTO.getDeviceName(), 
                ipAddress, userAgent);

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
     * Forgot password - send reset token
     */
    @Transactional
    public MessageDTO forgotPassword(ForgotPasswordDTO forgotPasswordDTO, HttpServletRequest request) {
        User user = userRepository.findByEmail(forgotPasswordDTO.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Generate reset token
        String resetToken = generateSecureToken();
        user.setResetToken(hashToken(resetToken));
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(resetTokenExpiryMinutes));
        user.setResetTokenUsedAt(null);
        userRepository.save(user);

        // Send email
        emailService.sendResetPasswordEmail(user.getEmail(), resetToken);

        return MessageDTO.success("Password reset instructions sent to your email");
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
        user.setFailedLoginCount(user.getFailedLoginCount() + 1);

        if (user.getFailedLoginCount() >= maxFailedAttempts) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(accountLockDuration));
            emailService.sendAccountLockedEmail(user.getEmail());
        }

        userRepository.save(user);
        recordLoginAttempt(user, email, false, "Invalid password", ipAddress, userAgent);
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
        return Base64.getEncoder().encodeToString(
            passwordEncoder.encode(token).getBytes());
    }

    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
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

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
