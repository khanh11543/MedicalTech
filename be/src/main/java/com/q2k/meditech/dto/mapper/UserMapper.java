package com.q2k.meditech.dto.mapper;


import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserRole;
import org.mapstruct.*;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * MapStruct Mapper for User entity
 * Automatically generates implementation at compile time
 */
@Mapper(componentModel = "spring")
public interface UserMapper {
    
    /**
     * Convert User entity to UserDTO (roles will be automatically mapped)
     */
    @Mapping(target = "roles", expression = "java(mapRolesToStrings(user.getUserRoles()))")
    UserDTO toDTO(User user);
    
    /**
     * Convert User entity to UserDetailDTO (roles will be set separately)
     */
    @Mapping(target = "roles", ignore = true)
    UserDetailDTO toDetailDTO(User user);
    
    /**
     * Convert CreateUserDTO to User entity
     * Password will be set manually in service layer
     */
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "fullName", ignore = true)
    @Mapping(target = "verificationToken", ignore = true)
    @Mapping(target = "resetToken", ignore = true)
    @Mapping(target = "resetTokenExpiry", ignore = true)
    @Mapping(target = "resetTokenUsedAt", ignore = true)
    @Mapping(target = "otpCode", ignore = true)
    @Mapping(target = "otpCreatedAt", ignore = true)
    @Mapping(target = "otpExpiresAt", ignore = true)
    @Mapping(target = "otpAttemptCount", ignore = true)
    @Mapping(target = "twoFactorEnabled", ignore = true)
    @Mapping(target = "twoFactorSecret", ignore = true)
    @Mapping(target = "failedLoginCount", ignore = true)
    @Mapping(target = "lockedUntil", ignore = true)
    @Mapping(target = "lastLogin", ignore = true)
    @Mapping(target = "userRoles", ignore = true)
    @Mapping(target = "sessions", ignore = true)
    @Mapping(target = "refreshTokens", ignore = true)
    @Mapping(target = "emailVerifications", ignore = true)
    @Mapping(target = "twoFactorBackups", ignore = true)
    @Mapping(target = "loginAttempts", ignore = true)
    User toEntity(CreateUserDTO dto);
    
    /**
     * Update User entity from UpdateUserDTO
     */
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "passwordHash", ignore = true)
    @Mapping(target = "fullName", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "verificationToken", ignore = true)
    @Mapping(target = "resetToken", ignore = true)
    @Mapping(target = "resetTokenExpiry", ignore = true)
    @Mapping(target = "resetTokenUsedAt", ignore = true)
    @Mapping(target = "otpCode", ignore = true)
    @Mapping(target = "otpCreatedAt", ignore = true)
    @Mapping(target = "otpExpiresAt", ignore = true)
    @Mapping(target = "otpAttemptCount", ignore = true)
    @Mapping(target = "twoFactorSecret", ignore = true)
    @Mapping(target = "failedLoginCount", ignore = true)
    @Mapping(target = "lockedUntil", ignore = true)
    @Mapping(target = "lastLogin", ignore = true)
    @Mapping(target = "userRoles", ignore = true)
    @Mapping(target = "sessions", ignore = true)
    @Mapping(target = "refreshTokens", ignore = true)
    @Mapping(target = "emailVerifications", ignore = true)
    @Mapping(target = "twoFactorBackups", ignore = true)
    @Mapping(target = "loginAttempts", ignore = true)
    void updateEntityFromDTO(UpdateUserDTO dto, @MappingTarget User user);
    
    /**
     * Helper method: Convert Set<UserRole> to Set<String> (role names)
     */
    default Set<String> mapRolesToStrings(Set<UserRole> userRoles) {
        if (userRoles == null) {
            return Set.of();
        }
        return userRoles.stream()
                .map(ur -> ur.getRole().getName())
                .collect(Collectors.toSet());
    }
    
    /**
     * Helper method: Convert Set<UserRole> to Set<UserRoleDetailDTO>
     */
    default Set<UserRoleDetailDTO> mapRolesToDetailDTO(Set<UserRole> userRoles) {
        if (userRoles == null) {
            return Set.of();
        }
        return userRoles.stream()
                .map(ur -> UserRoleDetailDTO.builder()
                        .roleId(ur.getRole().getId())
                        .roleName(ur.getRole().getName())
                        .roleDescription(ur.getRole().getDescription())
                        .assignedAt(ur.getAssignedAt())
                        .assignedBy(ur.getAssignedBy() != null ? ur.getAssignedBy().getId() : null)
                        .assignedByEmail(ur.getAssignedBy() != null ? ur.getAssignedBy().getEmail() : null)
                        .build())
                .collect(Collectors.toSet());
    }
}