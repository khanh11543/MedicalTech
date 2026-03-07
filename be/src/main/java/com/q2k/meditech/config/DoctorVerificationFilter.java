package com.q2k.meditech.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.enums.VerificationStatus;
import com.q2k.meditech.repository.DoctorRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Doctor Verification Filter
 * Blocks non-verified doctors from accessing clinical endpoints.
 * Runs AFTER JWT authentication and MaintenanceFilter.
 *
 * Allowed paths (accessible to ALL doctors regardless of verification status):
 * - /doctor/profile/** (profile setup & view)
 * - /doctor/documents/** (document upload & management)
 * - /doctor/support/** (support page)
 *
 * Blocked paths (require VERIFIED or APPROVED status):
 * - All other /doctor/** endpoints (dashboard, appointments, prescriptions, etc.)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DoctorVerificationFilter extends OncePerRequestFilter {

    private final DoctorRepository doctorRepository;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final List<String> ALLOWED_PATHS = List.of(
            "/doctor/profile",
            "/doctor/profile/**",
            "/doctor/documents",
            "/doctor/documents/**",
            "/doctor/support",
            "/doctor/support/**"
    );

    private static final Set<VerificationStatus> ALLOWED_STATUSES = Set.of(
            VerificationStatus.VERIFIED,
            VerificationStatus.APPROVED
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        // Strip context path (e.g. /api) if present
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && path.startsWith(contextPath)) {
            path = path.substring(contextPath.length());
        }

        // Only apply to /doctor/** paths
        if (!path.startsWith("/doctor/") && !path.equals("/doctor")) {
            return true;
        }

        // Allow-listed paths don't need verification check
        for (String allowedPath : ALLOWED_PATHS) {
            if (pathMatcher.match(allowedPath, path)) {
                return true;
            }
        }

        return false;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check if the user has DOCTOR role
        boolean isDoctorRole = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_DOCTOR"));

        if (!isDoctorRole) {
            filterChain.doFilter(request, response);
            return;
        }

        // Get user ID from the principal
        Object principal = authentication.getPrincipal();
        Long userId = null;
        if (principal instanceof com.q2k.meditech.entity.User) {
            userId = ((com.q2k.meditech.entity.User) principal).getId();
        }

        if (userId == null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Look up the doctor and check verification status
        Optional<Doctor> doctorOpt = doctorRepository.findByUserId(userId);
        if (doctorOpt.isEmpty()) {
            sendForbidden(response, "Doctor profile not found. Please complete your profile setup.");
            return;
        }

        Doctor doctor = doctorOpt.get();
        VerificationStatus status = doctor.getVerificationStatus();

        if (!ALLOWED_STATUSES.contains(status)) {
            String message = switch (status) {
                case AWAITING_DOCUMENTS -> "Your profile is incomplete. Please complete your profile and submit documents for verification.";
                case PENDING -> "Your verification is pending review. Please wait for admin approval.";
                case REJECTED -> "Your verification was rejected. Please review feedback and resubmit.";
                case SUSPENDED -> "Your account has been suspended. Please contact support.";
                case REVOKED -> "Your verification has been revoked. Please contact support.";
                default -> "Your account is not verified. Please complete the verification process.";
            };

            log.warn("Doctor userId={} blocked from {} — status={}", userId, request.getRequestURI(), status);
            sendForbidden(response, message);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void sendForbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        new ObjectMapper().writeValue(response.getOutputStream(),
                Map.of(
                        "status", 403,
                        "error", "Doctor Not Verified",
                        "message", message,
                        "code", "DOCTOR_NOT_VERIFIED"
                ));
    }
}
