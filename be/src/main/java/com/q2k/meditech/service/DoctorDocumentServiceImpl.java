package com.q2k.meditech.service;

import com.q2k.meditech.dto.DoctorDocumentCreateDTO;
import com.q2k.meditech.dto.DoctorDocumentDTO;
import com.q2k.meditech.dto.ReviewDocDTO;
import com.q2k.meditech.dto.mapper.DoctorDocumentMapper;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.DoctorDocument;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.DoctorDocumentType;
import com.q2k.meditech.entity.enums.ReviewStatus;
import com.q2k.meditech.entity.enums.VerificationStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorDocumentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementation of DoctorDocumentService
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorDocumentServiceImpl implements DoctorDocumentService {

    private final DoctorDocumentRepository documentRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DoctorDocumentMapper documentMapper;

    // Required document types for verification
    private static final List<DoctorDocumentType> REQUIRED_DOCUMENT_TYPES = List.of(
            DoctorDocumentType.LICENSE,
            DoctorDocumentType.ID,
            DoctorDocumentType.DEGREE
    );

    // ========== DOCTOR ENDPOINTS ==========

    @Override
    @Transactional
    public DoctorDocumentDTO uploadDocument(Long doctorId, DoctorDocumentCreateDTO dto) {
        log.info("Uploading document for doctor ID: {}, type: {}", doctorId, dto.getDocType());

        // Validate doctor exists
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        // Convert DTO to entity
        DoctorDocument document = documentMapper.toEntity(dto);
        document.setDoctor(doctor);
        document.setStatus(ReviewStatus.PENDING);
        document.setCreatedAt(LocalDateTime.now());

        // Save document
        document = documentRepository.save(document);
        
        // Update doctor verification status to PENDING if not already
        if (doctor.getVerificationStatus() == VerificationStatus.REJECTED) {
            doctor.setVerificationStatus(VerificationStatus.PENDING);
            doctor.setRejectionReason(null);
            doctorRepository.save(doctor);
        }

        log.info("Document uploaded successfully with ID: {}", document.getId());
        return documentMapper.toDTO(document);
    }

    @Override
    public List<DoctorDocumentDTO> listMyDocuments(Long doctorId, String status, String docType) {
        log.info("Listing documents for doctor ID: {}, status: {}, type: {}", doctorId, status, docType);

        List<DoctorDocument> documents;

        ReviewStatus reviewStatus = status != null ? ReviewStatus.valueOf(status.toUpperCase()) : null;
        DoctorDocumentType documentType = docType != null ? DoctorDocumentType.valueOf(docType.toUpperCase()) : null;

        if (reviewStatus != null && documentType != null) {
            documents = documentRepository.findByDoctorIdAndStatusAndDocTypeOrderByCreatedAtDesc(
                    doctorId, reviewStatus, documentType);
        } else if (reviewStatus != null) {
            documents = documentRepository.findByDoctorIdAndStatusOrderByCreatedAtDesc(doctorId, reviewStatus);
        } else if (documentType != null) {
            documents = documentRepository.findByDoctorIdAndDocTypeOrderByCreatedAtDesc(doctorId, documentType);
        } else {
            documents = documentRepository.findByDoctorIdOrderByCreatedAtDesc(doctorId);
        }

        return documentMapper.toDTOList(documents);
    }

    @Override
    @Transactional
    public void deleteDocument(Long doctorId, Long documentId) {
        log.info("Deleting document ID: {} for doctor ID: {}", documentId, doctorId);

        DoctorDocument document = documentRepository.findByIdWithDoctor(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorDocument", "id", documentId));

        // Validate ownership
        if (!document.getDoctor().getId().equals(doctorId)) {
            throw new BadRequestException("You can only delete your own documents");
        }

        // Can only delete PENDING documents
        if (document.getStatus() != ReviewStatus.PENDING) {
            throw new BadRequestException("Can only delete PENDING documents. Current status: " + document.getStatus());
        }

        documentRepository.delete(document);
        log.info("Document deleted successfully: {}", documentId);
    }

    // ========== ADMIN ENDPOINTS ==========

    @Override
    @Transactional(readOnly = true)
    public Page<DoctorDocumentDTO> listAllDocuments(String status, String docType, Pageable pageable) {
        log.info("Admin listing documents - status: {}, type: {}", status, docType);

        ReviewStatus reviewStatus = status != null ? ReviewStatus.valueOf(status.toUpperCase()) : null;
        DoctorDocumentType documentType = docType != null ? DoctorDocumentType.valueOf(docType.toUpperCase()) : null;

        List<DoctorDocument> documents = documentRepository.findAllWithFilters(reviewStatus, documentType);
        List<DoctorDocumentDTO> dtoList = documentMapper.toDTOList(documents);

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), dtoList.size());
        
        List<DoctorDocumentDTO> pageContent = dtoList.subList(start, end);
        return new PageImpl<>(pageContent, pageable, dtoList.size());
    }

    @Override
    public Page<DoctorDocumentDTO> listPendingDocuments(Pageable pageable) {
        log.info("Admin listing pending documents");

        Page<DoctorDocument> documents = documentRepository.findPendingDocuments(pageable);
        return documents.map(documentMapper::toDTO);
    }

    @Override
    public DoctorDocumentDTO getDocumentDetail(Long documentId) {
        log.info("Getting document detail for ID: {}", documentId);

        DoctorDocument document = documentRepository.findByIdWithDoctor(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorDocument", "id", documentId));

        return documentMapper.toDTO(document);
    }

    @Override
    @Transactional
    public DoctorDocumentDTO approveDocument(Long documentId, ReviewDocDTO dto, Long reviewerId) {
        log.info("Approving document ID: {} by reviewer: {}", documentId, reviewerId);

        DoctorDocument document = documentRepository.findByIdWithDoctor(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorDocument", "id", documentId));

        // Validate current status
        if (document.getStatus() != ReviewStatus.PENDING) {
            throw new BadRequestException("Can only approve PENDING documents. Current status: " + document.getStatus());
        }

        // Get reviewer
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reviewerId));

        // Update document
        document.setStatus(ReviewStatus.APPROVED);
        document.setReviewedBy(reviewer);
        document.setReviewedAt(LocalDateTime.now());
        if (dto != null && dto.getReviewNote() != null) {
            document.setReviewNote(dto.getReviewNote());
        }

        document = documentRepository.save(document);

        // Check if all required documents are now approved
        Doctor doctor = document.getDoctor();
        if (hasAllRequiredDocumentsApproved(doctor.getId())) {
            // Auto-approve doctor verification
            doctor.setVerificationStatus(VerificationStatus.APPROVED);
            doctor.setVerifiedAt(LocalDateTime.now());
            doctor.setVerifiedBy(reviewer);
            doctor.setRejectionReason(null);
            doctorRepository.save(doctor);
            log.info("Doctor {} auto-approved - all required documents verified", doctor.getId());
        }

        log.info("Document approved successfully: {}", documentId);
        return documentMapper.toDTO(document);
    }

    @Override
    @Transactional
    public DoctorDocumentDTO rejectDocument(Long documentId, ReviewDocDTO dto, Long reviewerId) {
        log.info("Rejecting document ID: {} by reviewer: {}", documentId, reviewerId);

        DoctorDocument document = documentRepository.findByIdWithDoctor(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("DoctorDocument", "id", documentId));

        // Validate current status
        if (document.getStatus() != ReviewStatus.PENDING) {
            throw new BadRequestException("Can only reject PENDING documents. Current status: " + document.getStatus());
        }

        // Get reviewer
        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", reviewerId));

        // Update document
        document.setStatus(ReviewStatus.REJECTED);
        document.setReviewedBy(reviewer);
        document.setReviewedAt(LocalDateTime.now());
        if (dto != null && dto.getReviewNote() != null) {
            document.setReviewNote(dto.getReviewNote());
        }

        document = documentRepository.save(document);

        // Update doctor verification status if this was a required document
        Doctor doctor = document.getDoctor();
        if (REQUIRED_DOCUMENT_TYPES.contains(document.getDocType())) {
            doctor.setVerificationStatus(VerificationStatus.REJECTED);
            doctor.setRejectionReason("Document rejected: " + document.getDocType().name() + 
                    (dto != null && dto.getReviewNote() != null ? " - " + dto.getReviewNote() : ""));
            doctorRepository.save(doctor);
            log.info("Doctor {} verification rejected due to document rejection", doctor.getId());
        }

        log.info("Document rejected successfully: {}", documentId);
        return documentMapper.toDTO(document);
    }

    // ========== HELPER METHODS ==========

    @Override
    public boolean hasAllRequiredDocumentsApproved(Long doctorId) {
        for (DoctorDocumentType requiredType : REQUIRED_DOCUMENT_TYPES) {
            if (!documentRepository.hasApprovedDocument(doctorId, requiredType)) {
                return false;
            }
        }
        return true;
    }

    @Override
    public DocumentVerificationSummary getVerificationSummary(Long doctorId) {
        List<DoctorDocument> documents = documentRepository.findLatestByDoctorId(doctorId);

        int approvedCount = 0;
        int pendingCount = 0;
        int rejectedCount = 0;
        boolean hasLicense = false;
        boolean hasId = false;
        boolean hasDegree = false;

        for (DoctorDocument doc : documents) {
            switch (doc.getStatus()) {
                case APPROVED -> approvedCount++;
                case PENDING -> pendingCount++;
                case REJECTED -> rejectedCount++;
            }

            if (doc.getStatus() == ReviewStatus.APPROVED) {
                switch (doc.getDocType()) {
                    case LICENSE -> hasLicense = true;
                    case ID -> hasId = true;
                    case DEGREE -> hasDegree = true;
                }
            }
        }

        boolean isComplete = hasLicense && hasId && hasDegree;

        return new DocumentVerificationSummary(
                documents.size(),
                approvedCount,
                pendingCount,
                rejectedCount,
                hasLicense,
                hasId,
                hasDegree,
                isComplete
        );
    }
}