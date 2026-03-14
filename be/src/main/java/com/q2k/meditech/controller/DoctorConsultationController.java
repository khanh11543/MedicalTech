package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.ConsultationService;
import com.q2k.meditech.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Controller for Doctor consultation operations
 * Endpoints for managing medical consultation records, amendments, and attachments
 */
@RestController
@RequestMapping("/doctor/consultations")
@RequiredArgsConstructor
public class DoctorConsultationController {
    
    private final ConsultationService consultationService;
    
    /**
     * Get all draft consultations for the current doctor
     * GET /api/doctor/consultations/drafts
     */
    @GetMapping("/drafts")
    public ResponseEntity<List<ConsultationDTO>> getDraftConsultations() {
        Long doctorId = SecurityUtil.getCurrentUserId();
        List<ConsultationDTO> drafts = consultationService.getDraftConsultationsByDoctor(doctorId);
        return ResponseEntity.ok(drafts);
    }
    
    /**
     * Get consultation record for an appointment
     * GET /api/appointments/{appointmentId}/consultation
     */
    @GetMapping
    @RequestMapping("/{appointmentId}")
    public ResponseEntity<ConsultationDTO> getConsultation(@PathVariable Long appointmentId) {
        ConsultationDTO consultation = consultationService.getConsultationByAppointmentId(appointmentId);
        return ResponseEntity.ok(consultation);
    }
    
    /**
     * Save draft consultation
     * POST /api/appointments/{appointmentId}/consultation/draft
     */
    @PostMapping
    @RequestMapping("/{appointmentId}/draft")
    public ResponseEntity<ConsultationDTO> saveDraftConsultation(
            @PathVariable Long appointmentId,
            @RequestBody ConsultationCreateUpdateDTO consultationData) {
        ConsultationDTO saved = consultationService.updateConsultationDraft(appointmentId, consultationData);
        return ResponseEntity.ok(saved);
    }
    
    /**
     * Finalize consultation and lock record
     * POST /api/appointments/{appointmentId}/consultation/finalize
     */
    @PostMapping
    @RequestMapping("/{appointmentId}/finalize")
    public ResponseEntity<ConsultationDTO> finalizeConsultation(
            @PathVariable Long appointmentId,
            @RequestBody ConsultationCreateUpdateDTO consultationData) {
        ConsultationDTO finalized = consultationService.finalizeConsultationWithData(appointmentId, consultationData);
        return ResponseEntity.ok(finalized);
    }
    
    /**
     * Add amendment to finalized consultation
     * POST /api/appointments/{appointmentId}/consultation/amendments
     */
    @PostMapping("/{appointmentId}/amendments")
    public ResponseEntity<AmendmentDTO> addAmendment(
            @PathVariable Long appointmentId,
            @RequestBody AmendmentCreateDTO amendmentData) {
        AmendmentDTO amendment = consultationService.addAmendmentByAppointmentId(appointmentId, amendmentData.getContent());
        return ResponseEntity.ok(amendment);
    }
    
    /**
     * Get all amendments for a consultation
     * GET /api/appointments/{appointmentId}/consultation/amendments
     */
    @GetMapping("/{appointmentId}/amendments")
    public ResponseEntity<List<AmendmentDTO>> getAmendments(@PathVariable Long appointmentId) {
        List<AmendmentDTO> amendments = consultationService.getAmendmentsByAppointmentId(appointmentId);
        return ResponseEntity.ok(amendments);
    }
    
    /**
     * Sign/approve an amendment
     * POST /api/appointments/{appointmentId}/consultation/amendments/{amendmentId}/sign
     */
    @PostMapping
    @RequestMapping("/{appointmentId}/amendments/{amendmentId}/sign")
    public ResponseEntity<AmendmentDTO> signAmendment(
            @PathVariable Long appointmentId,
            @PathVariable String amendmentId) {
        AmendmentDTO signed = consultationService.signAmendment(appointmentId, amendmentId);
        return ResponseEntity.ok(signed);
    }
    
    /**
     * Upload attachment to consultation
     * POST /api/appointments/{appointmentId}/consultation/attachments
     */
    @PostMapping
    @RequestMapping("/{appointmentId}/attachments")
    public ResponseEntity<ConsultationAttachmentDTO> uploadAttachment(
            @PathVariable Long appointmentId,
            @RequestParam("file") MultipartFile file) throws IOException {
        ConsultationAttachmentDTO attachment = consultationService.uploadAttachment(appointmentId, file);
        return ResponseEntity.ok(attachment);
    }
    
    /**
     * Delete attachment from consultation
     * DELETE /api/appointments/{appointmentId}/consultation/attachments/{attachmentId}
     */
    @DeleteMapping("/{appointmentId}/attachments/{attachmentId}")
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable Long appointmentId,
            @PathVariable Long attachmentId) {
        consultationService.deleteAttachment(attachmentId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Print consultation summary (generates PDF)
     * GET /api/appointments/{appointmentId}/consultation/summary/print
     */
    @GetMapping
    @RequestMapping("/{appointmentId}/summary/print")
    public ResponseEntity<byte[]> printSummary(@PathVariable Long appointmentId) {
        // This would generate a PDF, implementation depends on your PDF library
        // For now, returning a placeholder response
        return ResponseEntity.ok(new byte[0]);
    }
}
