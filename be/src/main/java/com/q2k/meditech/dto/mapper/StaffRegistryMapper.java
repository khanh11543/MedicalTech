package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.StaffInviteDTO;
import com.q2k.meditech.dto.StaffRegistryDTO;
import com.q2k.meditech.entity.StaffRegistry;
import org.mapstruct.*;

/**
 * MapStruct Mapper for StaffRegistry entity
 */
@Mapper(componentModel = "spring")
public abstract class StaffRegistryMapper {

    /**
     * Helper method to extract registered user ID from StaffRegistry
     */
    @Named("getRegisteredUserId")
    protected Long getRegisteredUserId(StaffRegistry staffRegistry) {
        return staffRegistry == null || staffRegistry.getRegisteredUser() == null ? null : staffRegistry.getRegisteredUser().getId();
    }

    /**
     * Helper method to extract registered user email from StaffRegistry
     */
    @Named("getRegisteredUserEmail")
    protected String getRegisteredUserEmail(StaffRegistry staffRegistry) {
        return staffRegistry == null || staffRegistry.getRegisteredUser() == null ? null : staffRegistry.getRegisteredUser().getEmail();
    }

    /**
     * Helper method to extract invited by user ID from StaffRegistry
     */
    @Named("getInvitedById")
    protected Long getInvitedById(StaffRegistry staffRegistry) {
        return staffRegistry == null || staffRegistry.getInvitedBy() == null ? null : staffRegistry.getInvitedBy().getId();
    }

    /**
     * Helper method to extract invited by user email from StaffRegistry
     */
    @Named("getInvitedByEmail")
    protected String getInvitedByEmail(StaffRegistry staffRegistry) {
        return staffRegistry == null || staffRegistry.getInvitedBy() == null ? null : staffRegistry.getInvitedBy().getEmail();
    }

    /**
     * Helper method to extract disabled by user ID from StaffRegistry
     */
    @Named("getDisabledById")
    protected Long getDisabledById(StaffRegistry staffRegistry) {
        return staffRegistry == null || staffRegistry.getDisabledBy() == null ? null : staffRegistry.getDisabledBy().getId();
    }

    /**
     * Helper method to extract disabled by user email from StaffRegistry
     */
    @Named("getDisabledByEmail")
    protected String getDisabledByEmail(StaffRegistry staffRegistry) {
        return staffRegistry == null || staffRegistry.getDisabledBy() == null ? null : staffRegistry.getDisabledBy().getEmail();
    }
    
    /**
     * Convert StaffRegistry entity to StaffRegistryDTO
     */
    @Mapping(target = "registeredUserId", source = ".", qualifiedByName = "getRegisteredUserId")
    @Mapping(target = "registeredUserEmail", source = ".", qualifiedByName = "getRegisteredUserEmail")
    @Mapping(target = "invitedBy", source = ".", qualifiedByName = "getInvitedById")
    @Mapping(target = "invitedByEmail", source = ".", qualifiedByName = "getInvitedByEmail")
    @Mapping(target = "disabledBy", source = ".", qualifiedByName = "getDisabledById")
    @Mapping(target = "disabledByEmail", source = ".", qualifiedByName = "getDisabledByEmail")
    @Mapping(target = "isExpired", source = ".", qualifiedByName = "isExpired")
    @Mapping(target = "canRegister", source = ".", qualifiedByName = "canRegister")
    public abstract StaffRegistryDTO toDTO(StaffRegistry staffRegistry);
    
    /**
     * Helper method to check if staff registry is expired
     */
    @Named("isExpired")
    protected Boolean isExpired(StaffRegistry staffRegistry) {
        return staffRegistry == null ? false : staffRegistry.isExpired();
    }
    
    /**
     * Helper method to check if staff can register
     */
    @Named("canRegister")
    protected Boolean canRegister(StaffRegistry staffRegistry) {
        return staffRegistry == null ? false : staffRegistry.canRegister();
    }
    
    /**
     * Convert StaffInviteDTO to StaffRegistry entity
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "staffCode", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "registeredUser", ignore = true)
    @Mapping(target = "registeredAt", ignore = true)
    @Mapping(target = "invitedBy", ignore = true)
    @Mapping(target = "invitedAt", ignore = true)
    @Mapping(target = "disabledBy", ignore = true)
    @Mapping(target = "disabledAt", ignore = true)
    @Mapping(target = "disableReason", ignore = true)
    @Mapping(target = "invitationToken", ignore = true)
    @Mapping(target = "notes", ignore = true)
    public abstract StaffRegistry toEntity(StaffInviteDTO dto);
}