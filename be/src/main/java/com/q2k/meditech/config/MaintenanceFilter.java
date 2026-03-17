package com.q2k.meditech.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.service.MaintenanceService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * Maintenance Mode Filter
 * Blocks all requests when maintenance mode is active,
 * except for allowed paths and admin users.
 *
 * This filter runs AFTER JWT authentication so we can check roles.
 */
@Component
@Slf4j
public class MaintenanceFilter extends OncePerRequestFilter {

    @Autowired
    @Lazy
    private MaintenanceService maintenanceService;

    @Value("${app.maintenance.allowed-paths:/auth/**,/public/**,/swagger-ui/**,/v3/api-docs/**,/admin/maintenance/**}")
    private String allowedPathsConfig;

    @Value("${app.maintenance.allowed-roles:ADMIN}")
    private String allowedRolesConfig;

    @Value("${app.maintenance.message:System is under maintenance. Please try again later.}")
    private String maintenanceMessage;

    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // Check if maintenance mode is active
        if (!maintenanceService.isMaintenanceActive()) {
            filterChain.doFilter(request, response);
            return;
        }

        String requestPath = request.getRequestURI();
        // Remove context-path prefix (/api) for matching
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && requestPath.startsWith(contextPath)) {
            requestPath = requestPath.substring(contextPath.length());
        }

        // Check if path is allowed during maintenance
        if (isPathAllowed(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check if user has an allowed role (e.g., ADMIN)
        if (hasAllowedRole()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Block the request - maintenance mode is active
        log.warn("Request blocked by maintenance mode: {} {}", request.getMethod(), request.getRequestURI());

        response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> body = Map.of(
                "status", 503,
                "error", "Service Unavailable",
                "message", maintenanceMessage,
                "maintenance", true
        );

        new ObjectMapper().writeValue(response.getOutputStream(), body);
    }

    /**
     * Check if the request path is in the allowed list
     */
    private boolean isPathAllowed(String requestPath) {
        List<String> allowedPaths = Arrays.asList(allowedPathsConfig.split(","));
        return allowedPaths.stream()
                .map(String::trim)
                .anyMatch(pattern -> pathMatcher.match(pattern, requestPath));
    }

    /**
     * Check if the current authenticated user has an allowed role
     */
    private boolean hasAllowedRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        List<String> allowedRoles = Arrays.asList(allowedRolesConfig.split(","));
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> allowedRoles.stream()
                        .map(role -> "ROLE_" + role.trim())
                        .anyMatch(authority::equals));
    }
}
