package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MedicalRecordDTO;
import com.q2k.meditech.entity.MedicalRecord;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.MedicalRecordRepository;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Patient Medical Records Controller
 * Provides read-only access to medical records for the authenticated patient.
 */
@RestController
@RequestMapping("/patient/medical-records")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Patient - Medical Records", description = "APIs for patients to view their medical records")
public class PatientMedicalRecordController {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final MedicalRecordRepository medicalRecordRepository;

    /**
     * GET /api/patient/medical-records
     * List medical records with pagination
     */
    @GetMapping
    @Operation(summary = "List my medical records", description = "Get paginated list of my medical records")
    public ResponseEntity<Page<MedicalRecordDTO>> getMyRecords(
            @Parameter(description = "From date (yyyy-MM-dd)") @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)") @RequestParam(required = false) String to,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int pageSize) {

        Long patientId = getAuthenticatedPatientId();
        log.info("GET /patient/medical-records for patientId: {}", patientId);

        PageRequest pageRequest = PageRequest.of(pageNumber, pageSize, Sort.by("visitDate").descending());
        Page<MedicalRecord> records;

        if (from != null && to != null) {
            records = medicalRecordRepository.findByPatientIdAndDateRange(
                    patientId, LocalDate.parse(from), LocalDate.parse(to), pageRequest);
        } else {
            records = medicalRecordRepository.findByPatientId(patientId, pageRequest);
        }

        return ResponseEntity.ok(records.map(this::toDTO));
    }

    /**
     * GET /api/patient/medical-records/{id}
     * Get medical record detail (ownership verified)
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get medical record detail", description = "Get detailed information about a specific medical record")
    public ResponseEntity<MedicalRecordDTO> getRecordDetail(@PathVariable Long id) {
        Long patientId = getAuthenticatedPatientId();
        log.info("GET /patient/medical-records/{} for patientId: {}", id, patientId);

        MedicalRecord record = medicalRecordRepository.findByIdAndPatientId(id, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        return ResponseEntity.ok(toDTO(record));
    }

    // ==================== HELPER METHODS ====================

    private Long getAuthenticatedPatientId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Patient patient = patientRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
        return patient.getId();
    }

    private MedicalRecordDTO toDTO(MedicalRecord mr) {
        return MedicalRecordDTO.builder()
                .id(mr.getId())
                .recordCode(mr.getRecordCode())
                .doctorId(mr.getDoctor() != null ? mr.getDoctor().getId() : null)
                .doctorName(mr.getDoctor() != null ? mr.getDoctor().getFullName() : null)
                .appointmentId(mr.getAppointment() != null ? mr.getAppointment().getId() : null)
                .visitDate(mr.getVisitDate())
                .chiefComplaint(mr.getChiefComplaint())
                .presentIllness(mr.getPresentIllness())
                .vitalSigns(mr.getVitalSigns())
                .physicalExam(mr.getPhysicalExam())
                .diagnosis(mr.getDiagnosis())
                .diagnosisCode(mr.getDiagnosisCode())
                .treatmentPlan(mr.getTreatmentPlan())
                .prescription(mr.getPrescription())
                .labResults(mr.getLabResults())
                .followUpDate(mr.getFollowUpDate())
                .followUpNotes(mr.getFollowUpNotes())
                .attachments(mr.getAttachments())
                .isConfidential(mr.getIsConfidential())
                .createdAt(mr.getCreatedAt())
                .updatedAt(mr.getUpdatedAt())
                .build();
    }
}
