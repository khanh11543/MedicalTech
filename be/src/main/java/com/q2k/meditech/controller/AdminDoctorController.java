package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DoctorBasicDTO;
import com.q2k.meditech.dto.UpdateDoctorSpecialtiesDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.service.UserServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Provides doctor management endpoints for admin features
 */
@Slf4j
@RestController
@RequestMapping("/admin/doctors")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDoctorController {

    private final DoctorRepository doctorRepository;
    private final UserServiceImpl userService;

    /**
     * GET /api/admin/doctors/list
     * Returns a lightweight list of all active doctors.
     */
    @GetMapping("/list")
    @Transactional(readOnly = true)
    public ResponseEntity<List<DoctorBasicDTO>> getDoctorsList() {
        List<Doctor> doctors = doctorRepository.findActiveWithUser();
        List<DoctorBasicDTO> result = doctors.stream()
                .map(d -> DoctorBasicDTO.builder()
                        .id(d.getId())
                        .fullName(d.getFullName())
                        .email(d.getUser().getEmail())
                        .avatar(d.getUser().getAvatarUrl())
                        .specialization(d.getSpecialization())
                        .build())
                .toList();
        return ResponseEntity.ok(result);
    }

    /**
     * PUT /api/admin/doctors/{doctorId}/specialties
     * Update specialties/departments for a doctor.
     */
    @PutMapping("/{doctorId}/specialties")
    @Transactional
    public ResponseEntity<Map<String, String>> updateDoctorSpecialties(
            @PathVariable Long doctorId,
            @Valid @RequestBody UpdateDoctorSpecialtiesDTO dto) {

        log.info("PUT /admin/doctors/{}/specialties - specialtyIds: {}, primary: {}",
                doctorId, dto.getSpecialtyIds(), dto.getPrimarySpecialtyId());

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        userService.assignSpecialtiesToDoctor(doctor, dto.getSpecialtyIds(), dto.getPrimarySpecialtyId());
        doctorRepository.save(doctor);

        return ResponseEntity.ok(Map.of("message", "Doctor specialties updated successfully"));
    }
}
