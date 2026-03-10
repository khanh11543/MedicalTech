package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DoctorDocumentCreateDTO;
import com.q2k.meditech.dto.DoctorDocumentDTO;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.doctor.DoctorProfileDTO;
import com.q2k.meditech.dto.doctor.UpdateDoctorProfileDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.enums.VerificationStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.service.DoctorDocumentService;
import com.q2k.meditech.service.DoctorProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * Doctor Profile Setup Controller
 * Handles Phase 3 (profile completion), Phase 4 (document upload), Phase 5 (submit verification)
 * Base path: /doctor/profile
 */
@RestController
@RequestMapping("/doctor/profile")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor - Profile Setup", description = "APIs for doctor profile completion and verification submission")
public class DoctorProfileSetupController {

    private final DoctorProfileService doctorProfileService;
    private final DoctorRepository doctorRepository;
    private final DoctorDocumentService documentService;

    private static final String UPLOAD_DIR = "uploads";
    private static final Set<String> ALLOWED_DOC_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif", "image/webp",
            "application/pdf"
    );
    private static final long MAX_DOC_SIZE = 10 * 1024 * 1024; // 10MB

    // ======================== PHASE 3: GET & UPDATE PROFILE ========================

    /**
     * GET /api/doctor/profile
     * Get doctor's own profile with completeness info
     */
    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Get my profile", description = "Get current doctor's profile with verification status")
    public ResponseEntity<DoctorProfileDTO> getMyProfile() {
        Doctor doctor = doctorProfileService.requireDoctor();
        DoctorDocumentService.DocumentVerificationSummary docSummary =
                documentService.getVerificationSummary(doctor.getId());

        DoctorProfileDTO dto = mapToProfileDTO(doctor, docSummary);
        return ResponseEntity.ok(dto);
    }

    /**
     * PUT /api/doctor/profile
     * Update doctor's professional profile
     * Only allowed when status is AWAITING_DOCUMENTS or REJECTED
     */
    @PutMapping
    @Transactional
    @Operation(summary = "Update my profile", description = "Update professional profile information")
    public ResponseEntity<DoctorProfileDTO> updateMyProfile(
            @Valid @RequestBody UpdateDoctorProfileDTO dto) {

        Doctor doctor = doctorProfileService.requireDoctor();

        // Only allow editing when awaiting documents or rejected
        if (doctor.getVerificationStatus() != VerificationStatus.AWAITING_DOCUMENTS
                && doctor.getVerificationStatus() != VerificationStatus.REJECTED) {
            throw new BadRequestException(
                    "Profile can only be edited when status is AWAITING_DOCUMENTS or REJECTED. Current: "
                            + doctor.getVerificationStatus());
        }

        // Update fields (only non-null values)
        if (dto.getSpecialization() != null) doctor.setSpecialization(dto.getSpecialization());
        if (dto.getLicenseNumber() != null) doctor.setLicenseNumber(dto.getLicenseNumber());
        if (dto.getExperienceYears() != null) doctor.setExperienceYears(dto.getExperienceYears());
        if (dto.getEducation() != null) doctor.setEducation(dto.getEducation());
        if (dto.getBio() != null) doctor.setBio(dto.getBio());
        if (dto.getHospitalAffiliation() != null) doctor.setHospitalAffiliation(dto.getHospitalAffiliation());
        if (dto.getOfficeAddress() != null) doctor.setOfficeAddress(dto.getOfficeAddress());

        // If rejected, reset back to awaiting documents
        if (doctor.getVerificationStatus() == VerificationStatus.REJECTED) {
            doctor.setVerificationStatus(VerificationStatus.AWAITING_DOCUMENTS);
            doctor.setRejectionReason(null);
        }

        doctor = doctorRepository.save(doctor);

        DoctorDocumentService.DocumentVerificationSummary docSummary =
                documentService.getVerificationSummary(doctor.getId());

        return ResponseEntity.ok(mapToProfileDTO(doctor, docSummary));
    }

    // ======================== PHASE 4: FILE UPLOAD ========================

    /**
     * POST /api/doctor/profile/upload-document
     * Upload a document file and create a document record
     */
    @PostMapping("/upload-document")
    @Operation(summary = "Upload document file", description = "Upload a verification document file")
    public ResponseEntity<DoctorDocumentDTO> uploadDocumentFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("docType") String docType) {

        Doctor doctor = doctorProfileService.requireDoctor();

        // Validate file
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getSize() > MAX_DOC_SIZE) {
            throw new BadRequestException("File size exceeds 10MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_DOC_TYPES.contains(contentType)) {
            throw new BadRequestException("Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF");
        }

        try {
            // Save file to disk
            Path docDir = Paths.get(UPLOAD_DIR, "documents", String.valueOf(doctor.getId()));
            Files.createDirectories(docDir);

            String originalName = file.getOriginalFilename();
            String extension = "";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String filename = docType.toLowerCase() + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;
            Path filePath = docDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "/uploads/documents/" + doctor.getId() + "/" + filename;

            // Create document record via existing service
            DoctorDocumentCreateDTO createDTO = DoctorDocumentCreateDTO.builder()
                    .docType(docType)
                    .fileUrl(fileUrl)
                    .build();

            DoctorDocumentDTO result = documentService.uploadDocument(doctor.getId(), createDTO);
            return ResponseEntity.ok(result);

        } catch (IOException e) {
            log.error("Failed to save document file", e);
            throw new BadRequestException("Failed to upload file: " + e.getMessage());
        }
    }

    // ======================== PHASE 5: SUBMIT FOR VERIFICATION ========================

    /**
     * POST /api/doctor/profile/submit-verification
     * Submit profile for admin verification
     * Validates all required fields and documents are present
     */
    @PostMapping("/submit-verification")
    @Transactional
    @Operation(summary = "Submit for verification", description = "Submit profile and documents for admin review")
    public ResponseEntity<DoctorProfileDTO> submitForVerification() {
        Doctor doctor = doctorProfileService.requireDoctor();

        // Only allow submission from AWAITING_DOCUMENTS status
        if (doctor.getVerificationStatus() != VerificationStatus.AWAITING_DOCUMENTS) {
            throw new BadRequestException(
                    "Can only submit for verification when status is AWAITING_DOCUMENTS. Current: "
                            + doctor.getVerificationStatus());
        }

        // Validate required profile fields
        validateProfileFields(doctor);

        // Validate required documents uploaded
        DoctorDocumentService.DocumentVerificationSummary docSummary =
                documentService.getVerificationSummary(doctor.getId());

        if (!docSummary.hasLicense()) {
            throw new BadRequestException("Missing required document: Practice License (LICENSE)");
        }
        if (!docSummary.hasId()) {
            throw new BadRequestException("Missing required document: ID Card (ID)");
        }
        if (!docSummary.hasDegree()) {
            throw new BadRequestException("Missing required document: Degree/Diploma (DEGREE)");
        }

        // Submit
        doctor.setVerificationStatus(VerificationStatus.PENDING);
        doctor.setSubmittedAt(LocalDateTime.now());
        doctor = doctorRepository.save(doctor);

        log.info("Doctor {} submitted for verification", doctor.getId());

        return ResponseEntity.ok(mapToProfileDTO(doctor, docSummary));
    }

    // ======================== HELPERS ========================

    private void validateProfileFields(Doctor doctor) {
        if (isBlank(doctor.getSpecialization())) {
            throw new BadRequestException("Specialization is required");
        }
        if (isBlank(doctor.getLicenseNumber())) {
            throw new BadRequestException("License number is required");
        }
        if (doctor.getExperienceYears() == null || doctor.getExperienceYears() < 0) {
            throw new BadRequestException("Experience years is required");
        }
        if (isBlank(doctor.getEducation())) {
            throw new BadRequestException("Education is required");
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private boolean isProfileComplete(Doctor doctor) {
        return !isBlank(doctor.getSpecialization())
                && !isBlank(doctor.getLicenseNumber())
                && doctor.getExperienceYears() != null && doctor.getExperienceYears() >= 0
                && !isBlank(doctor.getEducation());
    }

    private DoctorProfileDTO mapToProfileDTO(Doctor doctor,
                                              DoctorDocumentService.DocumentVerificationSummary docSummary) {
        boolean profileComplete = isProfileComplete(doctor);
        boolean documentsComplete = docSummary.hasLicense() && docSummary.hasId() && docSummary.hasDegree();

        return DoctorProfileDTO.builder()
                .id(doctor.getId())
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
                .createdAt(doctor.getCreatedAt())
                .profileComplete(profileComplete)
                .documentsComplete(documentsComplete)
                .canSubmitVerification(profileComplete && documentsComplete
                        && doctor.getVerificationStatus() == VerificationStatus.AWAITING_DOCUMENTS)
                .build();
    }
}
