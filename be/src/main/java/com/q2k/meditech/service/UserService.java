package com.q2k.meditech.service;


import com.q2k.meditech.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * User Service Interface
 * Defines all user management operations
 */
public interface UserService {
    
    /**
     * List all users with filters and pagination
     * @param query Search query (email, phone)
     * @param role Filter by role name
     * @param isActive Filter by active status
     * @param pageable Pagination parameters
     * @return Page of UserDTO
     */
    Page<UserDTO> listUsers(String query, String role, Boolean isActive, Pageable pageable);
    
    /**
     * Get user detail by ID
     * @param userId User ID
     * @return UserDetailDTO
     */
    UserDetailDTO getUserDetail(Long userId);
    
    /**
     * Create new user (Admin only)
     * @param dto CreateUserDTO
     * @param currentUserId ID of the admin creating the user
     * @return CreateUserResponseDTO
     */
    CreateUserResponseDTO createUser(CreateUserDTO dto, Long currentUserId);
    
    /**
     * Update user
     * @param userId User ID to update
     * @param dto UpdateUserDTO
     * @return UserDTO
     */
    UserDTO updateUser(Long userId, UpdateUserDTO dto);
    
    /**
     * Enable/Disable user
     * @param userId User ID
     * @param dto StatusDTO
     * @return UserDTO
     */
    UserDTO updateUserStatus(Long userId, StatusDTO dto);
    
    /**
     * Assign roles to user (replace all existing roles)
     * @param userId User ID
     * @param dto AssignRolesDTO
     * @param currentUserId ID of the admin assigning roles
     * @return UserDTO
     */
    UserDTO assignRoles(Long userId, AssignRolesDTO dto, Long currentUserId);
    
    /**
     * Reset user password (Admin only)
     * Generate new random password and send to user's email
     * @param userId User ID
     * @return New temporary password (in real app, send via email)
     */
    String resetPassword(Long userId);

    /**
     * Admin change user password (Admin only)
     * Set a specific new password for a user
     * @param userId User ID
     * @param dto AdminChangePasswordDTO with newPassword and confirmPassword
     */
    void adminChangePassword(Long userId, com.q2k.meditech.dto.AdminChangePasswordDTO dto);
}