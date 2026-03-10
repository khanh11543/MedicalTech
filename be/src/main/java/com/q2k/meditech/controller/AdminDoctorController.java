package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DoctorBasicDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Provides lightweight doctor lookup endpoints for admin features
 * (time-slot management, appointment management, etc.)
 */
@RestController
@RequestMapping("/admin/doctors")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDoctorController {

    private final DoctorRepository doctorRepository;

    /**
     * GET /api/admin/doctors/list
     * Returns a lightweight list of all active doctors (id, name, email, avatar, specialization).
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
}
