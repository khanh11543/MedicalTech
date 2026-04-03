package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.receptionist.*;
import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.entity.ServiceOrder;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.BookedBy;
import com.q2k.meditech.entity.enums.ServiceOrderStatus;
import com.q2k.meditech.repository.PaymentRepository;
import com.q2k.meditech.repository.ServiceOrderRepository;
import com.q2k.meditech.service.AppointmentService;
import com.q2k.meditech.service.PrivacyMaskingService;
import com.q2k.meditech.service.ReceptionistDashboardService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controller for Receptionist appointment operations.
 * Same service as Admin, but different DTO (privacy-respecting) and different policy.
 */
@Slf4j
@RestController
@RequestMapping("/receptionist/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECEPTIONIST')")
@Tag(name = "Receptionist - Appointments", description = "Appointment operations for receptionist role")
public class ReceptionistAppointmentController {
    
    private final AppointmentService appointmentService;
    private final ReceptionistDashboardService dashboardService;
    private final PaymentRepository paymentRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final PrivacyMaskingService privacyMaskingService;
    
    // ==================== EXISTING ENDPOINTS ====================
    
    /**
     * Receptionist books an appointment for a patient
     * POST /api/receptionist/appointments
     */
    @PostMapping
    @Operation(summary = "Book appointment", description = "Receptionist books an appointment for a walk-in or phone patient")
    public ResponseEntity<AppointmentDTO> bookAppointment(
            @Valid @RequestBody BookAppointmentDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long receptionistUserId = getCurrentUserId(userDetails);
        log.info("POST /receptionist/appointments - booked by userId: {}", receptionistUserId);
        
        AppointmentDTO result = appointmentService.bookAppointment(dto, receptionistUserId, BookedBy.RECEPTIONIST);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    /**
     * Check-in a patient
     * PATCH /api/receptionist/appointments/{id}/check-in
     */
    @PatchMapping("/{id}/check-in")
    @Operation(summary = "Check-in patient", description = "Mark a patient as checked-in when they arrive")
    public ResponseEntity<AppointmentDTO> checkInPatient(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long receptionistUserId = getCurrentUserId(userDetails);
        log.info("PATCH /receptionist/appointments/{}/check-in - by userId: {}", id, receptionistUserId);
        
        AppointmentDTO result = appointmentService.checkInPatient(id, receptionistUserId);
        return ResponseEntity.ok(result);
    }
    
    // ==================== NEW ENDPOINTS (#15-#19) ====================
    
    /**
     * #15 - Get appointment statistics for receptionist dashboard
     * GET /api/receptionist/appointments/stats
     * 
     * Reuses AppointmentStatsDTO (no PII in stats).
     */
    @GetMapping("/stats")
    @Operation(summary = "Get appointment statistics", description = "Dashboard statistics: today/week/month totals, status breakdown, rates, trends")
    public ResponseEntity<AppointmentStatsDTO> getAppointmentStats() {
        log.info("GET /receptionist/appointments/stats");
        
        AppointmentStatsDTO stats = appointmentService.getAppointmentStats();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * #17 - List appointments with filters (privacy-respecting DTO)
     * GET /api/receptionist/appointments
     * 
     * Returns ReceptionistAppointmentListDTO which masks phone and omits
     * sensitive medical fields (symptoms, reasonForVisit, notes, emails).
     */
    @GetMapping
    @Operation(summary = "List appointments", description = "List appointments with filters. Returns privacy-masked patient data.")
    public ResponseEntity<Page<ReceptionistAppointmentListDTO>> getAllAppointments(
            @Parameter(description = "Filter by doctor ID") @RequestParam(required = false) Long doctorId,
            @Parameter(description = "Filter by patient ID") @RequestParam(required = false) Long patientId,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @Parameter(description = "Filter by multiple statuses") @RequestParam(required = false) List<String> statuses,
            @Parameter(description = "From date (yyyy-MM-dd)") @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)") @RequestParam(required = false) String to,
            @Parameter(description = "Search by patient/doctor name or code") @RequestParam(required = false) String search,
            @Parameter(description = "Filter by appointment type") @RequestParam(required = false) String appointmentType,
            @RequestParam(defaultValue = "appointmentDate") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @RequestParam(defaultValue = "0") Integer pageNumber,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        
        log.info("GET /receptionist/appointments - status: {}, from: {}, to: {}, search: {}", status, from, to, search);
        
        AppointmentFilterDTO filter = AppointmentFilterDTO.builder()
                .doctorId(doctorId)
                .patientId(patientId)
                .status(status != null ? AppointmentStatus.valueOf(status.toUpperCase()) : null)
                .statuses(statuses != null ? statuses.stream()
                        .map(s -> AppointmentStatus.valueOf(s.toUpperCase()))
                        .toList() : null)
                .from(from != null ? LocalDate.parse(from) : null)
                .to(to != null ? LocalDate.parse(to) : null)
                .search(search)
                .appointmentType(appointmentType)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();
        
        // Delegate to shared service, then map to privacy-respecting DTO
        Page<AppointmentDTO> fullPage = appointmentService.getAllAppointments(filter);

        // Batch-load payments for all appointments to enrich with payment status
        List<Long> appointmentIds = fullPage.getContent().stream()
                .map(AppointmentDTO::getId)
                .collect(Collectors.toList());

        Map<Long, Payment> paymentMap = new HashMap<>();
        if (!appointmentIds.isEmpty()) {
            List<Payment> payments = paymentRepository.findByAppointmentIdIn(appointmentIds);
            for (Payment p : payments) {
                paymentMap.put(p.getAppointment().getId(), p);
            }
        }

        // Service order payment status map
        Map<Long, String> soPaymentStatusMap = computeServiceOrderPaymentStatuses(appointmentIds);

        List<ReceptionistAppointmentListDTO> enriched = fullPage.getContent().stream()
                .map(dto -> {
                    Payment payment = paymentMap.get(dto.getId());
                    String payStatus = payment != null ? payment.getPaymentStatus() : null;
                    BigDecimal fee = payment != null ? payment.getTotalAmount() : null;
                    Long paymentId = payment != null ? payment.getId() : null;
                    String phone = privacyMaskingService.maskPhone(dto.getPatientPhone());
                    ReceptionistAppointmentListDTO result = ReceptionistAppointmentListDTO.fromAppointmentDTO(dto, payStatus, fee, paymentId, phone);
                    result.setServiceOrderPaymentStatus(soPaymentStatusMap.get(dto.getId()));
                    return result;
                })
                .collect(Collectors.toList());

        Page<ReceptionistAppointmentListDTO> maskedPage = new org.springframework.data.domain.PageImpl<>(
                enriched, fullPage.getPageable(), fullPage.getTotalElements());

        return ResponseEntity.ok(maskedPage);
    }
    
    /**
     * #18 - Mark appointment as no-show
     * PATCH /api/receptionist/appointments/{id}/mark-no-show
     */
    @PatchMapping("/{id}/mark-no-show")
    @Operation(summary = "Mark as no-show", description = "Mark a patient appointment as no-show when they fail to arrive")
    public ResponseEntity<AppointmentDTO> markAsNoShow(
            @Parameter(description = "Appointment ID") @PathVariable Long id,
            @Valid @RequestBody NoShowDTO dto) {
        
        Long userId = getCurrentUserId(null);
        log.info("PATCH /receptionist/appointments/{}/mark-no-show - by userId: {}", id, userId);
        
        AppointmentDTO result = appointmentService.markAsNoShow(id, dto, userId, "RECEPTIONIST");
        return ResponseEntity.ok(result);
    }

    /**
     * #19 - Notify doctor that a checked-in patient is ready
     * POST /api/receptionist/appointments/{id}/notify-doctor
     */
    @PostMapping("/{id}/notify-doctor")
    @Operation(summary = "Notify doctor", description = "Send notification to the assigned doctor that a checked-in patient is ready")
    public ResponseEntity<Void> notifyDoctor(
            @Parameter(description = "Appointment ID") @PathVariable Long id,
            @RequestBody(required = false) NotifyDoctorDTO dto) {

        Long userId = getCurrentUserId(null);
        log.info("POST /receptionist/appointments/{}/notify-doctor - by userId: {}", id, userId);

        appointmentService.notifyDoctorPatientReady(id, dto != null ? dto : new NotifyDoctorDTO(), userId);
        return ResponseEntity.ok().build();
    }

    // ==================== NEW ENDPOINTS (#1-#17) ====================

    /**
     * #1 - Confirm a PENDING appointment → CONFIRMED
     * PATCH /api/receptionist/appointments/{id}/confirm
     */
    @PatchMapping("/{id}/confirm")
    @Operation(summary = "Confirm appointment", description = "Receptionist confirms a PENDING appointment")
    public ResponseEntity<AppointmentDTO> confirmAppointment(
            @PathVariable Long id,
            @RequestBody(required = false) ConfirmAppointmentDTO dto) {
        
        Long userId = getCurrentUserId(null);
        log.info("PATCH /receptionist/appointments/{}/confirm - by userId: {}", id, userId);
        
        // SHARED service — pass callerRole to distinguish from Doctor confirm
        String adminNote = (dto != null) ? dto.getAdminNote() : null;
        AppointmentDTO result = appointmentService.confirmAppointment(id, adminNote, userId, "RECEPTIONIST");
        return ResponseEntity.ok(result);
    }

    /**
     * #2 - Upcoming appointments (today onwards), paginated
     * GET /api/receptionist/appointments/upcoming
     */
    @GetMapping("/upcoming")
    @Operation(summary = "Upcoming appointments", description = "List future appointments grouped by date (from today)")
    public ResponseEntity<Page<ReceptionistAppointmentListDTO>> getUpcomingAppointments(
            @Parameter(description = "From date (default: tomorrow)") @RequestParam(required = false) String from,
            @Parameter(description = "To date") @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "20") int pageSize) {
        
        log.info("GET /receptionist/appointments/upcoming - from: {}, to: {}", from, to);
        
        LocalDate fromDate = from != null ? LocalDate.parse(from) : null;
        LocalDate toDate = to != null ? LocalDate.parse(to) : null;
        
        Page<ReceptionistAppointmentListDTO> result =
                appointmentService.getUpcomingAppointments(fromDate, toDate, pageNumber, pageSize);
        return ResponseEntity.ok(result);
    }

