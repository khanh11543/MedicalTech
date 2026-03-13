package com.q2k.meditech.util;

import org.apache.commons.codec.binary.Base32;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * Minimal RFC 6238 TOTP implementation (6 digits, 30s step, HmacSHA1).
 * Used for Authenticator-based MFA.
 */
public final class TotpUtil {

    private TotpUtil() {}

    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base32 base32 = new Base32();

    public static String generateBase32Secret(int numBytes) {
        byte[] bytes = new byte[numBytes];
        secureRandom.nextBytes(bytes);
        // Commons-codec Base32 produces upper-case by default; strip padding for otpauth compatibility.
        return base32.encodeToString(bytes).replace("=", "");
    }

    public static boolean verifyTotpCode(String base32Secret, String code, int allowedTimeStepWindow) {
        if (base32Secret == null || base32Secret.isBlank() || code == null) return false;
        String normalized = code.trim();
        if (!normalized.matches("^[0-9]{6}$")) return false;

        long nowStep = Instant.now().getEpochSecond() / 30L;
        for (int i = -allowedTimeStepWindow; i <= allowedTimeStepWindow; i++) {
            String candidate = generateTotp(base32Secret, nowStep + i);
            if (normalized.equals(candidate)) return true;
        }
        return false;
    }

    private static String generateTotp(String base32Secret, long timeStep) {
        try {
            byte[] key = base32.decode(base32Secret);
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));

            byte[] msg = ByteBuffer.allocate(8).putLong(timeStep).array();
            byte[] hash = mac.doFinal(msg);

            int offset = hash[hash.length - 1] & 0x0F;
            int binary =
                    ((hash[offset] & 0x7F) << 24) |
                    ((hash[offset + 1] & 0xFF) << 16) |
                    ((hash[offset + 2] & 0xFF) << 8) |
                    (hash[offset + 3] & 0xFF);

            int otp = binary % 1_000_000;
            return String.format("%06d", otp);
        } catch (Exception e) {
            return null;
        }
    }
}

