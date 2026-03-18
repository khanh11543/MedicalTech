package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.dto.statistics.*;
import com.q2k.meditech.entity.enums.BookedBy;
import org.springframework.data.domain.Page;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentService {
    
    // === BOOKING ===
    /**
     * Book an appointment (Patient or Receptionist)
     */
    AppointmentDTO bookAppointment(BookAppointmentDTO dto, Long bookedByUserId, BookedBy bookedBy);
    
    // === PATIENT APIs ===
    /**
     * Get patient's appointments with filters
     */
    Page<AppointmentDTO> getPatientAppointments(Long patientId, AppointmentFilterDTO filter);
    
    // === DOCTOR APIs ===
    /**
     * Get doctor's appointments with filters
     */
    Page<AppointmentDTO> getDoctorAppointments(Long doctorId, AppointmentFilterDTO filter);
    
    /**
     * Get doctor's appointment history (completed, cancelled, no-show, rescheduled)
     */
    Page<AppointmentDTO> getDoctorAppointmentHistory(Long doctorId, AppointmentFilterDTO filter);
    
    // === RECEPTIONIST APIs ===
    /**
     * Check-in a patient and assign queue number
     */
    AppointmentDTO checkInPatient(Long appointmentId, Long receptionistUserId);

    // === SHARED APIs (role-aware: ADMIN / DOCTOR / RECEPTIONIST) ===

    /**
     * Confirm a PENDING appointment → CONFIRMED.
     * Role-aware: DOCTOR verifies ownership, RECEPTIONIST/ADMIN can confirm any.
     * @param adminNote optional note (receptionist only)
     * @param callerRole "DOCTOR", "RECEPTIONIST", or "ADMIN"
     */
    AppointmentDTO confirmAppointment(Long appointmentId, String adminNote, Long userId, String callerRole);

    /**
     * #2 - Get upcoming appointments (from today onwards), grouped-ready, paginated
     */
    Page<ReceptionistAppointmentListDTO> getUpcomingAppointments(LocalDate from, LocalDate to,
                                                                  int pageNumber, int pageSize);

    /**
     * #4 - Bulk confirm PENDING appointments
     */
    BulkActionResultDTO bulkConfirmAppointments(BulkConfirmDTO dto, Long receptionistUserId);

    /**
     * #7 - Send single appointment reminder (template-based)
     */
    CommunicationLogDTO sendAppointmentReminder(Long appointmentId, SendReminderDTO dto, Long receptionistUserId);

    /**
     * #10 - Send template-based message to patient
     */
    CommunicationLogDTO sendTemplateMessage(Long appointmentId, SendTemplateMessageDTO dto, Long receptionistUserId);

    /**
     * #11 - Get document summaries for appointment (receptionist-safe)
     */
    List<DocumentSummaryDTO> getAppointmentDocuments(Long appointmentId);

    /**
     * #14 - Create follow-up appointment from a COMPLETED appointment
     */
    AppointmentDTO createFollowUp(Long appointmentId, CreateFollowUpDTO dto, Long receptionistUserId);

    /**
     * #15 - Generate and return a check-in slip PDF
     */
    byte[] generateCheckInSlip(Long appointmentId);

    /**
     * #16 - Get available notification templates
     */
    List<NotificationTemplateDTO> getNotificationTemplates();

    /**
     * #17 - Get appointment categories for dropdown
     */
    List<AppointmentCategoryDTO> getAppointmentCategories();
    
    // === COMMON APIs ===
    /**
     * Reschedule an appointment
     */
    AppointmentDTO rescheduleAppointment(Long appointmentId, RescheduleDTO dto, Long userId, String userRole);
    
    /**
     * Cancel an appointment
     */
    AppointmentDTO cancelAppointment(Long appointmentId, CancelDTO dto, Long userId, String userRole);
    
    /**
     * Get appointment by ID
     */
    AppointmentDTO getAppointmentById(Long appointmentId);
    
    /**
     * Get appointment history
     */
    List<AppointmentHistoryDTO> getAppointmentHistory(Long appointmentId);
    
    // === ADMIN APIs ===
    /**
     * Get all appointments with filters (Admin)
     */
    Page<AppointmentDTO> getAllAppointments(AppointmentFilterDTO filter);
    
    /**
     * Get appointment statistics (Admin)
     */
    AppointmentStatsDTO getAppointmentStats();
    
    /**
     * Bulk send appointment reminders.
     * SHARED: Admin sends without quota, Receptionist applies quota at controller layer.
     * @param callerRole "ADMIN" or "RECEPTIONIST"
     */
    BulkActionResultDTO bulkSendReminders(BulkReminderDTO dto, Long userId, String callerRole);
    
    /**
     * Bulk cancel appointments.
     * SHARED: Both Admin and Receptionist call the same logic.
     * @param callerRole "ADMIN" or "RECEPTIONIST"
     */
    BulkActionResultDTO bulkCancelAppointments(BulkCancelDTO dto, Long userId, String callerRole);
    
    /**
     * Export appointments (Admin)
     */
    byte[] exportAppointments(ExportFilterDTO filter);
    
    // === APPOINTMENT DETAIL & ACTIONS APIs ===
    
    /**
     * Get comprehensive appointment details
     */
    AppointmentDetailDTO getAppointmentDetail(Long appointmentId);
    
    /**
     * Mark appointment as no-show
     */
    AppointmentDTO markAsNoShow(Long appointmentId, NoShowDTO dto, Long userId, String userRole);

    /**
     * Notify doctor that a checked-in patient is ready.
     * Only valid for CHECKED_IN appointments.
     */
    void notifyDoctorPatientReady(Long appointmentId, NotifyDoctorDTO dto, Long receptionistUserId);

    /**
     * Start consultation (CHECKED_IN -> IN_PROGRESS)
     */
    AppointmentDTO startConsultation(Long appointmentId, Long userId, String userRole);
    
    /**
     * Complete consultation (IN_PROGRESS -> COMPLETED)
     */
    AppointmentDTO completeConsultation(Long appointmentId, CompleteAppointmentDTO dto, Long userId, String userRole);
    
    /**
     * Get communication logs for an appointment
     */
    List<CommunicationLogDTO> getCommunicationLogs(Long appointmentId);
    
    /**
     * Send custom message to patient
     */
    MessageDTO sendCustomMessage(Long appointmentId, CustomMessageDTO dto, Long userId);
    
    /**
     * Get related records (prescriptions, payments, reviews)
     */
    RelatedRecordsDTO getRelatedRecords(Long appointmentId);
    
    /**
     * Export appointment history to PDF
     */
    byte[] exportHistoryToPdf(Long appointmentId);
    
    // === STATISTICS & ANALYTICS APIs ===
    
    /**
     * Get summary statistics
     */
    AppointmentSummaryStatsDTO getSummaryStatistics(LocalDate from, LocalDate to, Long doctorId);
    
    /**
     * Get appointments over time (time series data)
     */
    TimeSeriesStatsDTO getAppointmentsOverTime(LocalDate from, LocalDate to, String groupBy, Long doctorId);
    
    /**
     * Get status distribution (pie chart data)
     */
    StatusDistributionDTO getStatusDistribution(LocalDate from, LocalDate to, Long doctorId);
    
    /**
     * Get statistics by doctor
     */
    Page<DoctorStatsDTO> getStatsByDoctor(LocalDate from, LocalDate to, int page, int size, String sortBy, String sortDir);
    
    /**
     * Get peak hours heatmap
     */
    PeakHoursHeatmapDTO getPeakHoursHeatmap(LocalDate from, LocalDate to, Long doctorId);
    
    /**
     * Get cancellation analysis
     */
    CancellationAnalysisDTO getCancellationAnalysis(LocalDate from, LocalDate to, Long doctorId);
    
    /**
     * Get no-show analysis
     */
    NoShowAnalysisDTO getNoShowAnalysis(LocalDate from, LocalDate to, Long doctorId);
    
    /**
     * Get wait time statistics
     */
    WaitTimeStatsDTO getWaitTimeStats(LocalDate from, LocalDate to, Long doctorId);
    
    /**
     * Export statistics to PDF
     */
    byte[] exportStatisticsPdf(LocalDate from, LocalDate to, Long doctorId);
    
    /**
     * Get available time slots for a doctor for rescheduling appointments
     * Returns slots within the specified date range
     * @param doctorId Doctor ID
     * @param dateFrom Start date (defaults to today if null)
     * @param dateTo End date (defaults to dateFrom + 7 days if null)
     * @return List of available time slots
     */
    List<TimeSlotDTO> getAvailableSlotsForReschedule(Long doctorId, LocalDate dateFrom, LocalDate dateTo);
}