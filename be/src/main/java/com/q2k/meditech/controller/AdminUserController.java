package com.q2k.meditech.controller;


import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Admin User Management Controller
 * Base path: /api/admin/users
 * 
 * All endpoints require ADMIN role (will be enforced by Security config)
 */
@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - User Management", description = "APIs for managing users (Admin only)")
public class AdminUserController {
    
    private final UserService userService;
    
    /**
     * GET /api/admin/users
     * List all users with filters and pagination
     */
    @GetMapping
    @Operation(summary = "List users", description = "Get paginated list of users with optional filters")
    public ResponseEntity<Page<UserDTO>> listUsers(
            @Parameter(description = "Search query (email, phone)")
            @RequestParam(required = false) String q,
            
            @Parameter(description = "Filter by role name (ADMIN, DOCTOR, PATIENT, RECEPTIONIST)")
            @RequestParam(required = false) String role,
            
            @Parameter(description = "Filter by active status")
            @RequestParam(required = false) Boolean isActive,
            
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int pageNumber,
            
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,
            
            @Parameter(description = "Sort by field")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            
            @Parameter(description = "Sort order (asc/desc)")
            @RequestParam(defaultValue = "desc") String sortOrder) {
        
        log.info("GET /admin/users - q: {}, role: {}, isActive: {}", q, role, isActive);
        
        // Create pageable with sort
        Sort sort = sortOrder.equalsIgnoreCase("asc") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);
        
        Page<UserDTO> users = userService.listUsers(q, role, isActive, pageable);
        
        return ResponseEntity.ok(users);
    }
    
    /**
     * GET /api/admin/users/{userId}
     * Get user detail by ID
     */
    @GetMapping("/{userId}")
    @Operation(summary = "Get user detail", description = "Get detailed information of a user")
    public ResponseEntity<UserDetailDTO> getUserDetail(
            @Parameter(description = "User ID")
            @PathVariable Long userId) {
        
        log.info("GET /admin/users/{}", userId);
        
        UserDetailDTO user = userService.getUserDetail(userId);
        
        return ResponseEntity.ok(user);
    }
    
    /**
     * POST /api/admin/users
     * Create new user (Admin only)
     */
    @PostMapping
    @Operation(summary = "Create user", description = "Create a new user (Admin only)")
    public ResponseEntity<UserDTO> createUser(
            @Valid @RequestBody CreateUserDTO dto) {
        
        log.info("POST /admin/users - email: {}", dto.getEmail());
        
        // TODO: Get current user ID from SecurityContext
        // For now, use hardcoded admin ID (1)
        Long currentUserId = 1L;
        
        UserDTO user = userService.createUser(dto, currentUserId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }
    
    /**
     * PUT /api/admin/users/{userId}
     * Update user
     */
    @PutMapping("/{userId}")
    @Operation(summary = "Update user", description = "Update user information")
    public ResponseEntity<UserDTO> updateUser(
            @Parameter(description = "User ID")
            @PathVariable Long userId,
            
            @Valid @RequestBody UpdateUserDTO dto) {
        
        log.info("PUT /admin/users/{}", userId);
        
        UserDTO user = userService.updateUser(userId, dto);
        
        return ResponseEntity.ok(user);
    }
    
    /**
     * PATCH /api/admin/users/{userId}/status
     * Enable/Disable user
     */
    @PatchMapping("/{userId}/status")
    @Operation(summary = "Update user status", description = "Enable or disable a user account")
    public ResponseEntity<MessageDTO> updateUserStatus(
            @Parameter(description = "User ID")
            @PathVariable Long userId,
            
            @Valid @RequestBody StatusDTO dto) {
        
        log.info("PATCH /admin/users/{}/status - isActive: {}", userId, dto.getIsActive());
        
        userService.updateUserStatus(userId, dto);
        
        String message = dto.getIsActive() 
                ? "User activated successfully" 
                : "User deactivated successfully";
        
        return ResponseEntity.ok(MessageDTO.success(message));
    }
    
    /**
     * PUT /api/admin/users/{userId}/roles
     * Assign roles to user
     */
    @PutMapping("/{userId}/roles")
    @Operation(summary = "Assign roles", description = "Assign roles to a user (replaces all existing roles)")
    public ResponseEntity<MessageDTO> assignRoles(
            @Parameter(description = "User ID")
            @PathVariable Long userId,
            
            @Valid @RequestBody AssignRolesDTO dto) {
        
        log.info("PUT /admin/users/{}/roles - roleIds: {}", userId, dto.getRoleIds());
        
        // TODO: Get current user ID from SecurityContext
        Long currentUserId = 1L;
        
        userService.assignRoles(userId, dto, currentUserId);
        
        return ResponseEntity.ok(MessageDTO.success("Roles assigned successfully"));
    }
    
    /**
     * POST /api/admin/users/{userId}/reset-password
     * Reset user password
     */
    @PostMapping("/{userId}/reset-password")
    @Operation(summary = "Reset password", description = "Reset user password (generates new random password)")
    public ResponseEntity<MessageDTO> resetPassword(
            @Parameter(description = "User ID")
            @PathVariable Long userId) {
        
        log.info("POST /admin/users/{}/reset-password", userId);
        
        String newPassword = userService.resetPassword(userId);
        
        // In production, send this via email
        // For testing, we return it in the message
        String message = String.format(
                "Password reset successfully. New temporary password: %s (This should be sent via email in production)", 
                newPassword);
        
        return ResponseEntity.ok(MessageDTO.success(message));
    }
}