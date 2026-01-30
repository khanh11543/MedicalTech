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
     * Convert User entity to UserDTO (roles will be set separately)
     */
    UserDTO toDTO(User user);
    
    /**
     * Convert User entity to UserDetailDTO (roles will be set separately)
     */
    UserDetailDTO toDetailDTO(User user);
    
    /**
     * Convert CreateUserDTO to User entity
     * Password will be set manually in service layer
     */
    User toEntity(CreateUserDTO dto);
    
    /**
     * Update User entity from UpdateUserDTO
     */
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
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