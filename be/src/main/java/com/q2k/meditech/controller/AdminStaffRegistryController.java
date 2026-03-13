package com.q2k.meditech.controller;

import com.q2k.meditech.dto.NoteDTO;
import com.q2k.meditech.dto.StaffInviteDTO;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.StaffRegistryDTO;
import com.q2k.meditech.service.StaffRegistryService;
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
 * Admin Staff Registry Controller
 * Base path: /api/admin/staff-registry
 * 
 * Manages whitelist for internal staff (DOCTOR, RECEPTIONIST)
 * All endpoints require ADMIN role
 */
@RestController
@RequestMapping("/admin/staff-registry")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Staff Registry", description = "APIs for managing staff whitelist (Admin only)")
public class AdminStaffRegistryController {
    
    private final StaffRegistryService staffRegistryService;
    
    /**
     * POST /api/admin/staff-registry
     * Create staff invite (add to whitelist)
     */
    @PostMapping
    @Operation(
        summary = "Create staff invite", 
        description = "Add staff to whitelist. They can register with this email/phone."
    )
    public ResponseEntity<StaffRegistryDTO> createStaffInvite(
            @Valid @RequestBody StaffInviteDTO dto) {
        
        log.info("POST /admin/staff-registry - email: {}, role: {}", dto.getEmail(), dto.getExpectedRole());
        
        // TODO: Get current user ID from SecurityContext
        // For now, use hardcoded admin ID (1)
        Long currentUserId = 1L;
        
        StaffRegistryDTO result = staffRegistryService.createStaffInvite(dto, currentUserId);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    /**
     * GET /api/admin/staff-registry
     * List staff registry with filters and pagination
     */
    @GetMapping
    @Operation(
        summary = "List staff registry", 
        description = "Get paginated list of staff whitelist with optional filters"
    )
    public ResponseEntity<Page<StaffRegistryDTO>> listStaffRegistry(
            @Parameter(description = "Search query (email, phone, fullName)")
            @RequestParam(required = false) String q,
            
            @Parameter(description = "Filter by status (PENDING, REGISTERED, DISABLED, EXPIRED)")
            @RequestParam(required = false) String status,
            
            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int pageNumber,
            
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,
            
            @Parameter(description = "Sort by field")
            @RequestParam(defaultValue = "createdAt") String sortBy,
            
            @Parameter(description = "Sort order (asc/desc)")
            @RequestParam(defaultValue = "desc") String sortOrder) {
        
        log.info("GET /admin/staff-registry - q: {}, status: {}", q, status);
        
        // Create pageable with sort
        Sort sort = sortOrder.equalsIgnoreCase("asc") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);
        
        Page<StaffRegistryDTO> result = staffRegistryService.listStaffRegistry(q, status, pageable);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * GET /api/admin/staff-registry/{id}
     * Get staff registry detail by ID
     */
    @GetMapping("/{id}")
    @Operation(
        summary = "Get staff detail", 
        description = "Get detailed information of a staff registry entry"
    )
    public ResponseEntity<StaffRegistryDTO> getStaffDetail(
            @Parameter(description = "Staff registry ID")
            @PathVariable Long id) {
        
        log.info("GET /admin/staff-registry/{}", id);
        
        StaffRegistryDTO result = staffRegistryService.getStaffDetail(id);
        
        return ResponseEntity.ok(result);
    }
    
    /**
     * PATCH /api/admin/staff-registry/{id}/disable
     * Disable staff registry entry
     */
    @PatchMapping("/{id}/disable")
    @Operation(
        summary = "Disable staff", 
        description = "Disable a staff registry entry (prevent registration)"
    )
    public ResponseEntity<MessageDTO> disableStaff(
            @Parameter(description = "Staff registry ID")
            @PathVariable Long id,
            
            @RequestBody(required = false) @Valid NoteDTO noteDTO) {
        
        log.info("PATCH /admin/staff-registry/{}/disable", id);
        
        // TODO: Get current user ID from SecurityContext
        Long currentUserId = 1L;
        
        staffRegistryService.disableStaff(id, noteDTO, currentUserId);
        
        return ResponseEntity.ok(MessageDTO.success("Staff registry disabled successfully"));
    }
    
    /**
     * PATCH /api/admin/staff-registry/{id}/enable
     * Enable (re-activate) staff registry entry
     */
    @PatchMapping("/{id}/enable")
    @Operation(
        summary = "Enable staff", 
        description = "Re-activate a disabled staff registry entry"
    )
    public ResponseEntity<MessageDTO> enableStaff(
            @Parameter(description = "Staff registry ID")
            @PathVariable Long id) {
        
        log.info("PATCH /admin/staff-registry/{}/enable", id);
        
        staffRegistryService.enableStaff(id);
        
        return ResponseEntity.ok(MessageDTO.success("Staff registry enabled successfully"));
    }
}