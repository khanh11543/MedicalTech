package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DoctorDocumentDTO;
import com.q2k.meditech.dto.doctor.AdminVerificationDecisionDTO;
import com.q2k.meditech.dto.doctor.DoctorVerificationDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.DoctorDocument;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.VerificationStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.service.DoctorDocumentService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Admin Verification Controller
 * Manages doctor verification review flow (Phases 6-11)
 * Base path: /admin/verifications
 */
@RestController
@RequestMapping("/admin/verifications")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Doctor Verification", description = "APIs for reviewing and managing doctor verifications")
public class AdminVerificationController {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DoctorDocumentService documentService;

    // ======================== PHASE 6: LIST PENDING VERIFICATIONS ========================

    /**
     * GET /api/admin/verifications
     * List doctors with their verification status, filterable
     */
    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "List doctor verifications", description = "Get paginated list of doctor verifications")
    public ResponseEntity<Page<DoctorVerificationDTO>> listVerifications(
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize) {

        log.info("GET /admin/verifications - status: {}", status);

        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        Page<Doctor> doctorPage;
        if (status != null && !status.isBlank()) {
            VerificationStatus vs = VerificationStatus.valueOf(status.toUpperCase());
            doctorPage = doctorRepository.findByVerificationStatus(vs, pageable);
        } else {
            doctorPage = doctorRepository.findAllWithUser(pageable);
        }

        Page<DoctorVerificationDTO> dtoPage = doctorPage.map(this::mapToVerificationDTO);

        return ResponseEntity.ok(dtoPage);
    }

    /**
     * GET /api/admin/verifications/pending
     * Shortcut: only PENDING doctors
     */
    @GetMapping("/pending")
    @Transactional(readOnly = true)
    @Operation(summary = "List pending verifications", description = "Get doctors awaiting admin review")
    public ResponseEntity<List<DoctorVerificationDTO>> listPendingVerifications() {
        log.info("GET /admin/verifications/pending");

        List<Doctor> doctors = doctorRepository.findByVerificationStatus(VerificationStatus.PENDING);
        List<DoctorVerificationDTO> dtoList = doctors.stream()
                .map(this::mapToVerificationDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtoList);
    }

    // ======================== PHASE 7: DETAIL VIEW ========================

    /**
     * GET /api/admin/verifications/{doctorId}
     * Get full doctor verification detail with all documents
     */
    @GetMapping("/{doctorId}")
    @Transactional(readOnly = true)
    @Operation(summary = "Get verification detail", description = "Get doctor profile and all documents for review")
    public ResponseEntity<DoctorVerificationDTO> getVerificationDetail(
            @PathVariable Long doctorId) {

        log.info("GET /admin/verifications/{}", doctorId);

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        DoctorVerificationDTO dto = mapToVerificationDTOWithDocuments(doctor);
        return ResponseEntity.ok(dto);
    }

    // ======================== PHASE 8: ADMIN DECISION ========================

    /**
     * POST /api/admin/verifications/{doctorId}/decision
     * Admin makes a verification decision: APPROVE, REJECT, REQUEST_MORE_DOCUMENTS, SUSPEND, REVOKE
     */
    @PostMapping("/{doctorId}/decision")
    @Transactional
    @Operation(summary = "Make verification decision", description = "Approve, reject, request more docs, suspend, or revoke")
    public ResponseEntity<DoctorVerificationDTO> makeDecision(
            @PathVariable Long doctorId,
            @Valid @RequestBody AdminVerificationDecisionDTO dto) {

        log.info("POST /admin/verifications/{}/decision - {}", doctorId, dto.getDecision());

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        Long adminUserId = SecurityUtil.getCurrentUserId();
        User adminUser = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", adminUserId));

        switch (dto.getDecision().toUpperCase()) {
            case "APPROVE" -> handleApprove(doctor, adminUser);
            case "REJECT" -> handleReject(doctor, adminUser, dto.getReason());
            case "REQUEST_MORE_DOCUMENTS" -> handleRequestMoreDocs(doctor, dto.getReason(), dto.getInstructions());
            case "SUSPEND" -> handleSuspend(doctor, adminUser, dto.getReason());
            case "UNSUSPEND" -> handleUnsuspend(doctor, adminUser);
            case "REVOKE" -> handleRevoke(doctor, adminUser, dto.getReason());
            default -> throw new BadRequestException("Invalid decision: " + dto.getDecision()
                    + ". Must be APPROVE, REJECT, REQUEST_MORE_DOCUMENTS, SUSPEND, UNSUSPEND, or REVOKE");
        }

        doctor = doctorRepository.save(doctor);
        return ResponseEntity.ok(mapToVerificationDTOWithDocuments(doctor));
    }

    // ======================== DECISION HANDLERS ========================

    private void handleApprove(Doctor doctor, User adminUser) {
        if (doctor.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BadRequestException("Can only approve PENDING doctors. Current: " + doctor.getVerificationStatus());
        }

        doctor.setVerificationStatus(VerificationStatus.VERIFIED);
        doctor.setVerifiedAt(LocalDateTime.now());
        doctor.setVerifiedBy(adminUser);
        doctor.setRejectionReason(null);
        doctor.setIsAvailable(true);

        // Also activate user account if not already
        User user = doctor.getUser();
        if (user != null && !Boolean.TRUE.equals(user.getIsActive())) {
            user.setIsActive(true);
            userRepository.save(user);
        }

        log.info("Doctor {} APPROVED by admin {}", doctor.getId(), adminUser.getId());
    }

    private void handleReject(Doctor doctor, User adminUser, String reason) {
        if (doctor.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BadRequestException("Can only reject PENDING doctors. Current: " + doctor.getVerificationStatus());
        }

        doctor.setVerificationStatus(VerificationStatus.REJECTED);
        doctor.setRejectionReason(reason);
        doctor.setVerifiedBy(adminUser);
        doctor.setIsAvailable(false);

        log.info("Doctor {} REJECTED by admin {}: {}", doctor.getId(), adminUser.getId(), reason);
    }

    private void handleRequestMoreDocs(Doctor doctor, String reason, String instructions) {
        if (doctor.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BadRequestException("Can only request more documents from PENDING doctors. Current: " + doctor.getVerificationStatus());
        }

        String fullReason = reason != null ? reason : "";
        if (instructions != null && !instructions.isBlank()) {
            fullReason += (fullReason.isEmpty() ? "" : "\n---\n") + "Instructions: " + instructions;
        }

        doctor.setVerificationStatus(VerificationStatus.AWAITING_DOCUMENTS);
        doctor.setRejectionReason(fullReason);
        doctor.setSubmittedAt(null);

        log.info("Doctor {} - REQUEST MORE DOCUMENTS", doctor.getId());
    }

    private void handleSuspend(Doctor doctor, User adminUser, String reason) {
        if (doctor.getVerificationStatus() != VerificationStatus.VERIFIED
                && doctor.getVerificationStatus() != VerificationStatus.APPROVED) {
            throw new BadRequestException("Can only suspend VERIFIED/APPROVED doctors. Current: " + doctor.getVerificationStatus());
        }

        doctor.setVerificationStatus(VerificationStatus.SUSPENDED);
        doctor.setRejectionReason(reason);
        doctor.setVerifiedBy(adminUser);
        doctor.setIsAvailable(false);

        log.info("Doctor {} SUSPENDED by admin {}: {}", doctor.getId(), adminUser.getId(), reason);
    }

    private void handleUnsuspend(Doctor doctor, User adminUser) {
        if (doctor.getVerificationStatus() != VerificationStatus.SUSPENDED) {
            throw new BadRequestException("Can only unsuspend SUSPENDED doctors. Current: " + doctor.getVerificationStatus());
        }

        doctor.setVerificationStatus(VerificationStatus.VERIFIED);
        doctor.setRejectionReason(null);
        doctor.setVerifiedBy(adminUser);
        doctor.setVerifiedAt(LocalDateTime.now());
        doctor.setIsAvailable(true);

        // Reactivate user account
        User user = doctor.getUser();
        if (user != null && !Boolean.TRUE.equals(user.getIsActive())) {
            user.setIsActive(true);
            userRepository.save(user);
        }

        log.info("Doctor {} UNSUSPENDED by admin {}", doctor.getId(), adminUser.getId());
    }

    private void handleRevoke(Doctor doctor, User adminUser, String reason) {
        doctor.setVerificationStatus(VerificationStatus.REVOKED);
        doctor.setRejectionReason(reason);
        doctor.setVerifiedBy(adminUser);
        doctor.setIsAvailable(false);

        log.info("Doctor {} REVOKED by admin {}: {}", doctor.getId(), adminUser.getId(), reason);
    }

    // ======================== MAPPERS ========================

    private DoctorVerificationDTO mapToVerificationDTO(Doctor doctor) {
        DoctorDocumentService.DocumentVerificationSummary summary =
                documentService.getVerificationSummary(doctor.getId());

        return DoctorVerificationDTO.builder()
                .doctorId(doctor.getId())
                .fullName(doctor.getFullName())
                .email(doctor.getUser() != null ? doctor.getUser().getEmail() : null)
                .avatarUrl(doctor.getUser() != null ? doctor.getUser().getAvatarUrl() : null)
                .specialization(doctor.getSpecialization())
                .licenseNumber(doctor.getLicenseNumber())
                .experienceYears(doctor.getExperienceYears())
                .education(doctor.getEducation())
                .bio(doctor.getBio())
                .hospitalAffiliation(doctor.getHospitalAffiliation())
                .officeAddress(doctor.getOfficeAddress())
                .verificationStatus(doctor.getVerificationStatus().name())
                .rejectionReason(doctor.getRejectionReason())
                .submittedAt(doctor.getSubmittedAt())
                .verifiedAt(doctor.getVerifiedAt())
                .verifiedByEmail(doctor.getVerifiedBy() != null ? doctor.getVerifiedBy().getEmail() : null)
                .createdAt(doctor.getCreatedAt())
                .totalDocuments(summary.totalDocuments())
                .approvedDocuments(summary.approvedCount())
                .pendingDocuments(summary.pendingCount())
                .rejectedDocuments(summary.rejectedCount())
                .build();
    }

    private DoctorVerificationDTO mapToVerificationDTOWithDocuments(Doctor doctor) {
        DoctorVerificationDTO dto = mapToVerificationDTO(doctor);

        // Add inline documents
        List<DoctorDocument> docs = doctor.getDocuments();
        if (docs != null) {
            List<DoctorVerificationDTO.DocumentItem> items = docs.stream()
                    .map(d -> DoctorVerificationDTO.DocumentItem.builder()
                            .id(d.getId())
                            .docType(d.getDocType() != null ? d.getDocType().name() : null)
                            .docTypeDescription(getDocTypeDescription(d.getDocType() != null ? d.getDocType().name() : null))
                            .fileUrl(d.getFileUrl())
                            .status(d.getStatus() != null ? d.getStatus().name() : null)
                            .reviewNote(d.getReviewNote())
                            .reviewedAt(d.getReviewedAt())
                            .reviewedByEmail(d.getReviewedBy() != null ? d.getReviewedBy().getEmail() : null)
                            .createdAt(d.getCreatedAt())
                            .build())
                    .collect(Collectors.toList());
            dto.setDocuments(items);
        }

        return dto;
    }

    private String getDocTypeDescription(String docType) {
        if (docType == null) return null;
        return switch (docType) {
            case "LICENSE" -> "Practice License";
            case "ID" -> "ID Card (CCCD/CMND)";
            case "DEGREE" -> "Degree/Diploma";
            case "EXPERIENCE" -> "Experience Certificate";
            case "AFFILIATION_PROOF" -> "Employment Confirmation";
            default -> docType;
        };
    }
}
