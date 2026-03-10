package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.statistics.*;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.service.AppointmentService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Controller for Admin appointment operations
 */
@RestController
@RequestMapping("/admin/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminAppointmentController {
    
    private final AppointmentService appointmentService;
    private final PatientRepository patientRepository;
    
    /**
     * Admin views all appointments with filters
     * GET /api/admin/appointments
     */
    @GetMapping
    public ResponseEntity<Page<AppointmentDTO>> getAllAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) List<String> statuses,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String appointmentType,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(defaultValue = "appointmentDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        
        // The frontend sends user.id as patientId (from /admin/users?role=PATIENT),
        // but the specification filters by patient entity ID. Convert userId -> patient.id.
        Long resolvedPatientId = null;
        if (patientId != null) {
            Optional<Patient> patient = patientRepository.findByUserId(patientId);
            resolvedPatientId = patient.map(Patient::getId).orElse(null);
        }
        
        AppointmentFilterDTO filter = AppointmentFilterDTO.builder()
                .doctorId(doctorId)
                .patientId(resolvedPatientId)
                .status(status != null ? AppointmentStatus.valueOf(status.toUpperCase()) : null)
                .statuses(statuses != null ? statuses.stream()
                        .map(s -> AppointmentStatus.valueOf(s.toUpperCase()))
                        .toList() : null)
                .from(from != null ? LocalDate.parse(from) : null)
                .to(to != null ? LocalDate.parse(to) : null)
                .search(search)
                .appointmentType(appointmentType)
                .paymentStatus(paymentStatus)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();
        
        Page<AppointmentDTO> result = appointmentService.getAllAppointments(filter);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get appointment detail by ID
     * GET /api/admin/appointments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<AppointmentDTO> getAppointmentById(@PathVariable Long id) {
        AppointmentDTO appointment = appointmentService.getAppointmentById(id);
        return ResponseEntity.ok(appointment);
    }
    
    /**
     * Get appointment history
     * GET /api/admin/appointments/{id}/history
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<List<AppointmentHistoryDTO>> getAppointmentHistory(@PathVariable Long id) {
        List<AppointmentHistoryDTO> history = appointmentService.getAppointmentHistory(id);
        return ResponseEntity.ok(history);
    }
    
    /**
     * Admin reschedules an appointment
     * PUT /api/admin/appointments/{id}/reschedule
     */
    @PutMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentDTO> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleDTO dto) {
        
        Long userId = SecurityUtil.getCurrentUserId();
        AppointmentDTO result = appointmentService.rescheduleAppointment(id, dto, userId, "ADMIN");
        return ResponseEntity.ok(result);
    }
    
    /**
     * Admin cancels an appointment
     * PUT /api/admin/appointments/{id}/cancel
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<AppointmentDTO> cancelAppointment(
            @PathVariable Long id,
            @Valid @RequestBody CancelDTO dto) {
        
        Long userId = SecurityUtil.getCurrentUserId();
        AppointmentDTO result = appointmentService.cancelAppointment(id, dto, userId, "ADMIN");
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get appointment statistics
     * GET /api/admin/appointments/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<AppointmentStatsDTO> getAppointmentStats() {
        AppointmentStatsDTO stats = appointmentService.getAppointmentStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Bulk send appointment reminders
     * POST /api/admin/appointments/bulk/reminders
     */
    @PostMapping("/bulk/reminders")
    public ResponseEntity<BulkActionResultDTO> bulkSendReminders(
            @Valid @RequestBody BulkReminderDTO dto) {
        
        Long userId = SecurityUtil.getCurrentUserId();
        BulkActionResultDTO result = appointmentService.bulkSendReminders(dto, userId, "ADMIN");
        return ResponseEntity.ok(result);
    }
    
    /**
     * Bulk cancel appointments
     * POST /api/admin/appointments/bulk/cancel
     */
    @PostMapping("/bulk/cancel")
    public ResponseEntity<BulkActionResultDTO> bulkCancelAppointments(
            @Valid @RequestBody BulkCancelDTO dto) {
        
        Long userId = SecurityUtil.getCurrentUserId();
        BulkActionResultDTO result = appointmentService.bulkCancelAppointments(dto, userId, "ADMIN");
        return ResponseEntity.ok(result);
    }
    
    /**
     * Export appointments
     * GET /api/admin/appointments/export
     */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportAppointments(
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) List<String> statuses,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "CSV") String format,
            @RequestParam(required = false) List<String> columns) {
        
        // Convert userId -> patient entity ID (same as getAllAppointments)
        Long resolvedPatientId = null;
        if (patientId != null) {
            Optional<Patient> patient = patientRepository.findByUserId(patientId);
            resolvedPatientId = patient.map(Patient::getId).orElse(null);
        }
        
        ExportFilterDTO filter = ExportFilterDTO.builder()
                .doctorId(doctorId)
                .patientId(resolvedPatientId)
                .status(status != null ? AppointmentStatus.valueOf(status.toUpperCase()) : null)
                .statuses(statuses != null ? statuses.stream()
                        .map(s -> AppointmentStatus.valueOf(s.toUpperCase()))
                        .toList() : null)
                .from(from != null ? LocalDate.parse(from) : null)
                .to(to != null ? LocalDate.parse(to) : null)
                .format(format)
                .columns(columns)
                .build();
        
        byte[] data = appointmentService.exportAppointments(filter);
        
        String filename = "appointments_" + LocalDate.now() + "." + format.toLowerCase();
        String contentType = switch (format.toUpperCase()) {
            case "EXCEL" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "PDF" -> "application/pdf";
            default -> "text/csv";
        };
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(data);
    }
    
    // ==================== APPOINTMENT DETAIL & ACTIONS ====================
    
    /**
     * Get full appointment detail with patient/doctor info, stats, and history
     * GET /api/admin/appointments/{id}/detail
     */
    @GetMapping("/{id}/detail")
    public ResponseEntity<AppointmentDetailDTO> getAppointmentDetail(@PathVariable Long id) {
        AppointmentDetailDTO detail = appointmentService.getAppointmentDetail(id);
        return ResponseEntity.ok(detail);
    }
    
    /**
     * Mark appointment as no-show
     * PATCH /api/admin/appointments/{id}/mark-no-show
     */
    @PatchMapping("/{id}/mark-no-show")
    public ResponseEntity<AppointmentDTO> markAsNoShow(
            @PathVariable Long id,
            @Valid @RequestBody NoShowDTO dto) {
        
        Long userId = SecurityUtil.getCurrentUserId();
        AppointmentDTO result = appointmentService.markAsNoShow(id, dto, userId, "ADMIN");
        return ResponseEntity.ok(result);
    }
    
    /**
     * Start consultation (CHECKED_IN -> IN_PROGRESS)
     * PATCH /api/admin/appointments/{id}/start
     */
    @PatchMapping("/{id}/start")
    public ResponseEntity<AppointmentDTO> startConsultation(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        AppointmentDTO result = appointmentService.startConsultation(id, userId, "ADMIN");
        return ResponseEntity.ok(result);
    }
    
    /**
     * Complete consultation (IN_PROGRESS -> COMPLETED)
     * PATCH /api/admin/appointments/{id}/complete
     */
    @PatchMapping("/{id}/complete")
    public ResponseEntity<AppointmentDTO> completeConsultation(
            @PathVariable Long id,
            @Valid @RequestBody CompleteAppointmentDTO dto) {
        
        Long userId = SecurityUtil.getCurrentUserId();
        AppointmentDTO result = appointmentService.completeConsultation(id, dto, userId, "ADMIN");
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get communication logs for an appointment
     * GET /api/admin/appointments/{id}/communications
     */
    @GetMapping("/{id}/communications")
    public ResponseEntity<List<CommunicationLogDTO>> getCommunicationLogs(@PathVariable Long id) {
        List<CommunicationLogDTO> logs = appointmentService.getCommunicationLogs(id);
        return ResponseEntity.ok(logs);
    }
    
    /**
     * Send custom message to patient
     * POST /api/admin/appointments/{id}/send-message
     */
    @PostMapping("/{id}/send-message")
    public ResponseEntity<MessageDTO> sendCustomMessage(
            @PathVariable Long id,
            @Valid @RequestBody CustomMessageDTO dto) {
        
        Long userId = SecurityUtil.getCurrentUserId();
        MessageDTO result = appointmentService.sendCustomMessage(id, dto, userId);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get related records (prescriptions, payments, reviews)
     * GET /api/admin/appointments/{id}/related
     */
    @GetMapping("/{id}/related")
    public ResponseEntity<RelatedRecordsDTO> getRelatedRecords(@PathVariable Long id) {
        RelatedRecordsDTO records = appointmentService.getRelatedRecords(id);
        return ResponseEntity.ok(records);
    }
    
    /**
     * Export appointment history to PDF
     * GET /api/admin/appointments/{id}/history/export
     */
    @GetMapping("/{id}/history/export")
    public ResponseEntity<byte[]> exportHistoryToPdf(@PathVariable Long id) {
        byte[] data = appointmentService.exportHistoryToPdf(id);
        
        String filename = "appointment_history_" + id + ".pdf";
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
    
    // ==================== STATISTICS & ANALYTICS ====================
    
    /**
     * Get summary statistics
     * GET /api/admin/appointments/statistics/summary
     */
    @GetMapping("/statistics/summary")
    public ResponseEntity<AppointmentSummaryStatsDTO> getSummaryStatistics(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Long doctorId) {
        
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        
        AppointmentSummaryStatsDTO stats = appointmentService.getSummaryStatistics(fromDate, toDate, doctorId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get appointments over time (time series)
     * GET /api/admin/appointments/statistics/over-time
     */
    @GetMapping("/statistics/over-time")
    public ResponseEntity<TimeSeriesStatsDTO> getAppointmentsOverTime(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "DAY") String groupBy,
            @RequestParam(required = false) Long doctorId) {
        
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        
        TimeSeriesStatsDTO stats = appointmentService.getAppointmentsOverTime(fromDate, toDate, groupBy, doctorId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get status distribution (pie chart)
     * GET /api/admin/appointments/statistics/by-status
     */
    @GetMapping("/statistics/by-status")
    public ResponseEntity<StatusDistributionDTO> getStatusDistribution(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Long doctorId) {
        
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        
        StatusDistributionDTO stats = appointmentService.getStatusDistribution(fromDate, toDate, doctorId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get statistics by doctor
     * GET /api/admin/appointments/statistics/by-doctor
     */
    @GetMapping("/statistics/by-doctor")
    public ResponseEntity<Page<DoctorStatsDTO>> getStatsByDoctor(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "totalAppointments") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        
        Page<DoctorStatsDTO> stats = appointmentService.getStatsByDoctor(fromDate, toDate, page, size, sortBy, sortDir);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get peak hours heatmap
     * GET /api/admin/appointments/statistics/peak-hours
     */
    @GetMapping("/statistics/peak-hours")
    public ResponseEntity<PeakHoursHeatmapDTO> getPeakHoursHeatmap(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Long doctorId) {
        
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        
        PeakHoursHeatmapDTO stats = appointmentService.getPeakHoursHeatmap(fromDate, toDate, doctorId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get cancellation analysis
     * GET /api/admin/appointments/statistics/cancellation
     */
    @GetMapping("/statistics/cancellation")
    public ResponseEntity<CancellationAnalysisDTO> getCancellationAnalysis(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Long doctorId) {
        
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        
        CancellationAnalysisDTO stats = appointmentService.getCancellationAnalysis(fromDate, toDate, doctorId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get no-show analysis
     * GET /api/admin/appointments/statistics/no-show
     */
    @GetMapping("/statistics/no-show")
    public ResponseEntity<NoShowAnalysisDTO> getNoShowAnalysis(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Long doctorId) {
        
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        
        NoShowAnalysisDTO stats = appointmentService.getNoShowAnalysis(fromDate, toDate, doctorId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get wait time statistics
     * GET /api/admin/appointments/statistics/wait-time
     */
    @GetMapping("/statistics/wait-time")
    public ResponseEntity<WaitTimeStatsDTO> getWaitTimeStats(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Long doctorId) {
        
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        
        WaitTimeStatsDTO stats = appointmentService.getWaitTimeStats(fromDate, toDate, doctorId);
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Export statistics to PDF
     * GET /api/admin/appointments/statistics/export
     */
    @GetMapping("/statistics/export")
    public ResponseEntity<byte[]> exportStatisticsPdf(
            @RequestParam String from,
            @RequestParam String to,
            @RequestParam(required = false) Long doctorId) {
        
        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate = LocalDate.parse(to);
        
        byte[] data = appointmentService.exportStatisticsPdf(fromDate, toDate, doctorId);
        
        String filename = "appointment_statistics_" + from + "_to_" + to + ".pdf";
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}