    /**
     * #3 - History (COMPLETED / CANCELLED / NO_SHOW only) — uses getAllAppointments with filter
     * GET /api/receptionist/appointments/history
     */
    @GetMapping("/history")
    @Operation(summary = "Appointment history", description = "List completed, cancelled, and no-show appointments (read-only)")
    public ResponseEntity<Page<ReceptionistAppointmentListDTO>> getAppointmentHistory(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize) {
        
        log.info("GET /receptionist/appointments/history - status: {}, search: {}", status, search);
        
        // Only allow history statuses
        List<AppointmentStatus> historyStatuses;
        if (status != null && !status.isBlank()) {
            AppointmentStatus parsed = AppointmentStatus.valueOf(status.toUpperCase());
            if (parsed != AppointmentStatus.COMPLETED && parsed != AppointmentStatus.CANCELLED && parsed != AppointmentStatus.NO_SHOW) {
                return ResponseEntity.badRequest().build();
            }
            historyStatuses = List.of(parsed);
        } else {
            historyStatuses = List.of(AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW);
        }
        
        AppointmentFilterDTO filter = AppointmentFilterDTO.builder()
                .statuses(historyStatuses)
                .from(from != null ? LocalDate.parse(from) : null)
                .to(to != null ? LocalDate.parse(to) : null)
                .search(search)
                .sortBy("appointmentDate")
                .sortDir("DESC")
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();
        
        Page<AppointmentDTO> fullPage = appointmentService.getAllAppointments(filter);

        List<Long> histAppIds = fullPage.getContent().stream().map(AppointmentDTO::getId).collect(Collectors.toList());
        Map<Long, String> histSoStatuses = computeServiceOrderPaymentStatuses(histAppIds);

        Page<ReceptionistAppointmentListDTO> maskedPage = fullPage.map(dto -> {
                ReceptionistAppointmentListDTO r = ReceptionistAppointmentListDTO.fromAppointmentDTO(dto, privacyMaskingService.maskPhone(dto.getPatientPhone()));
                r.setServiceOrderPaymentStatus(histSoStatuses.get(dto.getId()));
                return r;
        });
        return ResponseEntity.ok(maskedPage);
    }

