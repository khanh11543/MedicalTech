package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MedicationDTO;
import com.q2k.meditech.service.MedicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Doctor Medication Controller
 * Base path: /api/doctor/medications
 * Read-only: doctor can search active medications for prescriptions
 */
@RestController
@RequestMapping("/doctor/medications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor - Medication Search", description = "Doctor read-only medication search for prescriptions")
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorMedicationController {

    private final MedicationService medicationService;

    @GetMapping("/search")
    @Operation(summary = "Search active medications for prescribing")
    public ResponseEntity<Page<MedicationDTO>> searchMedications(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Doctor searching medications: {}", search);
        return ResponseEntity.ok(medicationService.searchForDoctor(search, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get active medication detail")
    public ResponseEntity<MedicationDTO> getMedication(@PathVariable Long id) {
        MedicationDTO dto = medicationService.getMedicationById(id);
        if (!Boolean.TRUE.equals(dto.getIsActive())) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }
}
