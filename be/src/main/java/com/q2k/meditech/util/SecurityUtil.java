package com.q2k.meditech.util;

import com.q2k.meditech.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Security Utility - Extract current user info from SecurityContext
 */
@Component
@Slf4j
public class SecurityUtil {

    private static UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        SecurityUtil.userRepository = userRepository;
    }

    /**
     * Get current user ID from SecurityContext
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            log.warn("No authenticated user in SecurityContext");
            return null;
        }

        // Assuming principal is User entity with getId()
        Object principal = authentication.getPrincipal();
        
        if (principal instanceof org.springframework.security.core.userdetails.User) {
            // If using Spring Security's default User, look up by username
            // The username matches the email prefix in our test data (e.g., "patient" -> "patient@test.com")
            String username = ((org.springframework.security.core.userdetails.User) principal).getUsername();
            log.debug("Principal is Spring User: {}", username);
            
            if (userRepository != null) {
                // Map username to email (username@test.com)
                String email = username + "@test.com";
                return userRepository.findByEmail(email)
                        .map(com.q2k.meditech.entity.User::getId)
                        .orElse(null);
            }
            return null;
        }
        
        // If using custom User entity
        if (principal instanceof com.q2k.meditech.entity.User) {
            com.q2k.meditech.entity.User user = (com.q2k.meditech.entity.User) principal;
            return user.getId();
        }
        
        log.warn("Unknown principal type: {}", principal.getClass().getName());
        return null;
    }

    /**
     * Get current username
     */
    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        
        return authentication.getName();
    }

    /**
     * Check if user has role
     */
    public static boolean hasRole(String role) {
        return SecurityContextHolder.getContext().getAuthentication()
                .getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_" + role));
    }

    /**
     * Get patient ID for current user (if user is patient)
     */
    public static Long getCurrentPatientId() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            return null;
        }
        
        // TODO: Look up Patient by User ID
        log.debug("Getting patient ID for user: {}", userId);
        return userId; // Placeholder
    }
}
