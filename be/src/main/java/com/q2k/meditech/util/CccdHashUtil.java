package com.q2k.meditech.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/**
 * Utility to hash CCCD/CMND for storage. Only hash is stored; last 4 digits kept for display (e.g. ****1234).
 */
public final class CccdHashUtil {

    private static final int LAST4_LEN = 4;

    private CccdHashUtil() {}

    /**
     * SHA-256 hash of the given CCCD string (trimmed). Returns 64-char hex string.
     */
    public static String hash(String plainCccd) {
        if (plainCccd == null || plainCccd.isBlank()) return null;
        String trimmed = plainCccd.trim();
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(trimmed.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    /**
     * Last 4 characters of CCCD for display masking (e.g. ****1234). Returns null if input null/blank or shorter than 4.
     */
    public static String last4(String plainCccd) {
        if (plainCccd == null || plainCccd.isBlank()) return null;
        String trimmed = plainCccd.trim();
        if (trimmed.length() < LAST4_LEN) return null;
        return trimmed.substring(trimmed.length() - LAST4_LEN);
    }

    /**
     * Whether the value in DB is a hash (64 hex chars), not legacy plain CCCD.
     */
    public static boolean isStoredHash(String stored) {
        if (stored == null || stored.length() != 64) return false;
        return stored.matches("[0-9a-fA-F]{64}");
    }
}
