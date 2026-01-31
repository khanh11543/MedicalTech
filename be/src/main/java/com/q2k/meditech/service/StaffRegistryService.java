package com.q2k.meditech.service;

import com.q2k.meditech.dto.NoteDTO;
import com.q2k.meditech.dto.StaffInviteDTO;
import com.q2k.meditech.dto.StaffRegistryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Staff Registry Service Interface
 * Quản lý whitelist cho nhân viên nội bộ
 */
public interface StaffRegistryService {
    
    /**
     * Create staff invite (whitelist entry)
     * @param dto StaffInviteDTO
     * @param currentUserId ID của admin tạo invite
     * @return StaffRegistryDTO
     */
    StaffRegistryDTO createStaffInvite(StaffInviteDTO dto, Long currentUserId);
    
    /**
     * List staff registry với filters và pagination
     * @param query Search query (email, phone, fullName)
     * @param status Filter by status (PENDING, REGISTERED, DISABLED, EXPIRED)
     * @param pageable Pagination parameters
     * @return Page of StaffRegistryDTO
     */
    Page<StaffRegistryDTO> listStaffRegistry(String query, String status, Pageable pageable);
    
    /**
     * Get staff registry detail by ID
     * @param id Staff registry ID
     * @return StaffRegistryDTO
     */
    StaffRegistryDTO getStaffDetail(Long id);
    
    /**
     * Disable staff registry entry
     * @param id Staff registry ID
     * @param noteDTO Optional note/reason
     * @param currentUserId ID của admin disable
     * @return StaffRegistryDTO
     */
    StaffRegistryDTO disableStaff(Long id, NoteDTO noteDTO, Long currentUserId);
    
    /**
     * Enable staff registry entry (re-activate)
     * @param id Staff registry ID
     * @return StaffRegistryDTO
     */
    StaffRegistryDTO enableStaff(Long id);
    
    /**
     * Helper: Check if email/phone can register
     * Dùng trong registration process
     * @param email Email to check
     * @param phone Phone to check
     * @return StaffRegistryDTO nếu tìm thấy valid entry, null otherwise
     */
    StaffRegistryDTO findValidInvite(String email, String phone);
}