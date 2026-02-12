package com.q2k.meditech.service;

import com.q2k.meditech.dto.DoctorDocumentCreateDTO;
import com.q2k.meditech.dto.DoctorDocumentDTO;
import com.q2k.meditech.dto.ReviewDocDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Service interface for Doctor Document operations
 */
public interface DoctorDocumentService {

    // ========== DOCTOR ENDPOINTS ==========

    /**
     * Upload a new document for the doctor
     * @param doctorId Doctor ID (from security context)
     * @param dto Document data
     * @return Created document
     */
    DoctorDocumentDTO uploadDocument(Long doctorId, DoctorDocumentCreateDTO dto);

    /**
     * List documents for the logged-in doctor
     * @param doctorId Doctor ID
     * @param status Optional filter by status (PENDING, APPROVED, REJECTED)
     * @param docType Optional filter by document type
     * @return List of documents
     */
    List<DoctorDocumentDTO> listMyDocuments(Long doctorId, String status, String docType);

    /**
     * Delete a document (only if PENDING)
     * @param doctorId Doctor ID
     * @param documentId Document ID
     */
    void deleteDocument(Long doctorId, Long documentId);

    // ========== ADMIN ENDPOINTS ==========

    /**
     * List all documents with filters (for admin)
     * @param status Filter by status
     * @param docType Filter by document type
     * @param pageable Pagination parameters
     * @return Page of documents
     */
    Page<DoctorDocumentDTO> listAllDocuments(String status, String docType, Pageable pageable);

    /**
     * List pending documents (for admin dashboard)
     * @param pageable Pagination parameters
     * @return Page of pending documents
     */
    Page<DoctorDocumentDTO> listPendingDocuments(Pageable pageable);

    /**
     * Get document detail (for admin)
     * @param documentId Document ID
     * @return Document detail
     */
    DoctorDocumentDTO getDocumentDetail(Long documentId);

    /**
     * Approve a document
     * @param documentId Document ID
     * @param dto Review notes
     * @param reviewerId Admin user ID
     * @return Updated document
     */
    DoctorDocumentDTO approveDocument(Long documentId, ReviewDocDTO dto, Long reviewerId);

    /**
     * Reject a document
     * @param documentId Document ID
     * @param dto Review notes (reason for rejection)
     * @param reviewerId Admin user ID
     * @return Updated document
     */
    DoctorDocumentDTO rejectDocument(Long documentId, ReviewDocDTO dto, Long reviewerId);

    // ========== HELPER METHODS ==========

    /**
     * Check if doctor has all required documents approved
     * @param doctorId Doctor ID
     * @return true if all required documents are approved
     */
    boolean hasAllRequiredDocumentsApproved(Long doctorId);

    /**
     * Get document verification summary for a doctor
     * @param doctorId Doctor ID
     * @return Summary of document statuses
     */
    DocumentVerificationSummary getVerificationSummary(Long doctorId);

    /**
     * Inner class for verification summary
     */
    record DocumentVerificationSummary(
            int totalDocuments,
            int approvedCount,
            int pendingCount,
            int rejectedCount,
            boolean hasLicense,
            boolean hasId,
            boolean hasDegree,
            boolean isComplete
    ) {}
}