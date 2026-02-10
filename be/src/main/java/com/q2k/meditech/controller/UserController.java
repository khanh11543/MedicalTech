package com.q2k.meditech.controller;

import com.q2k.meditech.dto.UserDTO;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Collectors;

/**
 * User Controller
 * Handles user-related endpoints
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User", description = "User management APIs")
public class UserController {

    private final UserRepository userRepository;

    /**
     * Get current authenticated user information
     * GET /api/users/me
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user", 
               description = "Get current authenticated user information including roles")
    public ResponseEntity<UserDTO> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        
        log.info("Getting current user info for: {}", email);
        
        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        UserDTO userDTO = UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .failedLoginCount(user.getFailedLoginCount())
                .lockedUntil(user.getLockedUntil())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .roles(user.getUserRoles().stream()
                        .map(userRole -> userRole.getRole().getName())
                        .collect(Collectors.toSet()))
                .build();
        
        return ResponseEntity.ok(userDTO);
    }
}
