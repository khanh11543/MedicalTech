package com.q2k.meditech.util;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

/**
 * Utility class for extracting information from HTTP requests.
 * Handles proxy headers for IP extraction, user-agent parsing, etc.
 */
@Slf4j
public final class HttpRequestUtil {

    private HttpRequestUtil() {
        // Utility class — no instantiation
    }

    /**
     * Extract the real client IP address from the HTTP request,
     * considering proxy/load-balancer headers.
     *
     * @param request the HTTP request
     * @return the client's IP address
     */
    public static String getClientIp(HttpServletRequest request) {
        if (request == null) return null;

        // Check common proxy headers in order of preference
        String[] headerNames = {
                "X-Forwarded-For",
                "X-Real-IP",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_X_FORWARDED_FOR",
                "HTTP_CLIENT_IP"
        };

        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
                // X-Forwarded-For may contain multiple IPs: client, proxy1, proxy2
                // The first one is the real client IP
                String clientIp = ip.split(",")[0].trim();
                log.trace("Client IP from header {}: {}", header, clientIp);
                return clientIp;
            }
        }

        String remoteAddr = request.getRemoteAddr();
        log.trace("Client IP from remoteAddr: {}", remoteAddr);
        return remoteAddr;
    }

    /**
     * Extract the User-Agent header from the request.
     *
     * @param request the HTTP request
     * @return the User-Agent string, or null if not present
     */
    public static String getUserAgent(HttpServletRequest request) {
        if (request == null) return null;
        return request.getHeader("User-Agent");
    }

    /**
     * Extract a simple device type from the User-Agent string.
     *
     * @param userAgent the User-Agent header value
     * @return "Mobile", "Tablet", or "Desktop"
     */
    public static String getDeviceType(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return "Unknown";

        String ua = userAgent.toLowerCase();
        if ((ua.contains("mobile") || ua.contains("android")) && !ua.contains("tablet")) {
            return "Mobile";
        }
        if (ua.contains("tablet") || ua.contains("ipad")) {
            return "Tablet";
        }
        return "Desktop";
    }

    /**
     * Extract browser name from User-Agent string.
     *
     * @param userAgent the User-Agent header value
     * @return browser name (Chrome, Firefox, Safari, Edge, Opera, or Unknown)
     */
    public static String getBrowserName(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return "Unknown";

        String ua = userAgent.toLowerCase();
        if (ua.contains("edg/") || ua.contains("edge/")) return "Edge";
        if (ua.contains("opr/") || ua.contains("opera")) return "Opera";
        if (ua.contains("chrome/") && !ua.contains("edg/")) return "Chrome";
        if (ua.contains("firefox/")) return "Firefox";
        if (ua.contains("safari/") && !ua.contains("chrome/")) return "Safari";
        if (ua.contains("msie") || ua.contains("trident/")) return "Internet Explorer";
        return "Unknown";
    }

    /**
     * Extract OS name from User-Agent string.
     *
     * @param userAgent the User-Agent header value
     * @return OS name (Windows, macOS, Linux, Android, iOS, or Unknown)
     */
    public static String getOsName(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) return "Unknown";

        String ua = userAgent.toLowerCase();
        if (ua.contains("windows")) return "Windows";
        if (ua.contains("mac os") || ua.contains("macintosh")) return "macOS";
        if (ua.contains("linux") && !ua.contains("android")) return "Linux";
        if (ua.contains("android")) return "Android";
        if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ipod")) return "iOS";
        return "Unknown";
    }

    /**
     * Get the full request URL including query string.
     *
     * @param request the HTTP request
     * @return the full URL
     */
    public static String getFullRequestUrl(HttpServletRequest request) {
        if (request == null) return null;
        String queryString = request.getQueryString();
        return queryString != null
                ? request.getRequestURI() + "?" + queryString
                : request.getRequestURI();
    }
}
