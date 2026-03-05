package com.q2k.meditech.service;

import com.q2k.meditech.dto.AppointmentDTO;
import com.q2k.meditech.dto.receptionist.*;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Service for Queue Management operations.
 * Handles all queue-specific logic for the receptionist Queue Management tab.
 */
public interface QueueManagementService {

    // ==================== VIEW MODES ====================

    /**
     * #1 - Get detailed queue status by doctor, including waiting patient list.
     */
    List<DoctorQueueStatusDTO> getQueueByDoctor();

    /**
     * #2 - Get queue grouped by room number.
     */
    List<DoctorQueueStatusDTO> getQueueByRoom();

    /**
     * #3 - Get flat list of all patients currently in queue (across all doctors).
     */
    List<QueuePatientDTO> getAllQueuedPatients(String sortBy, String sortDir);

    // ==================== DOCTOR STATUS ====================

    /**
     * #4 - Update a doctor's queue status (AVAILABLE, BUSY, ON_BREAK, OFFLINE).
     */
    DoctorQueueStatusDTO updateDoctorStatus(Long doctorId, UpdateDoctorStatusDTO dto, Long receptionistUserId);

    /**
     * #5 - List all doctors today with queue status summary.
     */
    List<DoctorQueueStatusDTO> getDoctorsList();

    // ==================== QUEUE OPERATIONS ====================

    /**
     * #6 - Reorder a doctor's queue. Reason mandatory for audit.
     */
    DoctorQueueStatusDTO reorderQueue(Long doctorId, ReorderQueueDTO dto, Long receptionistUserId);

    /**
     * #7 - Add walk-in patient to a doctor's queue.
     * Creates appointment with CHECKED_IN status + assigns queue number.
     */
    QueueCallResultDTO addWalkIn(Long doctorId, AddWalkInDTO dto, Long receptionistUserId);

    /**
     * #8 - Move a patient from one doctor to another.
     * Assigns new queue number in target doctor's queue + audit history.
     */
    QueueCallResultDTO moveDoctor(MoveDoctorDTO dto, Long receptionistUserId);

    // ==================== CALL NEXT (ENHANCED) ====================

    /**
     * #9 - Enhanced call next: includes notifyMethod and roomNumber.
     * Transitions CHECKED_IN → IN_PROGRESS for the next (or specified) patient.
     */
    QueueCallResultDTO callNextPatient(Long doctorId, CallNextDTO dto, Long receptionistUserId);

    // ==================== DISPLAY ====================

    /**
     * #10 - Public TV display: queue# + room only (no PII).
     */
    List<QueueDisplayDTO> getPublicDisplay();

    /**
     * #11 - Internal staff display: queue# + room + patient name.
     */
    List<QueueDisplayDTO> getInternalDisplay();

    // ==================== AUDIT ====================

    /**
     * #12 - All queue audit events for today.
     */
    Page<QueueAuditDTO> getQueueAuditLog(int pageNumber, int pageSize);

    /**
     * #13 - Queue history for a specific doctor today.
     */
    List<QueueAuditDTO> getDoctorQueueHistory(Long doctorId);
}
