package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.UserDTO;
import com.q2k.meditech.dto.auth.*;
import com.q2k.meditech.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * Handles all authentication endpoints
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Authentication management APIs")
public class AuthController {

    private final AuthService authService;

    /**
     * Register new patient account
     * POST /api/auth/register
     */
    @PostMapping("/register")
    @Operation(summary = "Register new patient account", 
               description = "Create a new patient account and send OTP to email for verification")
    public ResponseEntity<UserDTO> register(
            @Valid @RequestBody RegisterDTO registerDTO,
            HttpServletRequest request) {
        log.info("Registration request for email: {}", registerDTO.getEmail());
        UserDTO userDTO = authService.register(registerDTO, request);
        return new ResponseEntity<>(userDTO, HttpStatus.CREATED);
    }

    /**
     * Verify email with OTP
     * POST /api/auth/verify-email
     */
    @PostMapping("/verify-email")
    @Operation(summary = "Verify email with OTP", 
               description = "Verify email address using OTP code sent to email")
    public ResponseEntity<MessageDTO> verifyEmail(
            @Valid @RequestBody VerifyOtpDTO verifyOtpDTO) {
        log.info("Email verification request for: {}", verifyOtpDTO.getEmail());
        MessageDTO response = authService.verifyEmail(verifyOtpDTO);
        return ResponseEntity.ok(response);
    }

    /**
     * Resend OTP
     * POST /api/auth/resend-otp
     */
    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP verification code",
               description = "Resend a new OTP code to the email for verification")
    public ResponseEntity<MessageDTO> resendOtp(
            @RequestBody java.util.Map<String, String> body,
            HttpServletRequest request) {
        String email = body.get("email");
        log.info("Resend OTP request for: {}", email);
        MessageDTO response = authService.resendOtp(email, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Login
     * POST /api/auth/login
     */
    @PostMapping("/login")
    @Operation(summary = "Login", 
               description = "Authenticate user and return access token and refresh token")
    public ResponseEntity<TokenDTO> login(
            @Valid @RequestBody LoginDTO loginDTO,
            HttpServletRequest request) {
        log.info("Login request for email: {}", loginDTO.getEmail());
        TokenDTO tokenDTO = authService.login(loginDTO, request);
        return ResponseEntity.ok(tokenDTO);
    }

    /**
     * Refresh token
     * POST /api/auth/refresh
     */
    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", 
               description = "Get new access token using refresh token (token rotation)")
    public ResponseEntity<TokenDTO> refresh(
            @Valid @RequestBody RefreshDTO refreshDTO,
            HttpServletRequest request) {
        log.info("Token refresh request");
        TokenDTO tokenDTO = authService.refresh(refreshDTO, request);
        return ResponseEntity.ok(tokenDTO);
    }

    /**
     * Logout
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    @Operation(summary = "Logout", 
               description = "Revoke current session and invalidate tokens")
    public ResponseEntity<MessageDTO> logout(HttpServletRequest request) {
        log.info("Logout request");
        MessageDTO response = authService.logout(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Verify account by token link (for admin-created accounts)
     * GET /api/auth/verify-account?token=xxx
     */
    @GetMapping("/verify-account")
    @Operation(summary = "Verify account by token link",
               description = "Verify email via a link sent to admin-created accounts")
    public ResponseEntity<MessageDTO> verifyAccountByToken(@RequestParam String token) {
        log.info("Account verification by token link");
        MessageDTO response = authService.verifyAccountByToken(token);
        return ResponseEntity.ok(response);
    }

    /**
     * Change password
     * POST /api/auth/change-password
     */
    @PostMapping("/change-password")
    @Operation(summary = "Change password", 
               description = "Change password for authenticated user")
    public ResponseEntity<MessageDTO> changePassword(
            @Valid @RequestBody ChangePasswordDTO changePasswordDTO,
            HttpServletRequest request) {
        log.info("Change password request");
        MessageDTO response = authService.changePassword(changePasswordDTO, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Forgot password
     * POST /api/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot password", 
               description = "Send password reset token to email")
    public ResponseEntity<MessageDTO> forgotPassword(
            @Valid @RequestBody ForgotPasswordDTO forgotPasswordDTO,
            HttpServletRequest request) {
        log.info("Forgot password request for email: {}", forgotPasswordDTO.getEmail());
        MessageDTO response = authService.forgotPassword(forgotPasswordDTO, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Reset password
     * POST /api/auth/reset-password
     */
    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", 
               description = "Reset password using reset token from email")
    public ResponseEntity<MessageDTO> resetPassword(
            @Valid @RequestBody ResetPasswordDTO resetPasswordDTO) {
        log.info("Reset password request for email: {}", resetPasswordDTO.getEmail());
        MessageDTO response = authService.resetPassword(resetPasswordDTO);
        return ResponseEntity.ok(response);
    }
}
