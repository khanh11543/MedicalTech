package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.service.SupportTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;

/**
 * User Controller
 * Handles user-related endpoints (profile, support tickets)
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User", description = "User profile and support APIs")
public class UserController {

    private final UserRepository userRepository;
    private final SupportTicketService supportTicketService;

    // ========== Profile ==========

    /**
     * GET /api/users/me
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserProfileDTO> getCurrentUser() {
        User user = getAuthenticatedUser();

        UserProfileDTO dto = UserProfileDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .roles(user.getUserRoles().stream()
                        .map(userRole -> userRole.getRole().getName())
                        .collect(Collectors.toSet()))
                .build();

        return ResponseEntity.ok(dto);
    }

    /**
     * PUT /api/users/me
     */
    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<UserProfileDTO> updateProfile(@Valid @RequestBody UpdateProfileDTO dto) {
        User user = getAuthenticatedUser();

        if (dto.getFullName() != null) {
            user.setFullName(dto.getFullName());
        }
        if (dto.getPhone() != null) {
            user.setPhone(dto.getPhone());
        }
        if (dto.getAvatarUrl() != null) {
            user.setAvatarUrl(dto.getAvatarUrl());
        }

        user = userRepository.save(user);
        log.info("Profile updated for user: {}", user.getEmail());

        UserProfileDTO response = UserProfileDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .twoFactorEnabled(user.getTwoFactorEnabled())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .roles(user.getUserRoles().stream()
                        .map(ur -> ur.getRole().getName())
                        .collect(Collectors.toSet()))
                .build();

        return ResponseEntity.ok(response);
    }

    // ========== Support Tickets ==========

    /**
     * POST /api/users/support-tickets
     */
    @PostMapping("/support-tickets")
    @Operation(summary = "Create a support ticket")
    public ResponseEntity<SupportTicketDTO> createTicket(@Valid @RequestBody CreateSupportTicketDTO dto) {
        User user = getAuthenticatedUser();
        SupportTicketDTO ticket = supportTicketService.createTicket(user.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(ticket);
    }

    /**
     * GET /api/users/support-tickets
     */
    @GetMapping("/support-tickets")
    @Operation(summary = "Get my support tickets")
    public ResponseEntity<Page<SupportTicketDTO>> getMyTickets(
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize) {
        User user = getAuthenticatedUser();
        Page<SupportTicketDTO> tickets = supportTicketService.getUserTickets(
                user.getId(), PageRequest.of(pageNumber, pageSize, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(tickets);
    }

    /**
     * GET /api/users/support-tickets/{id}
     */
    @GetMapping("/support-tickets/{id}")
    @Operation(summary = "Get a support ticket detail")
    public ResponseEntity<SupportTicketDTO> getTicketDetail(@PathVariable Long id) {
        User user = getAuthenticatedUser();
        SupportTicketDTO ticket = supportTicketService.getTicket(id, user.getId());
        return ResponseEntity.ok(ticket);
    }

    // ========== Helpers ==========

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
