package com.q2k.meditech.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * IP-based login rate limiter (Layer 2)
 * Tracks failed login attempts per IP address in-memory.
 * Blocks an IP for a configurable duration after too many failures.
 */
@Service
@Slf4j
public class LoginRateLimiterService {

    @Value("${app.ip-max-failed-attempts:10}")
    private int ipMaxFailedAttempts;

    @Value("${app.ip-block-duration:5}") // minutes
    private int ipBlockDuration;

    @Value("${app.ip-fail-window:5}") // minutes
    private int ipFailWindow;

    private final ConcurrentHashMap<String, IpAttemptInfo> ipAttempts = new ConcurrentHashMap<>();

    /**
     * Check if an IP is currently blocked.
     * @return true if blocked
     */
    public boolean isIpBlocked(String ip) {
        IpAttemptInfo info = ipAttempts.get(ip);
        if (info == null) return false;

        if (info.blockedUntil != null && info.blockedUntil.isAfter(LocalDateTime.now())) {
            return true;
        }

        // Block expired — reset
        if (info.blockedUntil != null) {
            ipAttempts.remove(ip);
        }
        return false;
    }

    /**
     * Get the time when the IP block expires.
     */
    public LocalDateTime getBlockedUntil(String ip) {
        IpAttemptInfo info = ipAttempts.get(ip);
        return (info != null) ? info.blockedUntil : null;
    }

    /**
     * Record a failed login attempt from an IP.
     */
    public void recordFailedAttempt(String ip) {
        ipAttempts.compute(ip, (key, info) -> {
            LocalDateTime now = LocalDateTime.now();

            if (info == null) {
                info = new IpAttemptInfo();
                info.failCount = 1;
                info.windowStart = now;
                return info;
            }

            // If outside the fail window, reset counter
            if (info.windowStart.plusMinutes(ipFailWindow).isBefore(now)) {
                info.failCount = 1;
                info.windowStart = now;
                info.blockedUntil = null;
                return info;
            }

            info.failCount++;

            if (info.failCount >= ipMaxFailedAttempts) {
                info.blockedUntil = now.plusMinutes(ipBlockDuration);
                log.warn("IP {} blocked for {} minutes after {} failed login attempts",
                        ip, ipBlockDuration, info.failCount);
            }

            return info;
        });
    }

    /**
     * Reset failed attempts for an IP on successful login.
     */
    public void resetIp(String ip) {
        ipAttempts.remove(ip);
    }

    private static class IpAttemptInfo {
        int failCount;
        LocalDateTime windowStart;
        LocalDateTime blockedUntil;
    }
}
