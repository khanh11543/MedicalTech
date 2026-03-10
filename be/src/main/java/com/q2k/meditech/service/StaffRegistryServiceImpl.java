package com.q2k.meditech.service;

import com.q2k.meditech.dto.NoteDTO;
import com.q2k.meditech.dto.StaffInviteDTO;
import com.q2k.meditech.dto.StaffRegistryDTO;
import com.q2k.meditech.entity.StaffRegistry;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.dto.mapper.StaffRegistryMapper;
import com.q2k.meditech.repository.StaffRegistryRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.service.StaffRegistryService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Staff Registry Service Implementation
 * Contains business logic for managing staff whitelist
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StaffRegistryServiceImpl implements StaffRegistryService {
    
    private final StaffRegistryRepository staffRegistryRepository;
    private final UserRepository userRepository;
    private final StaffRegistryMapper staffRegistryMapper;
    
    @Override
    @Transactional
    public StaffRegistryDTO createStaffInvite(StaffInviteDTO dto, Long currentUserId) {
        log.info("Creating staff invite for email: {}, role: {}", dto.getEmail(), dto.getExpectedRole());
        
        // Check if email already exists in registry
        if (staffRegistryRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("Staff registry", "email", dto.getEmail());
        }
        
        // Check if phone already exists (if provided)
        if (dto.getPhone() != null && staffRegistryRepository.existsByPhone(dto.getPhone())) {
            throw new DuplicateResourceException("Staff registry", "phone", dto.getPhone());
        }
        
        // Check if email already exists in users table
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("User", "email", dto.getEmail());
        }
        
        // Get admin who is creating the invite
        User invitedByUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        
        // Convert DTO to Entity
        StaffRegistry staffRegistry = staffRegistryMapper.toEntity(dto);
        
        // Set additional fields
        staffRegistry.setInvitedBy(invitedByUser);
        staffRegistry.setStatus("PENDING");
        staffRegistry.setInvitedAt(LocalDateTime.now());
        
        // Generate staff code (unique identifier)
        String staffCode = generateStaffCode();
        staffRegistry.setStaffCode(staffCode);
        
        // Generate invitation token (UUID)
        // This can be used to create a secure registration link
        String invitationToken = UUID.randomUUID().toString();
        staffRegistry.setInvitationToken(invitationToken);
        
        // Save
        staffRegistry = staffRegistryRepository.save(staffRegistry);
        
        log.info("Staff invite created successfully with ID: {}", staffRegistry.getId());
        
        // In production, send invitation email here
        // sendInvitationEmail(staffRegistry);
        
        return staffRegistryMapper.toDTO(staffRegistry);
    }
    
    @Override
    public Page<StaffRegistryDTO> listStaffRegistry(String query, String status, Pageable pageable) {
        log.info("Listing staff registry with query: {}, status: {}", query, status);
        
        // Build dynamic specification for filtering
        Specification<StaffRegistry> spec = null;

        // Filter by search query (email, phone, fullName)
        if (query != null && !query.trim().isEmpty()) {
            final String searchQuery = query.toLowerCase();
            spec = (root, criteriaQuery, cb) ->
                cb.or(
                    cb.like(cb.lower(root.get("email")), "%" + searchQuery + "%"),
                    cb.like(cb.lower(root.get("phone")), "%" + searchQuery + "%"),
                    cb.like(cb.lower(root.get("fullName")), "%" + searchQuery + "%")
                );
        }
        
        // Filter by status
        if (status != null && !status.trim().isEmpty()) {
            final String statusUpper = status.toUpperCase();
            Specification<StaffRegistry> statusSpec = (root, criteriaQuery, cb) ->
                cb.equal(cb.upper(root.get("status")), statusUpper);
            
            if (spec == null) {
                spec = statusSpec;
            } else {
                spec = spec.and(statusSpec);
            }
        }
        
        Page<StaffRegistry> staffRegistries = spec == null 
            ? staffRegistryRepository.findAll(pageable)
            : staffRegistryRepository.findAll(spec, pageable);
        
        // Update EXPIRED status for entries that have passed expiry date
        // (This could also be done via scheduled job)
        staffRegistries.forEach(sr -> {
            if ("PENDING".equals(sr.getStatus()) && sr.isExpired()) {
                sr.setStatus("EXPIRED");
                staffRegistryRepository.save(sr);
            }
        });
        
        return staffRegistries.map(staffRegistryMapper::toDTO);
    }
    
    @Override
    public StaffRegistryDTO getStaffDetail(Long id) {
        log.info("Getting staff registry detail for ID: {}", id);
        
        StaffRegistry staffRegistry = staffRegistryRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff registry", "id", id));
        
        // Update status to EXPIRED if needed
        if ("PENDING".equals(staffRegistry.getStatus()) && staffRegistry.isExpired()) {
            staffRegistry.setStatus("EXPIRED");
            staffRegistry = staffRegistryRepository.save(staffRegistry);
        }
        
        return staffRegistryMapper.toDTO(staffRegistry);
    }
    
    @Override
    @Transactional
    public StaffRegistryDTO disableStaff(Long id, NoteDTO noteDTO, Long currentUserId) {
        log.info("Disabling staff registry ID: {}", id);
        
        StaffRegistry staffRegistry = staffRegistryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff registry", "id", id));
        
        // Cannot disable if already REGISTERED
        if ("REGISTERED".equals(staffRegistry.getStatus())) {
            throw new BadRequestException("Cannot disable staff that has already registered. " +
                    "Please disable the user account instead.");
        }
        
        // Cannot disable if already DISABLED
        if ("DISABLED".equals(staffRegistry.getStatus())) {
            throw new BadRequestException("Staff registry is already disabled");
        }
        
        // Get admin who is disabling
        User disabledByUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));
        
        // Update status to DISABLED
        staffRegistry.setStatus("DISABLED");
        staffRegistry.setDisabledBy(disabledByUser);
        staffRegistry.setDisabledAt(LocalDateTime.now());
        
        if (noteDTO != null && noteDTO.getNote() != null) {
            staffRegistry.setDisableReason(noteDTO.getNote());
        }
        
        staffRegistry = staffRegistryRepository.save(staffRegistry);
        
        log.info("Staff registry disabled successfully: {}", id);
        
        return staffRegistryMapper.toDTO(staffRegistry);
    }
    
    @Override
    @Transactional
    public StaffRegistryDTO enableStaff(Long id) {
        log.info("Enabling staff registry ID: {}", id);
        
        StaffRegistry staffRegistry = staffRegistryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff registry", "id", id));
        
        // Can only enable if currently DISABLED
        if (!"DISABLED".equals(staffRegistry.getStatus())) {
            throw new BadRequestException("Can only enable staff registry that is DISABLED. " +
                    "Current status: " + staffRegistry.getStatus());
        }
        
        // Cannot re-enable if already registered
        if (staffRegistry.getRegisteredUser() != null) {
            throw new BadRequestException("Cannot re-enable staff registry that has already been registered");
        }
        
        // Check if expired
        if (staffRegistry.isExpired()) {
            // Re-enable as EXPIRED instead of PENDING
            staffRegistry.setStatus("EXPIRED");
        } else {
            // Re-enable as PENDING
            staffRegistry.setStatus("PENDING");
        }
        
        // Clear disable info
        staffRegistry.setDisabledBy(null);
        staffRegistry.setDisabledAt(null);
        staffRegistry.setDisableReason(null);
        
        staffRegistry = staffRegistryRepository.save(staffRegistry);
        
        log.info("Staff registry enabled successfully: {} with status: {}", id, staffRegistry.getStatus());
        
        return staffRegistryMapper.toDTO(staffRegistry);
    }
    
    @Override
    public StaffRegistryDTO findValidInvite(String email, String phone) {
        log.info("Finding valid invite for email: {}, phone: {}", email, phone);
        
        // Try to find by email first
        StaffRegistry staffRegistry = null;
        if (email != null) {
            staffRegistry = staffRegistryRepository.findByEmail(email).orElse(null);
        }
        
        // If not found by email, try phone
        if (staffRegistry == null && phone != null) {
            staffRegistry = staffRegistryRepository.findByPhone(phone).orElse(null);
        }
        
        // Check if invite is valid
        if (staffRegistry != null && staffRegistry.canRegister()) {
            return staffRegistryMapper.toDTO(staffRegistry);
        }
        
        return null;
    }
    
    // ========== HELPER METHODS ==========
    
    /**
     * Method to mark registry as REGISTERED
     * This should be called from User Registration Service after successful registration
     * 
     * @param email Email that was registered
     * @param registeredUser The newly created User entity
     */
    @Transactional
    public void markAsRegistered(String email, User registeredUser) {
        log.info("Marking staff registry as REGISTERED for email: {}", email);
        
        StaffRegistry staffRegistry = staffRegistryRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Staff registry", "email", email));
        
        staffRegistry.setStatus("REGISTERED");
        staffRegistry.setRegisteredUser(registeredUser);
        staffRegistry.setRegisteredAt(LocalDateTime.now());
        
        staffRegistryRepository.save(staffRegistry);
        
        log.info("Staff registry marked as REGISTERED: {}", staffRegistry.getId());
    }

    /**
     * Generate unique staff code
     * Format: STAFF-YYYYMMDD-XXXXX (e.g., STAFF-20260131-12345)
     */
    private String generateStaffCode() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = String.format("%04d%02d%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());
        // Generate random 5-digit number
        int randomPart = (int) (Math.random() * 90000) + 10000;
        return "STAFF-" + datePart + "-" + randomPart;
    }
    
    /**
     * Helper method to send invitation email
     * TODO: Implement actual email sending
     */
    private void sendInvitationEmail(StaffRegistry staffRegistry) {
        log.info("Sending invitation email to: {}", staffRegistry.getEmail());
        
        // TODO: Implement email sending
        // String registrationLink = buildRegistrationLink(staffRegistry.getInvitationToken());
        // emailService.sendStaffInvitation(staffRegistry.getEmail(), registrationLink, staffRegistry);
        
        log.info("Invitation email sent (placeholder)");
    }
    
    /**
     * Build registration link with invitation token
     */
    private String buildRegistrationLink(String invitationToken) {
        // TODO: Get from configuration
        String frontendUrl = "http://localhost:5173";
        return frontendUrl + "/register?token=" + invitationToken;
    }
}