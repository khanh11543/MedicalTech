package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.Receptionist;
import com.q2k.meditech.entity.Role;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserRole;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.ReceptionistRepository;
import com.q2k.meditech.repository.RoleRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.repository.UserRoleRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin Receptionist Management Controller
 * Base path: /api/admin/receptionists
 */
@RestController
@RequestMapping("/admin/receptionists")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Receptionist Management", description = "APIs for managing receptionists (Admin only)")
public class AdminReceptionistController {

    private final ReceptionistRepository receptionistRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * GET /api/admin/receptionists - List all receptionists
     */
    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "List receptionists", description = "Get paginated list of receptionists with optional filters")
    public ResponseEntity<Page<AdminReceptionistDTO>> listReceptionists(
            @Parameter(description = "Search by name, email, or employee ID")
            @RequestParam(required = false) String q,

            @Parameter(description = "Filter by department")
            @RequestParam(required = false) String department,

            @Parameter(description = "Filter by shift (MORNING, AFTERNOON, EVENING, NIGHT)")
            @RequestParam(required = false) String shift,

            @Parameter(description = "Filter by active status")
            @RequestParam(required = false) Boolean isActive,

            @Parameter(description = "Page number (0-indexed)")
            @RequestParam(defaultValue = "0") int pageNumber,

            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,

            @Parameter(description = "Sort by field")
            @RequestParam(defaultValue = "id") String sortBy,

            @Parameter(description = "Sort order (asc/desc)")
            @RequestParam(defaultValue = "desc") String sortOrder) {

        log.info("GET /admin/receptionists - q: {}, department: {}, shift: {}, isActive: {}", q, department, shift, isActive);

        Sort sort = sortOrder.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        Page<Receptionist> receptionists = receptionistRepository.findAllWithFilters(q, department, shift, isActive, pageable);

        Page<AdminReceptionistDTO> dtos = receptionists.map(this::toDTO);

        return ResponseEntity.ok(dtos);
    }

    /**
     * GET /api/admin/receptionists/{id} - Get receptionist detail
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get receptionist detail", description = "Get detailed receptionist info")
    public ResponseEntity<AdminReceptionistDTO> getReceptionistDetail(
            @Parameter(description = "Receptionist ID") @PathVariable Long id) {

        log.info("GET /admin/receptionists/{}", id);

        Receptionist receptionist = receptionistRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Receptionist not found with id: " + id));

        return ResponseEntity.ok(toDTO(receptionist));
    }

    /**
     * POST /api/admin/receptionists - Create a new receptionist
     */
    @PostMapping
    @Operation(summary = "Create receptionist", description = "Create a new receptionist account with user + profile")
    public ResponseEntity<AdminReceptionistDTO> createReceptionist(
            @Valid @RequestBody CreateReceptionistDTO dto) {

        log.info("POST /admin/receptionists - email: {}", dto.getEmail());

        // Check duplicate email
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new DuplicateResourceException("Email already exists: " + dto.getEmail());
        }

        // Check duplicate employee ID
        if (dto.getEmployeeId() != null && receptionistRepository.existsByEmployeeId(dto.getEmployeeId())) {
            throw new DuplicateResourceException("Employee ID already exists: " + dto.getEmployeeId());
        }

        // Create user
        User user = User.builder()
                .email(dto.getEmail())
                .passwordHash(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .isActive(true)
                .isVerified(true)
                .build();
        user = userRepository.save(user);

        // Assign RECEPTIONIST role
        Role receptionistRole = roleRepository.findByName("RECEPTIONIST")
                .orElseThrow(() -> new BadRequestException("RECEPTIONIST role not found in system"));

        UserRole userRole = UserRole.builder()
                .user(user)
                .role(receptionistRole)
                .build();
        userRoleRepository.save(userRole);

        // Create receptionist profile
        Receptionist receptionist = Receptionist.builder()
                .user(user)
                .fullName(dto.getFullName())
                .employeeId(dto.getEmployeeId())
                .department(dto.getDepartment())
                .shift(dto.getShift() != null ? dto.getShift() : "MORNING")
                .isActive(true)
                .build();
        receptionist = receptionistRepository.save(receptionist);

        return ResponseEntity.status(HttpStatus.CREATED).body(toDTO(receptionist));
    }

    /**
     * PUT /api/admin/receptionists/{id} - Update receptionist
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update receptionist", description = "Update receptionist info (admin)")
    public ResponseEntity<AdminReceptionistDTO> updateReceptionist(
            @Parameter(description = "Receptionist ID") @PathVariable Long id,
            @Valid @RequestBody UpdateReceptionistDTO dto) {

        log.info("PUT /admin/receptionists/{}", id);

        Receptionist receptionist = receptionistRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Receptionist not found with id: " + id));

        User user = receptionist.getUser();

        // Update user fields
        if (dto.getPhone() != null) user.setPhone(dto.getPhone());

        // Update receptionist fields
        if (dto.getFullName() != null) {
            receptionist.setFullName(dto.getFullName());
            user.setFullName(dto.getFullName());
        }
        if (dto.getEmployeeId() != null) receptionist.setEmployeeId(dto.getEmployeeId());
        if (dto.getDepartment() != null) receptionist.setDepartment(dto.getDepartment());
        if (dto.getShift() != null) receptionist.setShift(dto.getShift());
        if (dto.getIsActive() != null) {
            receptionist.setIsActive(dto.getIsActive());
            user.setIsActive(dto.getIsActive());
        }

        receptionistRepository.save(receptionist);

        return ResponseEntity.ok(toDTO(receptionist));
    }

    /**
     * PATCH /api/admin/receptionists/{id}/status - Toggle receptionist account
     */
    @PatchMapping("/{id}/status")
    @Operation(summary = "Update receptionist status", description = "Enable or disable a receptionist account")
    public ResponseEntity<MessageDTO> updateReceptionistStatus(
            @Parameter(description = "Receptionist ID") @PathVariable Long id,
            @Valid @RequestBody StatusDTO dto) {

        log.info("PATCH /admin/receptionists/{}/status - isActive: {}", id, dto.getIsActive());

        Receptionist receptionist = receptionistRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Receptionist not found with id: " + id));

        receptionist.setIsActive(dto.getIsActive());
        receptionist.getUser().setIsActive(dto.getIsActive());
        receptionistRepository.save(receptionist);

        String message = dto.getIsActive()
                ? "Receptionist activated successfully"
                : "Receptionist deactivated successfully";

        return ResponseEntity.ok(MessageDTO.success(message));
    }

    // ===== Sync endpoint =====

    @PostMapping("/sync")
    @Transactional
    @Operation(summary = "Sync missing receptionist profiles", description = "Create Receptionist profiles for users with RECEPTIONIST role who are missing one")
    public ResponseEntity<MessageDTO> syncReceptionistProfiles() {
        List<User> usersWithoutProfile = userRepository.findUsersWithRoleMissingReceptionistProfile("RECEPTIONIST");
        if (!usersWithoutProfile.isEmpty()) {
            log.info("Syncing {} users with RECEPTIONIST role missing receptionist profile", usersWithoutProfile.size());
            for (User user : usersWithoutProfile) {
                Receptionist receptionist = Receptionist.builder()
                        .user(user)
                        .fullName(user.getFullName() != null ? user.getFullName() : user.getEmail())
                        .isActive(user.getIsActive() != null ? user.getIsActive() : true)
                        .build();
                receptionistRepository.save(receptionist);
            }
        }
        return ResponseEntity.ok(MessageDTO.success("Synced " + usersWithoutProfile.size() + " receptionist profiles"));
    }

    // ===== Mapper helper =====

    private AdminReceptionistDTO toDTO(Receptionist r) {
        User user = r.getUser();
        return AdminReceptionistDTO.builder()
                .receptionistId(r.getId())
                .userId(user.getId())
                .email(user.getEmail())
                .fullName(r.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .employeeId(r.getEmployeeId())
                .department(r.getDepartment())
                .shift(r.getShift())
                .isActive(r.getIsActive())
                .isVerified(user.getIsVerified())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
