package com.q2k.meditech.controller;

import com.q2k.meditech.dto.AppointmentDTO;
import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.service.ReceptionistPatientService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller for Receptionist patient operations (TAB 3).
 * Supports: All Patients, New Patients, Frequent Patients,
 * Patient Detail (Appointments, Clinical Summary, Documents, Communications, Payments),
 * Statistics, Quick-book, and Messaging.
 */
@Slf4j
@RestController
@RequestMapping("/receptionist/patients")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECEPTIONIST')")
@Tag(name = "Receptionist - Patients", description = "Full patient management for receptionist role")
public class ReceptionistPatientController {

    private final ReceptionistPatientService patientService;

    // ==================== 3.1 ALL PATIENTS ====================

    /**
     * List all patients with filtering + pagination
     * GET /api/receptionist/patients?search=xxx&gender=MALE&isActive=true&hasInsurance=true
     */
    @GetMapping
    @Operation(summary = "List all patients", description = "Paginated list with search, gender, active status, and insurance filters")
    public ResponseEntity<Page<PatientListDTO>> listAllPatients(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) Boolean hasInsurance,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        log.info("GET /receptionist/patients - search: {}, gender: {}, active: {}, insured: {}",
                search, gender, isActive, hasInsurance);

        return ResponseEntity.ok(patientService.listAllPatients(search, gender, isActive, hasInsurance, pageable));
    }

    /**
     * Search patients by name, phone, or email (minimum 3 chars) — refactored to DB-level search
     * GET /api/receptionist/patients/search?q=xxx
     */
    @GetMapping("/search")
    @Operation(summary = "Search patients", description = "Search patients by name, phone, or email (min 3 characters, privacy-safe results)")
    public ResponseEntity<Page<PatientBasicDTO>> searchPatients(
            @RequestParam("q") String query,
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("GET /receptionist/patients/search?q={}", query);
        return ResponseEntity.ok(patientService.searchPatients(query, pageable));
    }

    /**
     * Create a new walk-in patient (demographic only) — refactored to service layer
     * POST /api/receptionist/patients
     */
    @PostMapping
    @Operation(summary = "Create walk-in patient", description = "Create a new patient record for walk-in patients (creates User + Patient)")
    public ResponseEntity<PatientBasicDTO> createPatient(
            @Valid @RequestBody CreatePatientDTO dto) {

        log.info("POST /receptionist/patients - name: {}, phone: {}", dto.getName(), dto.getPhone());
        PatientBasicDTO result = patientService.createPatient(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    // ==================== PATIENT DETAIL ====================

    /**
     * Get full patient detail with audit logging
     * GET /api/receptionist/patients/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get patient detail", description = "Full patient profile with stats (logged as audit event)")
    public ResponseEntity<PatientDetailDTO> getPatientDetail(
            @PathVariable Long id) {

        Long viewerUserId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(patientService.getPatientDetail(id, viewerUserId));
    }

    /**
     * Update patient demographic (restricted fields only)
     * PUT /api/receptionist/patients/{id}/demographic
     */
    @PutMapping("/{id}/demographic")
    @Operation(summary = "Update patient demographic", description = "Update phone, email, address, insurance, emergency contact (NOT name/DOB/gender/MRN)")
    public ResponseEntity<PatientDetailDTO> updateDemographic(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePatientDemographicDTO dto) {

        Long updaterUserId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(patientService.updateDemographic(id, dto, updaterUserId));
    }

    /**
     * Soft-deactivate a patient account
     * PATCH /api/receptionist/patients/{id}/deactivate
     */
    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate patient", description = "Soft-deactivate patient account (sets user.isActive = false)")
    public ResponseEntity<Void> deactivatePatient(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        patientService.deactivatePatient(id, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Reactivate a previously deactivated patient
     * PATCH /api/receptionist/patients/{id}/reactivate
     */
    @PatchMapping("/{id}/reactivate")
    @Operation(summary = "Reactivate patient", description = "Reactivate a previously deactivated patient account")
    public ResponseEntity<Void> reactivatePatient(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        patientService.reactivatePatient(id, userId);
        return ResponseEntity.noContent().build();
    }

    // ==================== 3.2 NEW PATIENTS ====================

    /**
     * List new patients registered this month
     * GET /api/receptionist/patients/new
     */
    @GetMapping("/new")
    @Operation(summary = "List new patients", description = "Patients registered in the current month")
    public ResponseEntity<Page<NewPatientDTO>> getNewPatients(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(patientService.getNewPatients(pageable));
    }

    // ==================== 3.3 FREQUENT PATIENTS ====================

    /**
     * List frequent patients (3+ visits by default)
     * GET /api/receptionist/patients/frequent?minVisits=3&lapsedDays=60&search=...
     */
    @GetMapping("/frequent")
    @Operation(summary = "List frequent patients",
               description = "Patients with minimum N visits (default 3). " +
                       "Use lapsedDays to filter patients whose last visit was >= N days ago. " +
                       "Use search to filter by name/MRN.")
    public ResponseEntity<Page<FrequentPatientDTO>> getFrequentPatients(
            @RequestParam(required = false, defaultValue = "3") Long minVisits,
            @RequestParam(required = false) Long lapsedDays,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {

        return ResponseEntity.ok(patientService.getFrequentPatients(minVisits, lapsedDays, search, pageable));
    }

    // ==================== PATIENT DETAIL TABS ====================

    /**
     * Get patient's appointment history
     * GET /api/receptionist/patients/{id}/appointments
     */
    @GetMapping("/{id}/appointments")
    @Operation(summary = "Patient appointments", description = "Paginated appointment history for a patient")
    public ResponseEntity<Page<AppointmentDTO>> getPatientAppointments(
            @PathVariable Long id,
            @PageableDefault(size = 10, sort = "appointmentDate", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(patientService.getPatientAppointments(id, pageable));
    }

    /**
     * Get patient's clinical summary (counts only — no sensitive data)
     * GET /api/receptionist/patients/{id}/clinical-summary
     */
    @GetMapping("/{id}/clinical-summary")
    @Operation(summary = "Clinical summary", description = "Aggregated clinical counts (medical records, prescriptions, visits) — no type details")
    public ResponseEntity<PatientClinicalSummaryDTO> getClinicalSummary(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.getClinicalSummary(id));
    }

    /**
     * Get patient's admin documents (ID card, insurance card, consent forms)
     * GET /api/receptionist/patients/{id}/documents
     */
    @GetMapping("/{id}/documents")
    @Operation(summary = "Patient documents", description = "Administrative documents (ID card, insurance, consent forms)")
    public ResponseEntity<List<PatientDocumentDTO>> getPatientDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.getPatientDocuments(id));
    }

    /**
     * Upload a new admin document for a patient
     * POST /api/receptionist/patients/{id}/documents
     */
    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload document", description = "Upload admin document (ID card, insurance card, consent form)")
    public ResponseEntity<PatientDocumentDTO> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "notes", required = false) String notes) {

        Long uploaderUserId = SecurityUtil.getCurrentUserId();
        UploadPatientDocumentDTO dto = UploadPatientDocumentDTO.builder()
                .documentType(documentType)
                .notes(notes)
                .build();
        PatientDocumentDTO result = patientService.uploadDocument(id, file, dto, uploaderUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Get patient's communication log (emails/SMS sent)
     * GET /api/receptionist/patients/{id}/communications
     */
    @GetMapping("/{id}/communications")
    @Operation(summary = "Communication log", description = "History of emails and SMS messages sent to this patient")
    public ResponseEntity<Page<PatientCommunicationDTO>> getCommunicationLog(
            @PathVariable Long id,
            @PageableDefault(size = 10, sort = "sentAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(patientService.getCommunicationLog(id, pageable));
    }

    /**
     * Send a template-based message (email/SMS) to a patient
     * POST /api/receptionist/patients/{id}/send-message
     */
    @PostMapping("/{id}/send-message")
    @Operation(summary = "Send message", description = "Send a template-based email or SMS to a patient")
    public ResponseEntity<Void> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendTemplateMessageDTO dto) {

        Long senderUserId = SecurityUtil.getCurrentUserId();
        patientService.sendMessage(id, dto, senderUserId);
        return ResponseEntity.ok().build();
    }

    /**
     * Get patient's payment history (read-only)
     * GET /api/receptionist/patients/{id}/payments
     */
    @GetMapping("/{id}/payments")
    @Operation(summary = "Payment history", description = "Read-only payment history for a patient")
    public ResponseEntity<Page<PatientPaymentHistoryDTO>> getPaymentHistory(
            @PathVariable Long id,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(patientService.getPaymentHistory(id, pageable));
    }

    /**
     * Download receipt PDF for a specific payment
     * GET /api/receptionist/patients/{id}/payments/{paymentId}/receipt
     */
    @GetMapping("/{id}/payments/{paymentId}/receipt")
    @Operation(summary = "Download receipt", description = "Download PDF receipt for a specific payment")
    public ResponseEntity<byte[]> getReceiptPdf(
            @PathVariable Long id,
            @PathVariable Long paymentId) {

        byte[] pdfBytes = patientService.getReceiptPdf(id, paymentId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=receipt_" + paymentId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    // ==================== STATISTICS ====================

    /**
     * Get patient statistics overview
     * GET /api/receptionist/patients/stats
     */
    @GetMapping("/stats")
    @Operation(summary = "Patient statistics", description = "Overview stats: total, active, deactivated, new this month, insured/uninsured, by gender")
    public ResponseEntity<PatientStatsDTO> getPatientStats() {
        return ResponseEntity.ok(patientService.getPatientStats());
    }

    // ==================== MESSAGE TEMPLATES ====================

    /**
     * Get available message templates
     * GET /api/receptionist/patients/message-templates
     */
    @GetMapping("/message-templates")
    @Operation(summary = "Message templates", description = "List available email/SMS templates for patient communication")
    public ResponseEntity<List<NotificationTemplateDTO>> getMessageTemplates() {
        return ResponseEntity.ok(patientService.getMessageTemplates());
    }

    // ==================== QUICK BOOK ====================

    /**
     * Quick-book an appointment from patient detail page
     * POST /api/receptionist/patients/{id}/appointments/quick-book
     */
    @PostMapping("/{id}/appointments/quick-book")
    @Operation(summary = "Quick-book appointment", description = "Quick-book an appointment for a patient from the patient detail page")
    public ResponseEntity<AppointmentDTO> quickBookAppointment(
            @PathVariable Long id,
            @Valid @RequestBody QuickBookAppointmentDTO dto) {

        Long bookerUserId = SecurityUtil.getCurrentUserId();
        AppointmentDTO result = patientService.quickBookAppointment(id, dto, bookerUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}