    /**
     * #4 - Bulk confirm PENDING appointments
     * POST /api/receptionist/appointments/bulk/confirm
     */
    @PostMapping("/bulk/confirm")
    @Operation(summary = "Bulk confirm", description = "Confirm multiple PENDING appointments at once")
    public ResponseEntity<BulkActionResultDTO> bulkConfirm(
            @Valid @RequestBody BulkConfirmDTO dto) {
        
        Long userId = getCurrentUserId(null);
        log.info("POST /receptionist/appointments/bulk/confirm - {} appointments", dto.getAppointmentIds().size());
        
        BulkActionResultDTO result = appointmentService.bulkConfirmAppointments(dto, userId);
        return ResponseEntity.ok(result);
    }

    /**
     * #5 - Bulk send reminders (with quota)
     * POST /api/receptionist/appointments/bulk/reminders
     */
    @PostMapping("/bulk/reminders")
    @Operation(summary = "Bulk send reminders", description = "Send reminders for multiple appointments (daily quota applies)")
    public ResponseEntity<BulkReminderResultDTO> bulkSendReminders(
            @Valid @RequestBody BulkReminderDTO dto) {
        
        Long userId = getCurrentUserId(null);
        log.info("POST /receptionist/appointments/bulk/reminders - {} appointments", dto.getAppointmentIds().size());
        
        // QUOTA enforcement at controller layer (receptionist policy)
        int quotaLimit = 50;
        int usedToday = 0; // TODO: retrieve from counter table
        int remaining = quotaLimit - usedToday;
        
        if (dto.getAppointmentIds().size() > remaining) {
            BulkReminderResultDTO quotaExceeded = BulkReminderResultDTO.builder()
                    .totalProcessed(0).successCount(0).failCount(dto.getAppointmentIds().size())
                    .message("Quota exceeded. Remaining today: " + remaining + "/" + quotaLimit)
                    .quotaRemaining(remaining).quotaLimit(quotaLimit).results(List.of()).build();
            return ResponseEntity.ok(quotaExceeded);
        }
        
        // SHARED service — same logic as admin, callerRole for history
        BulkActionResultDTO inner = appointmentService.bulkSendReminders(dto, userId, "RECEPTIONIST");
        
        // Wrap shared result with quota info (receptionist-specific DTO)
        BulkReminderResultDTO result = BulkReminderResultDTO.builder()
                .totalProcessed(inner.getTotalProcessed()).successCount(inner.getSuccessCount())
                .failCount(inner.getFailCount()).message(inner.getMessage()).results(inner.getResults())
                .quotaRemaining(remaining - inner.getSuccessCount()).quotaLimit(quotaLimit).build();
        return ResponseEntity.ok(result);
    }

