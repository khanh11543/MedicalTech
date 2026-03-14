package com.q2k.meditech.service;

import com.q2k.meditech.dto.auth.MfaDisableRequestDTO;
import com.q2k.meditech.dto.auth.MfaEnableRequestDTO;
import com.q2k.meditech.dto.auth.MfaEnableResponseDTO;
import com.q2k.meditech.dto.auth.MfaSetupResponseDTO;
import com.q2k.meditech.entity.TwoFactorBackup;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.TwoFactorBackupRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.TotpUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MfaService {

    private final UserRepository userRepository;
    private final TwoFactorBackupRepository twoFactorBackupRepository;

    @Value("${app.mfa.issuer:MedicalTech}")
    private String issuer;

    /**
     * Allow some clock skew between server and phone.
     * Each step = 30 seconds. Default 10 steps = ±5 minutes.
     */
    @Value("${app.mfa.totp-window-steps:10}")
    private int totpWindowSteps;

    @Transactional
    public MfaSetupResponseDTO setupAuthenticator(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // If a secret already exists, reuse it to avoid mismatch between QR and verification code.
        // This also prevents accidentally disabling MFA by re-opening the setup screen.
        String secret = user.getTwoFactorSecret();
        if (secret == null || secret.isBlank()) {
            secret = TotpUtil.generateBase32Secret(20);
            user.setTwoFactorSecret(secret);
            // Keep current enabled state; enable happens only after confirmation endpoint.
            userRepository.save(user);
        }

        String otpauthUrl = buildOtpAuthUrl(issuer, user.getEmail(), secret);
        return MfaSetupResponseDTO.builder()
                .twoFactorEnabled(Boolean.TRUE.equals(user.getTwoFactorEnabled()))
                .issuer(issuer)
                .accountName(user.getEmail())
                .otpauthUrl(otpauthUrl)
                .build();
    }

    @Transactional
    public MfaEnableResponseDTO enableAuthenticator(Long userId, MfaEnableRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getTwoFactorSecret() == null || user.getTwoFactorSecret().isBlank()) {
            throw new BadRequestException("Authenticator is not set up yet. Please start setup first.");
        }

        boolean ok = TotpUtil.verifyTotpCode(user.getTwoFactorSecret(), dto.getCode(), totpWindowSteps);
        if (!ok) {
            throw new BadRequestException("Invalid Authenticator code");
        }

        user.setTwoFactorEnabled(true);
        userRepository.save(user);

        // Generate backup codes (return once)
        twoFactorBackupRepository.deleteByUser(user);
        List<String> backupCodes = generateBackupCodes(10);
        List<TwoFactorBackup> entities = new ArrayList<>();
        for (String code : backupCodes) {
            entities.add(TwoFactorBackup.builder()
                    .user(user)
                    .backupCodeHash(hash(code))
                    .usedAt(null)
                    .usedIpAddress(null)
                    .build());
        }
        twoFactorBackupRepository.saveAll(entities);

        return MfaEnableResponseDTO.builder()
                .twoFactorEnabled(true)
                .backupCodes(backupCodes)
                .build();
    }

    @Transactional
    public void disableAuthenticator(Long userId, MfaDisableRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!Boolean.TRUE.equals(user.getTwoFactorEnabled())) {
            // Idempotent
            user.setTwoFactorEnabled(false);
            user.setTwoFactorSecret(null);
            userRepository.save(user);
            twoFactorBackupRepository.deleteByUser(user);
            return;
        }

        if (user.getTwoFactorSecret() == null || user.getTwoFactorSecret().isBlank()) {
            throw new BadRequestException("Authenticator secret missing");
        }

        boolean ok = TotpUtil.verifyTotpCode(user.getTwoFactorSecret(), dto.getCode(), totpWindowSteps);
        if (!ok) {
            throw new BadRequestException("Invalid Authenticator code");
        }

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
        twoFactorBackupRepository.deleteByUser(user);
    }

    public boolean verifyAuthenticatorCode(User user, String code) {
        if (user == null) return false;
        if (!Boolean.TRUE.equals(user.getTwoFactorEnabled())) return true;
        if (user.getTwoFactorSecret() == null || user.getTwoFactorSecret().isBlank()) return false;
        return TotpUtil.verifyTotpCode(user.getTwoFactorSecret(), code, totpWindowSteps);
    }

    @Transactional
    public boolean tryUseBackupCode(User user, String backupCode, String ipAddress) {
        if (user == null || backupCode == null || backupCode.isBlank()) return false;
        var opt = twoFactorBackupRepository.findUnusedBackupCodeByHash(hash(backupCode.trim()));
        if (opt.isEmpty()) return false;
        TwoFactorBackup entity = opt.get();
        if (!entity.getUser().getId().equals(user.getId())) return false;
        entity.setUsedAt(LocalDateTime.now());
        entity.setUsedIpAddress(ipAddress);
        twoFactorBackupRepository.save(entity);
        return true;
    }

    private String buildOtpAuthUrl(String issuer, String accountName, String secret) {
        String label = urlEncode(issuer) + ":" + urlEncode(accountName);
        return "otpauth://totp/" + label +
                "?secret=" + urlEncode(secret) +
                "&issuer=" + urlEncode(issuer) +
                "&algorithm=SHA1&digits=6&period=30";
    }

    private String urlEncode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private List<String> generateBackupCodes(int count) {
        // 10 chars, easy-to-read alphabet (no 0/O, 1/I)
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        java.security.SecureRandom r = new java.security.SecureRandom();
        List<String> codes = new ArrayList<>(count);
        for (int i = 0; i < count; i++) {
            StringBuilder sb = new StringBuilder(10);
            for (int j = 0; j < 10; j++) {
                sb.append(chars.charAt(r.nextInt(chars.length())));
            }
            codes.add(sb.toString());
        }
        return codes;
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}

