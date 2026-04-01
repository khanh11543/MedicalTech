package com.q2k.meditech.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.UserDTO;
import com.q2k.meditech.dto.auth.*;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

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

    @Value("${frontend.url}")
    private String frontendUrl;

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
    public ResponseEntity<LoginResponseDTO> login(
            @Valid @RequestBody LoginDTO loginDTO,
            HttpServletRequest request) {
        log.info("Login request for email: {}", loginDTO.getEmail());
        LoginResponseDTO loginResponse = authService.login(loginDTO, request);
        return ResponseEntity.ok(loginResponse);
    }

    /**
     * Complete login with Authenticator code (MFA)
     * POST /api/auth/mfa/verify-login
     */
    @PostMapping("/mfa/verify-login")
    @Operation(summary = "Verify MFA to complete login",
            description = "Verify Authenticator (TOTP) code using the short-lived mfaToken returned from /auth/login")
    public ResponseEntity<TokenDTO> verifyMfaLogin(
            @Valid @RequestBody MfaVerifyLoginDTO dto,
            HttpServletRequest request
    ) {
        TokenDTO tokenDTO = authService.verifyMfaLogin(dto, request);
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

    // ==================== Google OAuth2 Endpoints ====================

    /**
     * Redirect user to Google login page
     * GET /api/auth/google/login
     */
    @GetMapping("/google/login")
    @Operation(summary = "Initiate Google OAuth2 login",
               description = "Redirects user to Google consent screen. Optional redirect_uri=medicalapp://... (allowed schemes) encodes app return target.")
    public void redirectToGoogle(
            @RequestParam(value = "redirect_uri", required = false) String redirectUri,
            HttpServletResponse response) throws IOException {
        String state = null;
        if (redirectUri != null && authService.isAllowedAppOAuthRedirect(redirectUri)) {
            state = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(redirectUri.getBytes(StandardCharsets.UTF_8));
        }
        String authorizationUrl = authService.buildGoogleAuthorizationUrl(state);
        log.info("Redirecting to Google OAuth2");
        response.sendRedirect(authorizationUrl);
    }

    /**
     * Google OAuth2 callback — exchange code, fetch user, create JWT, redirect to React
     * GET /api/auth/google/callback?code=xxxxx
     */
    @GetMapping("/google/callback")
    @Operation(summary = "Google OAuth2 callback",
               description = "Handles Google redirect with authorization code, exchanges for tokens")
    public void googleCallback(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "state", required = false) String state,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        if (error != null || code == null) {
            log.warn("Google OAuth2 error or denied: {}", error);
            response.sendRedirect(frontendUrl + "/signin?error=" +
                    URLEncoder.encode("Google login was cancelled or failed", StandardCharsets.UTF_8));
            return;
        }

        try {
            // Exchange code for Google access token
            JsonNode googleTokens = authService.exchangeGoogleCode(code);
            String googleAccessToken = googleTokens.get("access_token").asText();

            // Fetch Google user info
            JsonNode googleUser = authService.fetchGoogleUserInfo(googleAccessToken);
            log.info("Google user info received for: {}", googleUser.get("email").asText());

            // Login or register user, generate JWT
            TokenDTO tokenDTO = authService.processGoogleUser(googleUser, request);

            String successBase = resolveOAuthSuccessBase(state);
            String redirectUrl = buildOAuthTokenRedirect(successBase, tokenDTO);
            response.sendRedirect(redirectUrl);

        } catch (Exception e) {
            log.error("Google OAuth2 callback error: {}", e.getMessage(), e);
            response.sendRedirect(frontendUrl + "/signin?error=" +
                    URLEncoder.encode("Google login failed. Please try again.", StandardCharsets.UTF_8));
        }
    }

    private String resolveOAuthSuccessBase(String googleStateParam) {
        if (googleStateParam == null || googleStateParam.isBlank()) {
            return frontendUrl + "/oauth-success";
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(googleStateParam);
            String uri = new String(decoded, StandardCharsets.UTF_8).trim();
            if (authService.isAllowedAppOAuthRedirect(uri)) {
                int hash = uri.indexOf('#');
                return hash >= 0 ? uri.substring(0, hash) : uri;
            }
        } catch (Exception e) {
            log.debug("Invalid Google OAuth state ignored: {}", e.getMessage());
        }
        return frontendUrl + "/oauth-success";
    }

    private String decodeAppRedirectFromState(String stateParam) {
        if (stateParam == null || stateParam.isBlank()) {
            return null;
        }
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(stateParam);
            String uri = new String(decoded, StandardCharsets.UTF_8).trim();
            if (authService.isAllowedAppOAuthRedirect(uri)) {
                int hash = uri.indexOf('#');
                return hash >= 0 ? uri.substring(0, hash) : uri;
            }
        } catch (Exception e) {
            log.debug("Invalid OAuth state: {}", e.getMessage());
        }
        return null;
    }

    private String buildOAuthTokenRedirect(String successBase, TokenDTO tokenDTO) {
        String rolesParam = "";
        if (tokenDTO.getRoles() != null && !tokenDTO.getRoles().isEmpty()) {
            rolesParam = String.join(",", tokenDTO.getRoles());
        }
        return UriComponentsBuilder.fromUriString(successBase)
                .queryParam("accessToken", tokenDTO.getAccessToken())
                .queryParam("refreshToken", tokenDTO.getRefreshToken())
                .queryParam("userId", tokenDTO.getUserId())
                .queryParam("email", tokenDTO.getEmail())
                .queryParam("roles", rolesParam)
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUriString();
    }

    // ==================== Facebook OAuth2 Endpoints ====================

    /**
     * Redirect user to Facebook login page
     * GET /api/auth/facebook/login
     */
    @GetMapping("/facebook/login")
    @Operation(summary = "Initiate Facebook OAuth2 login",
               description = "Redirects user to Facebook. Optional redirect_uri for mobile (requires facebook.oauth2.redirect-uri-mobile).")
    public void redirectToFacebook(
            @RequestParam(value = "redirect_uri", required = false) String redirectUri,
            HttpServletResponse response) throws IOException {
        if (redirectUri != null && authService.isAllowedAppOAuthRedirect(redirectUri)
                && authService.isFacebookMobileOAuthConfigured()) {
            String state = Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(redirectUri.getBytes(StandardCharsets.UTF_8));
            String authorizationUrl = authService.buildFacebookAuthorizationUrl(
                    authService.getFacebookRedirectUriMobile(), state);
            log.info("Redirecting to Facebook OAuth2 (mobile)");
            response.sendRedirect(authorizationUrl);
            return;
        }
        String authorizationUrl = authService.buildFacebookAuthorizationUrl();
        log.info("Redirecting to Facebook OAuth2");
        response.sendRedirect(authorizationUrl);
    }

    /**
     * Facebook mobile redirect target — must be listed in Facebook app "Valid OAuth Redirect URIs".
     * GET /api/auth/facebook/callback/mobile?code=...
     */
    @GetMapping("/facebook/callback/mobile")
    @Operation(summary = "Facebook OAuth2 callback for mobile app")
    public void facebookCallbackMobile(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "state", required = false) String state,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        if (!authService.isFacebookMobileOAuthConfigured()) {
            response.sendRedirect(frontendUrl + "/signin?error="
                    + URLEncoder.encode("Facebook mobile login is not configured on the server.", StandardCharsets.UTF_8));
            return;
        }

        if (error != null || code == null) {
            log.warn("Facebook mobile OAuth error or denied: {}", error);
            response.sendRedirect(frontendUrl + "/signin?error="
                    + URLEncoder.encode("Facebook login was cancelled or failed.", StandardCharsets.UTF_8));
            return;
        }

        try {
            JsonNode fbTokens = authService.exchangeFacebookCode(code, authService.getFacebookRedirectUriMobile());
            String fbAccessToken = fbTokens.get("access_token").asText();
            JsonNode fbUser = authService.fetchFacebookUserInfo(fbAccessToken);
            log.info("Facebook user info received for: {}",
                    fbUser.has("email") ? fbUser.get("email").asText() : fbUser.get("id").asText());
            TokenDTO tokenDTO = authService.processFacebookUser(fbUser, request);

            String appBase = decodeAppRedirectFromState(state);
            if (appBase == null) {
                response.sendRedirect(frontendUrl + "/signin?error="
                        + URLEncoder.encode("Invalid Facebook login state.", StandardCharsets.UTF_8));
                return;
            }
            response.sendRedirect(buildOAuthTokenRedirect(appBase, tokenDTO));
        } catch (Exception e) {
            log.error("Facebook mobile OAuth error: {}", e.getMessage(), e);
            response.sendRedirect(frontendUrl + "/signin?error="
                    + URLEncoder.encode("Facebook login failed. Please try again.", StandardCharsets.UTF_8));
        }
    }

    /**
     * Facebook OAuth2 callback — React sends the authorization code, backend exchanges for tokens
     * POST /api/auth/facebook/callback
     */
    @PostMapping("/facebook/callback")
    @Operation(summary = "Facebook OAuth2 callback",
               description = "Receives authorization code from React, exchanges for tokens and returns JWT")
    public ResponseEntity<TokenDTO> facebookCallback(
            @RequestBody java.util.Map<String, String> body,
            HttpServletRequest request) {

        String code = body.get("code");
        if (code == null || code.isBlank()) {
            throw new BadRequestException("Authorization code is required");
        }

        // Exchange code for Facebook access token
        JsonNode fbTokens = authService.exchangeFacebookCode(code);
        String fbAccessToken = fbTokens.get("access_token").asText();

        // Fetch Facebook user info
        JsonNode fbUser = authService.fetchFacebookUserInfo(fbAccessToken);
        log.info("Facebook user info received for: {}", fbUser.has("email") ? fbUser.get("email").asText() : fbUser.get("id").asText());

        // Login or register user, generate JWT
        TokenDTO tokenDTO = authService.processFacebookUser(fbUser, request);

        return ResponseEntity.ok(tokenDTO);
    }
}