    /**
     * #6 - Bulk cancel (with reason required)
     * POST /api/receptionist/appointments/bulk/cancel
     */
    @PostMapping("/bulk/cancel")
    @Operation(summary = "Bulk cancel", description = "Cancel multiple appointments (reason required)")
    public ResponseEntity<BulkActionResultDTO> bulkCancel(
            @Valid @RequestBody BulkCancelDTO dto) {
        
        Long userId = getCurrentUserId(null);
        log.info("POST /receptionist/appointments/bulk/cancel - {} appointments", dto.getAppointmentIds().size());
        
        // SHARED service — same logic as admin, callerRole for history
        BulkActionResultDTO result = appointmentService.bulkCancelAppointments(dto, userId, "RECEPTIONIST");
        return ResponseEntity.ok(result);
    }

    /**
     * #7 - Send single appointment reminder (template-based)
     * POST /api/receptionist/appointments/{id}/send-reminder
     */
    @PostMapping("/{id}/send-reminder")
    @Operation(summary = "Send reminder", description = "Send a template-based reminder for a single appointment")
    public ResponseEntity<CommunicationLogDTO> sendReminder(
            @PathVariable Long id,
            @Valid @RequestBody SendReminderDTO dto) {
        
        Long userId = getCurrentUserId(null);
        log.info("POST /receptionist/appointments/{}/send-reminder - channel: {}", id, dto.getChannel());
        
        CommunicationLogDTO result = appointmentService.sendAppointmentReminder(id, dto, userId);
        return ResponseEntity.ok(result);
    }

