package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.MedicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Admin Medication Management Controller
 * Base path: /api/admin/medications
 */
@RestController
@RequestMapping("/admin/medications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Medication Management", description = "APIs for managing medications and inventory")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMedicationController {

    private final MedicationService medicationService;

    @GetMapping
    @Operation(summary = "List all medications with filters")
    public ResponseEntity<Page<MedicationDTO>> getAllMedications(
            @Parameter(description = "Search by name, code, or generic name")
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean requiresPrescription,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        log.info("Admin listing medications - search: {}, category: {}", search, category);
        return ResponseEntity.ok(medicationService.getAllMedications(
                search, category, requiresPrescription, isActive, sortBy, sortDir, page, size));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get medication by ID")
    public ResponseEntity<MedicationDTO> getMedicationById(@PathVariable Long id) {
        return ResponseEntity.ok(medicationService.getMedicationById(id));
    }

    @GetMapping("/next-code")
    @Operation(summary = "Get next medication code (auto-generated)")
    public ResponseEntity<String> getNextCode() {
        return ResponseEntity.ok(medicationService.getNextMedicationCode());
    }

    @PostMapping
    @Operation(summary = "Create new medication")
    public ResponseEntity<MedicationDTO> createMedication(@Valid @RequestBody MedicationCreateDTO dto) {
        log.info("Admin creating medication: {}", dto.getCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(medicationService.createMedication(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update medication information")
    public ResponseEntity<MedicationDTO> updateMedication(
            @PathVariable Long id,
            @Valid @RequestBody MedicationUpdateDTO dto
    ) {
        log.info("Admin updating medication ID: {}", id);
        return ResponseEntity.ok(medicationService.updateMedication(id, dto));
    }

    @PatchMapping("/{id}/inventory")
    @Operation(summary = "Update inventory (IMPORT adds quantity, ADJUST sets it)")
    public ResponseEntity<MedicationDTO> updateInventory(
            @PathVariable Long id,
            @Valid @RequestBody InventoryUpdateDTO dto
    ) {
        log.info("Admin updating inventory for medication ID: {}", id);
        return ResponseEntity.ok(medicationService.updateInventory(id, dto));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Toggle medication active/inactive status")
    public ResponseEntity<MedicationDTO> toggleStatus(@PathVariable Long id) {
        log.info("Admin toggling status for medication ID: {}", id);
        return ResponseEntity.ok(medicationService.toggleStatus(id));
    }

    @GetMapping("/{id}/inventory/logs")
    @Operation(summary = "Get inventory change history for a medication")
    public ResponseEntity<Page<InventoryLogDTO>> getInventoryLogs(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(medicationService.getInventoryLogs(id, page, size));
    }

    @GetMapping("/inventory/summary")
    @Operation(summary = "Get overall inventory summary stats")
    public ResponseEntity<InventorySummaryDTO> getInventorySummary() {
        return ResponseEntity.ok(medicationService.getInventorySummary());
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import medications from CSV/Excel (.csv/.xlsx)")
    public ResponseEntity<MedicationImportResultDTO> importMedications(
            @RequestPart("file") MultipartFile file
    ) {
        log.info("Admin importing medications from file: {}", file != null ? file.getOriginalFilename() : null);
        return ResponseEntity.ok(medicationService.importMedications(file));
    }
}
