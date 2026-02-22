package com.q2k.meditech.service;


import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.UserMapper;
import com.q2k.meditech.entity.Role;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserRole;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.exception.ResourceNotFoundException;

import com.q2k.meditech.repository.RoleRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.repository.UserRoleRepository;
import com.q2k.meditech.service.UserService;
import jakarta.persistence.criteria.JoinType;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * User Service Implementation
 * Contains all business logic for user management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public Page<UserDTO> listUsers(String query, String role, Boolean isActive, Pageable pageable) {
        log.info("Listing users with query: {}, role: {}, isActive: {}", query, role, isActive);

        // Capture parameters as final local variables for lambda use
        final String finalQuery = query;
        final String finalRole = role;
        final Boolean finalIsActive = isActive;

        // Build dynamic specification for filtering
        // Always eager fetch userRoles and roles to avoid LazyInitializationException
        Specification<User> spec = (root, criteriaQuery, cb) -> {
            // Eager fetch userRoles and roles for all queries
            if (criteriaQuery.getResultType() != Long.class) {
                root.fetch("userRoles", JoinType.LEFT).fetch("role", JoinType.LEFT);
            }
            return cb.conjunction();
        };

        // Filter by search query (email or phone)
        if (finalQuery != null && !finalQuery.trim().isEmpty()) {
            String searchQuery = finalQuery.toLowerCase();
            spec = spec.and((root, criteriaQuery, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("email")), "%" + searchQuery + "%"),
                            cb.like(cb.lower(root.get("phone")), "%" + searchQuery + "%")
                    )
            );
        }

        // Filter by active status
        if (finalIsActive != null) {
            spec = spec.and((root, criteriaQuery, cb) ->
                    cb.equal(root.get("isActive"), finalIsActive)
            );
        }

        // Filter by role (join userRoles table)
        if (finalRole != null && !finalRole.trim().isEmpty()) {
            String searchRole = finalRole.toLowerCase();
            spec = spec.and((root, criteriaQuery, cb) -> {
                var userRoleJoin = root.join("userRoles", JoinType.LEFT);
                var roleJoin = userRoleJoin.join("role", JoinType.LEFT);
                return cb.equal(cb.lower(roleJoin.get("name")), searchRole);
            });
        }

        Page<User> users = userRepository.findAll(spec, pageable);
        return users.map(userMapper::toDTO);
    }

    @Override
    public UserDetailDTO getUserDetail(Long userId) {
        log.info("Getting user detail for ID: {}", userId);

        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserDetailDTO dto = userMapper.toDetailDTO(user);
        dto.setRoles(userMapper.mapRolesToDetailDTO(user.getUserRoles()));
        return dto;
    }

    @Override
    @Transactional
    public UserDTO createUser(CreateUserDTO dto, Long currentUserId) {
        log.info("Creating new user with email: {}", dto.getEmail());

        // Check if email already exists
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("User", "email", dto.getEmail());
        }

        // Check if phone already exists (if provided)
        if (dto.getPhone() != null && userRepository.existsByPhone(dto.getPhone())) {
            throw new DuplicateResourceException("User", "phone", dto.getPhone());
        }

        // Convert DTO to Entity
        User user = userMapper.toEntity(dto);

        // Hash password
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));

        // Set default values
        if (user.getIsActive() == null) {
            user.setIsActive(true);
        }
        if (user.getIsVerified() == null) {
            user.setIsVerified(false);
        }
        if (user.getFailedLoginCount() == null) {
            user.setFailedLoginCount(0);
        }
        if (user.getTwoFactorEnabled() == null) {
            user.setTwoFactorEnabled(false);
        }

        // Save user first
        user = userRepository.save(user);

        // Assign roles if provided
        if (dto.getRoleIds() != null && !dto.getRoleIds().isEmpty()) {
            assignRolesToUser(user, dto.getRoleIds(), currentUserId);
        }

        // Reload user with roles
        Long userId = user.getId();
        user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        log.info("User created successfully with ID: {}", user.getId());
        UserDTO result = userMapper.toDTO(user);
        result.setRoles(userMapper.mapRolesToStrings(user.getUserRoles()));
        return result;
    }

    @Override
    @Transactional
    public UserDTO updateUser(Long userId, UpdateUserDTO dto) {
        log.info("Updating user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Check email uniqueness (if changing email)
        if (dto.getEmail() != null && !dto.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(dto.getEmail())) {
                throw new DuplicateResourceException("User", "email", dto.getEmail());
            }
        }

        // Check phone uniqueness (if changing phone)
        if (dto.getPhone() != null && !dto.getPhone().equals(user.getPhone())) {
            if (userRepository.existsByPhone(dto.getPhone())) {
                throw new DuplicateResourceException("User", "phone", dto.getPhone());
            }
        }

        // Update user using MapStruct (only non-null fields)
        userMapper.updateEntityFromDTO(dto, user);

        user = userRepository.save(user);

        // Reload with roles
        Long savedUserId = user.getId();
        user = userRepository.findByIdWithRoles(savedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + savedUserId));

        log.info("User updated successfully: {}", userId);
        UserDTO result = userMapper.toDTO(user);
        result.setRoles(userMapper.mapRolesToStrings(user.getUserRoles()));
        return result;
    }

    @Override
    @Transactional
    public UserDTO updateUserStatus(Long userId, StatusDTO dto) {
        log.info("Updating user status for ID: {}, isActive: {}", userId, dto.getIsActive());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setIsActive(dto.getIsActive());

        // If disabling user, also clear any account locks
        if (!dto.getIsActive()) {
            user.setLockedUntil(null);
            user.setFailedLoginCount(0);
        }

        user = userRepository.save(user);

        // Reload with roles
        Long statusUserId = user.getId();
        user = userRepository.findByIdWithRoles(statusUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + statusUserId));

        log.info("User status updated successfully: {}", userId);
        UserDTO result = userMapper.toDTO(user);
        result.setRoles(userMapper.mapRolesToStrings(user.getUserRoles()));
        return result;
    }

    @Override
    @Transactional
    public UserDTO assignRoles(Long userId, AssignRolesDTO dto, Long currentUserId) {
        log.info("Assigning roles to user ID: {}, roles: {}", userId, dto.getRoleIds());

        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + currentUserId));

        // Delete all existing roles
        userRoleRepository.deleteByUserId(userId);
        user.getUserRoles().clear();

        // Assign new roles
        assignRolesToUser(user, dto.getRoleIds(), currentUserId);

        // Reload user with new roles
        Long reloadUserId = user.getId();
        user = userRepository.findByIdWithRoles(reloadUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reloadUserId));

        log.info("Roles assigned successfully to user: {}", userId);
        UserDTO result = userMapper.toDTO(user);
        result.setRoles(userMapper.mapRolesToStrings(user.getUserRoles()));
        return result;
    }

    @Override
    @Transactional
    public String resetPassword(Long userId) {
        log.info("Resetting password for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Generate random password (8 characters)
        String newPassword = generateRandomPassword();

        // Hash and save new password
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setFailedLoginCount(0);
        user.setLockedUntil(null);

        userRepository.save(user);

        log.info("Password reset successfully for user: {}", userId);

        // In real application, send this password via email
        // For now, we return it (ONLY FOR TESTING)
        return newPassword;
    }

    // ========== HELPER METHODS ==========

    /**
     * Helper method to assign roles to user
     */
    private void assignRolesToUser(User user, Set<Long> roleIds, Long assignedBy) {
        // Validate all roles exist
        List<Role> roles = roleRepository.findByIdIn(roleIds);
        if (roles.size() != roleIds.size()) {
            Set<Long> foundRoleIds = roles.stream()
                    .map(Role::getId)
                    .collect(Collectors.toSet());
            Set<Long> missingRoleIds = roleIds.stream()
                    .filter(id -> !foundRoleIds.contains(id))
                    .collect(Collectors.toSet());
            throw new ResourceNotFoundException("Roles not found with IDs: " + missingRoleIds);
        }

        // Get the user who is assigning roles (for audit trail)
        User assignedByUser = userRepository.findById(assignedBy)
                .orElse(null);

        // Create UserRole entries
        for (Role role : roles) {
            UserRole userRole = UserRole.builder()
                    .user(user)
                    .role(role)
                    .assignedAt(LocalDateTime.now())
                    .assignedBy(assignedByUser)
                    .build();

            user.addRole(userRole);
            userRoleRepository.save(userRole);
        }
    }

    /**
     * Helper method to generate random password
     */
    private String generateRandomPassword() {
        // Generate 8-character random password
        // Mix of uppercase, lowercase, numbers, and special characters
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return uuid.substring(0, 8);
    }
}