    /**
     * #8 - Receptionist-safe appointment detail (aggregated)
     * GET /api/receptionist/appointments/{id}/detail
     */
    @GetMapping("/{id}/detail")
    @Operation(summary = "Appointment detail", description = "Get comprehensive appointment detail with patient/doctor/payment info (receptionist-safe)")
    public ResponseEntity<ReceptionistAppointmentDetailDTO> getAppointmentDetail(
            @PathVariable Long id) {
        
        log.info("GET /receptionist/appointments/{}/detail", id);
        
        // SHARED service — get full admin detail, then MAP to privacy-safe DTO at controller
        AppointmentDetailDTO full = appointmentService.getAppointmentDetail(id);
        ReceptionistAppointmentDetailDTO detail = mapToReceptionistDetail(full);
        return ResponseEntity.ok(detail);
    }

    /**
     * #9 - Communication logs (receptionist-safe)
     * GET /api/receptionist/appointments/{id}/communications
     */
    @GetMapping("/{id}/communications")
    @Operation(summary = "Communication logs", description = "Get communication history for an appointment (filtered for receptionist)")
    public ResponseEntity<List<CommunicationLogDTO>> getCommunicationLogs(
            @PathVariable Long id) {
        
        log.info("GET /receptionist/appointments/{}/communications", id);
        
        // SHARED service — get full logs, then MASK at controller layer
        List<CommunicationLogDTO> fullLogs = appointmentService.getCommunicationLogs(id);
        List<CommunicationLogDTO> masked = fullLogs.stream()
                .map(l -> CommunicationLogDTO.builder()
                        .id(l.getId())
                        .type(l.getType())
                        .recipient(privacyMaskingService.maskEmail(l.getRecipient()))
                        .subject(l.getSubject())
                        .message(null)  // strip body — receptionist doesn't see content
                        .status(l.getStatus())
                        .sentByUserId(l.getSentByUserId())
                        .sentByUserName(l.getSentByUserName())
                        .sentAt(l.getSentAt())
                        .createdAt(l.getCreatedAt())
                        .category(l.getCategory())
                        .build())
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(masked);
    }

