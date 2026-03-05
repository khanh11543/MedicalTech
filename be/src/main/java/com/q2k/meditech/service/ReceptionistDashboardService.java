package com.q2k.meditech.service;

import com.q2k.meditech.dto.receptionist.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

/**
 * Service for Receptionist Dashboard operations.
 * Aggregates data from appointments, payments, and queue management.
 */
public interface ReceptionistDashboardService {

    // ==================== A. DASHBOARD STATS ====================

    /**
     * Get aggregated dashboard statistics for a specific date (default: today).
     */
    ReceptionistDashboardStatsDTO getDashboardStats(LocalDate date);

    // ==================== B. TODAY'S APPOINTMENTS ====================

    /**
     * Get paged list of today's appointments with masked patient phone.
     */
    Page<com.q2k.meditech.dto.ReceptionistAppointmentListDTO> getTodayAppointments(
            String status, int pageNumber, int pageSize, String sortBy, String sortOrder);

    // ==================== C. UPCOMING APPOINTMENTS ====================

    /**
     * Get next N upcoming appointments (CONFIRMED, start time > now).
     */
    List<UpcomingAppointmentDTO> getTodayUpcoming(int limit);

    // ==================== D. QUEUE STATUS ====================

    /**
     * Get queue status grouped by doctor for today.
     */
    List<DoctorQueueStatusDTO> getQueueStatus();

    // ==================== E. CALL NEXT PATIENT ====================

    /**
     * Call the next patient in a doctor's queue.
     * Transitions CHECKED_IN → IN_PROGRESS for the next queued patient.
     */
    QueueCallResultDTO callNextPatient(Long doctorId, CallNextDTO dto, Long receptionistUserId);

    // ==================== F. PENDING ACTIONS ====================

    /**
     * Get counts of pending actions that need receptionist attention.
     */
    PendingActionsDTO getPendingActions();

    // ==================== G. NEED CONFIRMATION ====================

    /**
     * Get appointments that need confirmation (status = PENDING) for today.
     */
    Page<AppointmentConfirmDTO> getNeedConfirmation(int pageNumber, int pageSize);

    // ==================== H. NO-SHOW LIST ====================

    /**
     * Get appointments that are overdue (past start time, not checked in).
     * These are candidates for marking as NO_SHOW.
     */
    Page<NoShowAppointmentDTO> getNoShowCandidates(int pageNumber, int pageSize);

    // ==================== J. PREFERENCES ====================

    /**
     * Get dashboard preferences for the current receptionist user.
     */
    DashboardPreferencesDTO getPreferences(Long userId);

    /**
     * Update dashboard preferences for the current receptionist user.
     */
    DashboardPreferencesDTO updatePreferences(Long userId, DashboardPreferencesDTO dto);
}
