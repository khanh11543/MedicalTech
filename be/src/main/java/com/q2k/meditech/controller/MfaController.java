package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.auth.EmailBackupCodesRequestDTO;
import com.q2k.meditech.dto.auth.MfaDisableRequestDTO;
import com.q2k.meditech.dto.auth.MfaEnableRequestDTO;
import com.q2k.meditech.dto.auth.MfaEnableResponseDTO;
import com.q2k.meditech.dto.auth.MfaSetupResponseDTO;
import com.q2k.meditech.service.EmailService;
import com.q2k.meditech.service.MfaService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/me/mfa")
@RequiredArgsConstructor
@Tag(name = "MFA (Authenticator)", description = "MFA settings using Authenticator (TOTP) for PATIENT, ADMIN, DOCTOR, RECEPTIONIST")
public class MfaController {

    private final MfaService mfaService;
    private final EmailService emailService;

    /** Any authenticated user can set up MFA (PATIENT, ADMIN, DOCTOR, RECEPTIONIST). */
    @PostMapping("/setup")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    @Operation(summary = "Start Authenticator setup", description = "Generate a new Authenticator secret and return otpauth URL for QR")
    public ResponseEntity<MfaSetupResponseDTO> setup() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(mfaService.setupAuthenticator(userId));
    }

    @PostMapping("/enable")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    @Operation(summary = "Enable Authenticator MFA", description = "Confirm Authenticator code and enable MFA, returning backup codes once")
    public ResponseEntity<MfaEnableResponseDTO> enable(@Valid @RequestBody MfaEnableRequestDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(mfaService.enableAuthenticator(userId, dto));
    }

    @PostMapping("/disable")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    @Operation(summary = "Disable Authenticator MFA", description = "Disable MFA after verifying current Authenticator code")
    public ResponseEntity<MessageDTO> disable(@Valid @RequestBody MfaDisableRequestDTO dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        mfaService.disableAuthenticator(userId, dto);
        return ResponseEntity.ok(MessageDTO.success("Two-factor authentication disabled"));
    }

    @PostMapping("/email-backup-codes")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN', 'DOCTOR', 'RECEPTIONIST')")
    @Operation(summary = "Email backup codes", description = "Send the provided backup codes to the current user's email")
    public ResponseEntity<MessageDTO> emailBackupCodes(@Valid @RequestBody EmailBackupCodesRequestDTO dto) {
        String email = SecurityUtil.getCurrentUsername();
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(MessageDTO.error("User email not found"));
        }
        emailService.sendBackupCodesEmail(email, dto.getBackupCodes());
        return ResponseEntity.ok(MessageDTO.success("Backup codes sent to your email"));
    }
}