    /**
     * #10 - Send template-based message
     * POST /api/receptionist/appointments/{id}/send-message
     */
    @PostMapping("/{id}/send-message")
    @Operation(summary = "Send template message", description = "Send a template-based message to patient (no free text)")
    public ResponseEntity<CommunicationLogDTO> sendTemplateMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendTemplateMessageDTO dto) {
        
        Long userId = getCurrentUserId(null);
        log.info("POST /receptionist/appointments/{}/send-message - template: {}", id, dto.getTemplateId());
        
        CommunicationLogDTO result = appointmentService.sendTemplateMessage(id, dto, userId);
        return ResponseEntity.ok(result);
    }

    /**
     * #11 - Document summaries (receptionist-safe)
     * GET /api/receptionist/appointments/{id}/documents
     */
    @GetMapping("/{id}/documents")
    @Operation(summary = "Appointment documents", description = "List document summaries. Clinical docs show 'exists' but are not accessible.")
    public ResponseEntity<List<DocumentSummaryDTO>> getDocuments(
            @PathVariable Long id) {
        
        log.info("GET /receptionist/appointments/{}/documents", id);
        
        List<DocumentSummaryDTO> docs = appointmentService.getAppointmentDocuments(id);
        return ResponseEntity.ok(docs);
    }

    /**
     * #14 - Create follow-up appointment from a COMPLETED appointment
     * POST /api/receptionist/appointments/{id}/create-follow-up
     */
    @PostMapping("/{id}/create-follow-up")
    @Operation(summary = "Create follow-up", description = "Create a follow-up appointment from a completed appointment")
    public ResponseEntity<AppointmentDTO> createFollowUp(
            @PathVariable Long id,
            @Valid @RequestBody CreateFollowUpDTO dto) {
        
        Long userId = getCurrentUserId(null);
        log.info("POST /receptionist/appointments/{}/create-follow-up", id);
        
        AppointmentDTO result = appointmentService.createFollowUp(id, dto, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * #15 - Print check-in slip (PDF)
     * GET /api/receptionist/appointments/{id}/print-slip
     */
    @GetMapping("/{id}/print-slip")
    @Operation(summary = "Print check-in slip", description = "Generate and download a check-in slip PDF")
    public ResponseEntity<byte[]> printCheckInSlip(@PathVariable Long id) {
        
        log.info("GET /receptionist/appointments/{}/print-slip", id);
        
        byte[] data = appointmentService.generateCheckInSlip(id);
        String filename = "checkin_slip_" + id + ".pdf";
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    /**
     * #16 - Get notification templates
     * GET /api/receptionist/appointments/notification-templates
     */
    @GetMapping("/notification-templates")
    @Operation(summary = "Notification templates", description = "Get available notification templates for reminders/messages")
    public ResponseEntity<List<NotificationTemplateDTO>> getNotificationTemplates() {
        
        log.info("GET /receptionist/appointments/notification-templates");
        
        List<NotificationTemplateDTO> templates = appointmentService.getNotificationTemplates();
        return ResponseEntity.ok(templates);
    }

    /**
     * #17 - Get appointment categories for dropdown
     * GET /api/receptionist/appointments/categories
     */
    @GetMapping("/categories")
    @Operation(summary = "Appointment categories", description = "Get appointment categories for 'reason for visit' dropdown")
    public ResponseEntity<List<AppointmentCategoryDTO>> getCategories() {
        
        log.info("GET /receptionist/appointments/categories");
        
        List<AppointmentCategoryDTO> categories = appointmentService.getAppointmentCategories();
        return ResponseEntity.ok(categories);
    }
    
    /**
     * #19 - Export appointments (CSV/Excel/PDF)
     * GET /api/receptionist/appointments/export
     */
    @GetMapping("/export")
    @Operation(summary = "Export appointments", description = "Export filtered appointment data to CSV, Excel, or PDF")
    public ResponseEntity<byte[]> exportAppointments(
            @Parameter(description = "Filter by doctor ID") @RequestParam(required = false) Long doctorId,
            @Parameter(description = "Filter by patient ID") @RequestParam(required = false) Long patientId,
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @Parameter(description = "Filter by multiple statuses") @RequestParam(required = false) List<String> statuses,
            @Parameter(description = "From date (yyyy-MM-dd)") @RequestParam(required = false) String from,
            @Parameter(description = "To date (yyyy-MM-dd)") @RequestParam(required = false) String to,
            @Parameter(description = "Search by patient/doctor name or code") @RequestParam(required = false) String search,
            @Parameter(description = "Export format: CSV, EXCEL, PDF") @RequestParam(defaultValue = "CSV") String format,
            @Parameter(description = "Columns to include") @RequestParam(required = false) List<String> columns) {
        
        log.info("GET /receptionist/appointments/export - format: {}, from: {}, to: {}, search: {}", format, from, to, search);
        
        ExportFilterDTO filter = ExportFilterDTO.builder()
                .doctorId(doctorId)
                .patientId(patientId)
                .status(status != null ? AppointmentStatus.valueOf(status.toUpperCase()) : null)
                .statuses(statuses != null ? statuses.stream()
                        .map(s -> AppointmentStatus.valueOf(s.toUpperCase()))
                        .toList() : null)
                .from(from != null ? LocalDate.parse(from) : null)
                .to(to != null ? LocalDate.parse(to) : null)
                .search(search)
                .format(format)
                .columns(columns)
                .build();
        
        byte[] data = appointmentService.exportAppointments(filter);
        
        String filename = "receptionist_appointments_" + LocalDate.now() + "." + format.toLowerCase();
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
    
    // ==================== HELPER ====================

    // --- B. Today's Appointments ---

    /**
     * B - List today's appointments with masked phone
     * GET /api/receptionist/appointments/today
     */
    @GetMapping("/today")
    @Operation(summary = "Today's appointments", description = "List today's appointments with privacy-masked patient data")
    public ResponseEntity<Page<ReceptionistAppointmentListDTO>> getTodayAppointments(
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(defaultValue = "startTime") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortOrder) {

        log.info("GET /receptionist/appointments/today - status: {}", status);
        Page<ReceptionistAppointmentListDTO> result = dashboardService.getTodayAppointments(
                status, pageNumber, pageSize, sortBy, sortOrder);

        // Enrich with service order payment status
        List<Long> todayAppIds = result.getContent().stream()
                .map(ReceptionistAppointmentListDTO::getId).collect(Collectors.toList());
        Map<Long, String> todaySoStatuses = computeServiceOrderPaymentStatuses(todayAppIds);
        result.getContent().forEach(dto -> dto.setServiceOrderPaymentStatus(todaySoStatuses.get(dto.getId())));

        return ResponseEntity.ok(result);
    }

    // --- C. Today's Upcoming ---

    /**
     * C - Get next N upcoming appointments (CONFIRMED, startTime > now)
     * GET /api/receptionist/appointments/today/upcoming
     */
    @GetMapping("/today/upcoming")
    @Operation(summary = "Upcoming appointments", description = "Top N appointments arriving soon today")
    public ResponseEntity<List<UpcomingAppointmentDTO>> getTodayUpcoming(
            @Parameter(description = "Max results (default 5)")
            @RequestParam(defaultValue = "5") int limit) {

        log.info("GET /receptionist/appointments/today/upcoming - limit: {}", limit);
        List<UpcomingAppointmentDTO> result = dashboardService.getTodayUpcoming(limit);
        return ResponseEntity.ok(result);
    }

    // --- G. Need Confirmation ---

    /**
     * G - List appointments needing confirmation (PENDING for today)
     * GET /api/receptionist/appointments/need-confirmation
     */
    @GetMapping("/need-confirmation")
    @Operation(summary = "Need confirmation", description = "Appointments with PENDING status that need receptionist confirmation")
    public ResponseEntity<Page<AppointmentConfirmDTO>> getNeedConfirmation(
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize) {

        log.info("GET /receptionist/appointments/need-confirmation - page: {}", pageNumber);
        Page<AppointmentConfirmDTO> result = dashboardService.getNeedConfirmation(pageNumber, pageSize);
        return ResponseEntity.ok(result);
    }

    // --- H. No-Shows List ---

    /**
     * H - List overdue appointments (candidates for marking NO_SHOW)
     * GET /api/receptionist/appointments/no-shows
     */
    @GetMapping("/no-shows")
    @Operation(summary = "No-show candidates", description = "Appointments past their start time that haven't checked in")
    public ResponseEntity<Page<NoShowAppointmentDTO>> getNoShowCandidates(
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "10") int pageSize) {

        log.info("GET /receptionist/appointments/no-shows - page: {}", pageNumber);
        Page<NoShowAppointmentDTO> result = dashboardService.getNoShowCandidates(pageNumber, pageSize);
        return ResponseEntity.ok(result);
    }

    // ==================== PRIVATE HELPER ====================
    
    private Long getCurrentUserId(UserDetails userDetails) {
        return SecurityUtil.getCurrentUserId();
    }

    /**
     * Compute aggregated service order payment status per appointment.
     * Returns: null (no orders), "UNPAID" (all unpaid), "PARTIAL" (some paid), "PAID" (all paid)
     */
    private Map<Long, String> computeServiceOrderPaymentStatuses(List<Long> appointmentIds) {
        Map<Long, String> result = new HashMap<>();
        if (appointmentIds == null || appointmentIds.isEmpty()) return result;

        List<ServiceOrder> allOrders = serviceOrderRepository.findByAppointmentIdIn(appointmentIds);
        // Group by appointmentId
        Map<Long, List<ServiceOrder>> grouped = allOrders.stream()
                .filter(o -> o.getStatus() != ServiceOrderStatus.CANCELLED)
                .collect(Collectors.groupingBy(o -> o.getAppointment().getId()));

        for (Map.Entry<Long, List<ServiceOrder>> entry : grouped.entrySet()) {
            List<ServiceOrder> orders = entry.getValue();
            if (orders.isEmpty()) continue;

            long paidCount = orders.stream().filter(o -> "PAID".equals(o.getPaymentStatus())).count();
            if (paidCount == 0) {
                result.put(entry.getKey(), "UNPAID");
            } else if (paidCount == orders.size()) {
                result.put(entry.getKey(), "PAID");
            } else {
                result.put(entry.getKey(), "PARTIAL");
            }
        }
        return result;
    }

    // ==================== DTO MAPPING — Admin → Receptionist (PHI-safe) ====================

    /**
     * Map full AppointmentDetailDTO (admin-level) → ReceptionistAppointmentDetailDTO (privacy-safe).
     * Strips PHI (allergies, blood type, address, license, etc.), masks phone/email.
     */
    private ReceptionistAppointmentDetailDTO mapToReceptionistDetail(AppointmentDetailDTO full) {
        // Patient card — mask phone, omit address/blood/allergies/emergency
        ReceptionistAppointmentDetailDTO.PatientCard patientCard =
                ReceptionistAppointmentDetailDTO.PatientCard.builder()
                        .id(full.getPatient().getId())
                        .name(full.getPatient().getFullName())
                        .maskedPhone(privacyMaskingService.maskPhone(full.getPatient().getPhone()))
                        .email(full.getPatient().getEmail())
                        .gender(full.getPatient().getGender())
                        .dateOfBirth(full.getPatient().getDateOfBirth())
                        .build();

        // Appointment card
        int durationMinutes = 0;
        if (full.getStartTime() != null && full.getEndTime() != null) {
            durationMinutes = (int) java.time.Duration.between(full.getStartTime(), full.getEndTime()).toMinutes();
        }
        ReceptionistAppointmentDetailDTO.AppointmentCard appointmentCard =
                ReceptionistAppointmentDetailDTO.AppointmentCard.builder()
                        .appointmentDate(full.getAppointmentDate())
                        .startTime(full.getStartTime())
                        .endTime(full.getEndTime())
                        .durationMinutes(durationMinutes)
                        .status(full.getStatus())
                        .queueNumber(full.getQueueNumber())
                        .checkedInAt(full.getCheckedInAt())
                        .cancellationReason(full.getCancellationReason())
                        .build();

        // Doctor card — omit license, bio, education, rating, avatar
        ReceptionistAppointmentDetailDTO.DoctorCard doctorCard =
                ReceptionistAppointmentDetailDTO.DoctorCard.builder()
                        .id(full.getDoctor().getId())
                        .name(full.getDoctor().getFullName())
                        .specialization(full.getDoctor().getSpecialization())
                        .consultationFee(full.getDoctor().getConsultationFee())
                        .build();

        // Payment card — fetch from payment repository
        ReceptionistAppointmentDetailDTO.PaymentCard paymentCard = null;
        Optional<Payment> paymentOpt = paymentRepository.findByAppointmentIdWithDetails(full.getId());
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            paymentCard = ReceptionistAppointmentDetailDTO.PaymentCard.builder()
                    .paymentId(payment.getId())
                    .fee(payment.getTotalAmount())
                    .paymentStatus(payment.getPaymentStatus())
                    .paymentMethod(payment.getPaymentMethod())
                    .paidAt(payment.getPaidAt())
                    .build();
        }

        // Allowed actions (receptionist-specific)
        List<String> allowedActions = getReceptionistAllowedActions(full.getStatus());

        String createdByName = full.getBookedByUserName() != null
                ? full.getBookedByUserName()
                : (full.getBookedBy() != null ? full.getBookedBy().name() : "System");

        return ReceptionistAppointmentDetailDTO.builder()
                .id(full.getId())
                .appointmentCode(full.getAppointmentCode())
                .status(full.getStatus())
                .createdAt(full.getCreatedAt())
                .updatedAt(full.getUpdatedAt())
                .createdByName(createdByName)
                .bookedBy(full.getBookedBy())
                .patient(patientCard)
                .appointment(appointmentCard)
                .doctor(doctorCard)
                .payment(paymentCard)
                .allowedActions(allowedActions)
                .build();
    }

    private List<String> getReceptionistAllowedActions(AppointmentStatus status) {
        return switch (status) {
            case PENDING -> List.of("VIEW", "CONFIRM", "RESCHEDULE", "CANCEL");
            case SCHEDULED -> List.of("VIEW", "CONFIRM", "RESCHEDULE", "CANCEL");
            case CONFIRMED -> List.of("CHECK_IN", "RESCHEDULE", "CANCEL", "SEND_REMINDER", "PRINT_SLIP");
            case CHECKED_IN -> List.of("VIEW_QUEUE", "MARK_NO_SHOW", "NOTIFY_DOCTOR");
            case IN_PROGRESS -> List.of("VIEW");
            case AWAITING_SERVICE_RESULTS -> List.of("VIEW");
            case COMPLETED -> List.of("COLLECT_PAYMENT", "RECEIPT", "CREATE_FOLLOW_UP");
            case CANCELLED, NO_SHOW -> List.of("VIEW_REASON", "REBOOK");
            case RESCHEDULED -> List.of("VIEW");
        };
    }

    // masking is now handled by PrivacyMaskingService
}