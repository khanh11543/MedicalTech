package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.RefundMethod;
import com.q2k.meditech.entity.enums.RefundReason;
import com.q2k.meditech.entity.enums.RefundStatus;
import com.q2k.meditech.entity.enums.RefundType;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.util.ExportUtil;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Implementation of RefundService
 * 
 * Lifecycle: REQUESTED → APPROVED → PROCESSING → COMPLETED / FAILED
 *            REQUESTED → REJECTED
 *            APPROVED  → REJECTED
 *            FAILED    → PROCESSING (retry)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefundServiceImpl implements RefundService {

    private final RefundRepository refundRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationInventoryRepository medicationInventoryRepository;
    private final MedicationInventoryLogRepository medicationInventoryLogRepository;

    // ========== LIST / FILTER ==========

    @Override
    @Transactional(readOnly = true)
    public Page<RefundResponseDTO> getAllRefunds(
            String status,
            Long doctorId,
            Long patientId,
            String from,
            String to,
            String refundMethodStr,
            String refundReasonTypeStr,
            String searchTerm,
            Double minAmount,
            Double maxAmount,
            int pageNumber,
            int pageSize,
            String sortBy,
            String sortDir) {

        log.info("Getting refunds - status: {}, doctorId: {}, patientId: {}, method: {}, reason: {}",
                status, doctorId, patientId, refundMethodStr, refundReasonTypeStr);

        // Parse status
        RefundStatus refundStatus = parseEnum(status, RefundStatus.class, "refund status");

        // Parse refund method
        RefundMethod refundMethod = parseEnum(refundMethodStr, RefundMethod.class, "refund method");

        // Parse refund reason type
        RefundReason refundReasonType = parseEnum(refundReasonTypeStr, RefundReason.class, "refund reason type");

        // Parse dates
        LocalDateTime fromDate = parseDate(from, true);
        LocalDateTime toDate = parseDate(to, false);

        // Parse amounts
        BigDecimal min = minAmount != null ? BigDecimal.valueOf(minAmount) : null;
        BigDecimal max = maxAmount != null ? BigDecimal.valueOf(maxAmount) : null;

        // Map sort field
        String sortField = mapSortField(sortBy);

        // Create pageable
        Sort sort = sortDir.equalsIgnoreCase("ASC")
                ? Sort.by(sortField).ascending()
                : Sort.by(sortField).descending();
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        // Query
        Page<Refund> refunds = refundRepository.findAllWithFilters(
                refundStatus, doctorId, patientId, refundMethod, refundReasonType,
                searchTerm, fromDate, toDate, min, max, pageable);

        return refunds.map(this::mapToResponseDTO);
    }

    // ========== STATISTICS ==========

    @Override
    @Transactional(readOnly = true)
    public RefundStatsDTO getRefundStatistics(String from, String to) {
        log.info("Getting refund statistics - from: {}, to: {}", from, to);

        LocalDateTime fromDate = parseDate(from, true);
        LocalDateTime toDate = parseDate(to, false);

        // Count by status
        Long requestedCount = refundRepository.countByStatusInDateRange(RefundStatus.REQUESTED, fromDate, toDate);
        Long approvedCount = refundRepository.countByStatusInDateRange(RefundStatus.APPROVED, fromDate, toDate);
        Long pendingCount = refundRepository.countByStatusInDateRange(RefundStatus.PENDING, fromDate, toDate);
        Long processingCount = refundRepository.countByStatusInDateRange(RefundStatus.PROCESSING, fromDate, toDate);
        Long completedCount = refundRepository.countByStatusInDateRange(RefundStatus.COMPLETED, fromDate, toDate);
        Long failedCount = refundRepository.countByStatusInDateRange(RefundStatus.FAILED, fromDate, toDate);
        Long rejectedCount = refundRepository.countByStatusInDateRange(RefundStatus.REJECTED, fromDate, toDate);

        Long totalRefunds = refundRepository.countInDateRange(fromDate, toDate);
        BigDecimal totalRefundAmount = refundRepository.sumRefundAmountInDateRange(fromDate, toDate);

        // Amount by status
        BigDecimal pendingAmount = refundRepository.sumRefundAmountByStatusInDateRange(RefundStatus.PENDING, fromDate, toDate);
        BigDecimal completedAmount = refundRepository.sumRefundAmountByStatusInDateRange(RefundStatus.COMPLETED, fromDate, toDate);

        // Calculate refund rate
        Double refundRate = 0.0;
        try {
            Long totalPayments = paymentRepository.countCompletedInDateRange(fromDate, toDate);
            if (totalPayments != null && totalPayments > 0) {
                refundRate = (completedCount.doubleValue() / totalPayments.doubleValue()) * 100;
            }
        } catch (Exception e) {
            log.warn("Could not calculate refund rate: {}", e.getMessage());
        }

        // By payment method
        Map<String, Long> refundsByPaymentMethod = new HashMap<>();
        Map<String, BigDecimal> refundAmountByPaymentMethod = new HashMap<>();

        try {
            List<Object[]> methodStats = refundRepository.countAndSumByPaymentMethodInDateRange(fromDate, toDate);
            for (Object[] row : methodStats) {
                String method = (String) row[0];
                Long count = ((Number) row[1]).longValue();
                BigDecimal amount = (BigDecimal) row[2];

                if (method != null) {
                    refundsByPaymentMethod.put(method, count);
                    refundAmountByPaymentMethod.put(method, amount);
                }
            }
        } catch (Exception e) {
            log.warn("Could not get refunds by payment method: {}", e.getMessage());
        }

        // Average processing time
        Double averageProcessingTime = null;
        try {
            averageProcessingTime = refundRepository.calculateAverageProcessingTimeInDateRange(fromDate, toDate);
        } catch (Exception e) {
            log.warn("Could not calculate average processing time: {}", e.getMessage());
        }

        return RefundStatsDTO.builder()
                .totalRefunds(totalRefunds)
                .totalRefundAmount(totalRefundAmount)
                .requestedCount(requestedCount)
                .approvedCount(approvedCount)
                .pendingCount(pendingCount)
                .processingCount(processingCount)
                .completedCount(completedCount)
                .failedCount(failedCount)
                .rejectedCount(rejectedCount)
                .pendingAmount(pendingAmount)
                .completedAmount(completedAmount)
                .refundRate(refundRate)
                .refundsByPaymentMethod(refundsByPaymentMethod)
                .refundAmountByPaymentMethod(refundAmountByPaymentMethod)
                .averageProcessingTime(averageProcessingTime)
                .fromDate(from)
                .toDate(to)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportRefunds(
            String status,
            Long doctorId,
            Long patientId,
            String from,
            String to,
            String refundMethodStr,
            String refundReasonTypeStr,
            String searchTerm,
            Double minAmount,
            Double maxAmount,
            String sortBy,
            String sortDir,
            String format) {

        log.info("Exporting refunds — format: {}", format);

        String effectiveSortBy = (sortBy != null && !sortBy.isBlank()) ? sortBy : "requestedDate";
        String effectiveSortDir = (sortDir != null && !sortDir.isBlank()) ? sortDir : "DESC";

        Page<RefundResponseDTO> page = getAllRefunds(
                status, doctorId, patientId, from, to,
                refundMethodStr, refundReasonTypeStr, searchTerm,
                minAmount, maxAmount,
                0, 10_000,
                effectiveSortBy, effectiveSortDir);

        List<RefundResponseDTO> rows = page.getContent();

        if ("CSV".equalsIgnoreCase(format)) {
            return ExportUtil.toCsv(refundExportColumns(), rows);
        }
        if ("PDF".equalsIgnoreCase(format)) {
            try {
                return ExportUtil.toPdf(refundExportColumns(), rows, "Refund Export Report");
            } catch (IOException e) {
                log.error("Error generating refund PDF export", e);
                throw new RuntimeException("Failed to generate PDF export", e);
            }
        }
        try {
            return ExportUtil.toExcel(refundExportColumns(), rows, "Refunds");
        } catch (IOException e) {
            log.error("Error generating refund Excel export", e);
            throw new RuntimeException("Failed to generate Excel export", e);
        }
    }

    private List<ExportUtil.ExportColumn<RefundResponseDTO>> refundExportColumns() {
        return List.of(
                ExportUtil.ExportColumn.of("Refund Code", r -> nz(r.getRefundCode())),
                ExportUtil.ExportColumn.of("Status", r -> r.getStatus() != null ? r.getStatus().name() : ""),
                ExportUtil.ExportColumn.of("Payment Code", r -> nz(r.getPaymentCode())),
                ExportUtil.ExportColumn.of("Patient", r -> nz(r.getPatientName())),
                ExportUtil.ExportColumn.of("Doctor", r -> nz(r.getDoctorName())),
                ExportUtil.ExportColumn.of("Refund Amount",
                        r -> r.getRefundAmount() != null ? r.getRefundAmount().toPlainString() : ""),
                ExportUtil.ExportColumn.of("Original Amount",
                        r -> r.getOriginalAmount() != null ? r.getOriginalAmount().toPlainString() : ""),
                ExportUtil.ExportColumn.of("Currency", r -> nz(r.getCurrency())),
                ExportUtil.ExportColumn.of("Refund Method", r -> nz(r.getRefundMethod())),
                ExportUtil.ExportColumn.of("Reason Type", r -> nz(r.getRefundReasonType())),
                ExportUtil.ExportColumn.of("Requested", r -> ExportUtil.formatDateTime(r.getRequestedDate())),
                ExportUtil.ExportColumn.of("Appointment", r -> nz(r.getAppointmentCode()))
        );
    }

    private static String nz(String s) {
        return s != null ? s : "";
    }

    // ========== DETAIL ==========

    @Override
    @Transactional(readOnly = true)
    public RefundDetailDTO getRefundDetail(Long refundId) {
        log.info("Getting refund detail for ID: {}", refundId);

        Refund refund = refundRepository.findByIdWithDetails(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund", "id", refundId));

        Payment payment = refund.getPayment();
        Patient patient = payment.getPatient();
        Doctor doctor = payment.getAppointment().getDoctor();
        Appointment appointment = payment.getAppointment();

        // Calculate refund percentage
        BigDecimal refundPercentage = BigDecimal.ZERO;
        if (refund.getOriginalAmount().compareTo(BigDecimal.ZERO) > 0) {
            refundPercentage = refund.getRefundAmount()
                    .divide(refund.getOriginalAmount(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        RefundDetailDTO.RefundDetailDTOBuilder builder = RefundDetailDTO.builder()
                // Refund Info
                .id(refund.getId())
                .refundCode(refund.getRefundCode())
                .status(refund.getStatus())
                .refundReason(refund.getRefundReason())
                .refundReasonType(refund.getRefundReasonType() != null ? refund.getRefundReasonType().name() : null)
                .refundMethod(refund.getRefundMethod() != null ? refund.getRefundMethod().name() : null)
                .refundType(refund.getRefundType() != null ? refund.getRefundType().name() : null)
                .urgent(refund.getUrgent())
                .retryCount(refund.getRetryCount())
                .maxRetries(refund.getMaxRetries())
                // Amount Info
                .refundAmount(refund.getRefundAmount())
                .originalAmount(refund.getOriginalAmount())
                .currency(refund.getCurrency())
                .refundPercentage(refundPercentage)
                // Payment Info
                .paymentId(payment.getId())
                .paymentCode(payment.getPaymentCode())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .paymentDate(payment.getPaidAt())
                .transactionId(payment.getTransactionId())
                // Patient Info
                .patientId(patient.getId())
                .patientName(patient.getUser().getFullName())
                .patientEmail(patient.getUser().getEmail())
                .patientPhone(patient.getUser().getPhone())
                // Doctor Info
                .doctorId(doctor.getId())
                .doctorName(doctor.getUser().getFullName())
                .doctorSpecialization(doctor.getSpecialization())
                // Appointment Info
                .appointmentId(appointment.getId())
                .appointmentCode(appointment.getAppointmentCode())
                .appointmentDate(appointment.getAppointmentDate() != null
                        ? appointment.getAppointmentDate().atStartOfDay() : null)
                .appointmentStatus(appointment.getStatus() != null 
                        ? appointment.getStatus().name() : null)
                // Request Info
                .requestedDate(refund.getRequestedDate())
                .notes(refund.getNotes())
                // Approval Info
                .approvedDate(refund.getApprovedDate())
                // Processing Info
                .processedDate(refund.getProcessedDate())
                .transactionReference(refund.getTransactionReference())
                .gatewayRefundId(refund.getGatewayRefundId())
                .processingNotes(refund.getProcessingNotes())
                // Evidence
                .evidenceUrl(refund.getEvidenceUrl())
                .cashierConfirmed(refund.getCashierConfirmed())
                .workstationId(refund.getWorkstationId())
                // Rejection Info
                .rejectedDate(refund.getRejectedDate())
                .rejectionReason(refund.getRejectionReason())
                // Timestamps
                .createdAt(refund.getCreatedAt())
                .updatedAt(refund.getUpdatedAt());

        // Add user info
        if (refund.getRequestedBy() != null) {
            builder.requestedById(refund.getRequestedBy().getId())
                    .requestedByName(refund.getRequestedBy().getFullName());
        }

        if (refund.getApprovedBy() != null) {
            builder.approvedById(refund.getApprovedBy().getId())
                    .approvedByName(refund.getApprovedBy().getFullName());
        }

        if (refund.getProcessedBy() != null) {
            builder.processedById(refund.getProcessedBy().getId())
                    .processedByName(refund.getProcessedBy().getFullName());
        }

        if (refund.getRejectedBy() != null) {
            builder.rejectedById(refund.getRejectedBy().getId())
                    .rejectedByName(refund.getRejectedBy().getFullName());
        }

        // Build history timeline
        List<RefundDetailDTO.RefundHistoryEvent> history = buildRefundHistory(refund);
        builder.history(history);

        return builder.build();
    }

    // ========== CREATE ==========

    @Override
    @Transactional
    public RefundResponseDTO createRefundRequest(Long paymentId, RefundDTO dto, Long currentUserId) {
        log.info("Creating refund request for payment: {} by user: {}", paymentId, currentUserId);

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Validate payment status - allow PAID or COMPLETED
        String paymentStatus = payment.getPaymentStatus();
        if (!"PAID".equals(paymentStatus) && !"COMPLETED".equals(paymentStatus)) {
            throw new BadRequestException("Can only refund PAID or COMPLETED payments. Current status: " + paymentStatus);
        }

        // Check for existing active refund
        if (refundRepository.existsPendingRefundForPayment(paymentId)) {
            throw new BadRequestException("Payment already has an active refund request (REQUESTED/APPROVED/PROCESSING)");
        }

        // Validate refund amount with partial refund awareness
        BigDecimal alreadyRefunded = refundRepository.sumCompletedRefundAmountByPaymentId(paymentId);
        BigDecimal activeRefunds = refundRepository.sumActiveRefundAmountByPaymentId(paymentId);
        BigDecimal available = payment.getTotalAmount().subtract(alreadyRefunded).subtract(activeRefunds);

        if (dto.getRefundAmount().compareTo(available) > 0) {
            throw new BadRequestException(
                    String.format("Refund amount (%.2f) exceeds available refundable amount (%.2f). " +
                                    "Total: %.2f, Already refunded: %.2f, Active requests: %.2f",
                            dto.getRefundAmount(), available,
                            payment.getTotalAmount(), alreadyRefunded, activeRefunds));
        }

        User requestedBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Parse enums from DTO
        RefundReason refundReasonType = parseEnum(dto.getRefundReasonType(), RefundReason.class, "refund reason type");
        RefundMethod refundMethod = parseEnum(dto.getRefundMethod(), RefundMethod.class, "refund method");
        RefundType refundType = parseEnum(dto.getRefundType(), RefundType.class, "refund type");

        // Generate refund code
        String refundCode = generateRefundCode();

        // Create refund with REQUESTED status
        Refund refund = Refund.builder()
                .refundCode(refundCode)
                .payment(payment)
                .refundAmount(dto.getRefundAmount())
                .originalAmount(payment.getTotalAmount())
                .currency(payment.getCurrency())
                .status(RefundStatus.REQUESTED)
                .refundReason(dto.getRefundReason())
                .refundReasonType(refundReasonType)
                .refundMethod(refundMethod != null ? refundMethod : RefundMethod.ORIGINAL_METHOD)
                .refundType(refundType != null ? refundType : RefundType.MANUAL)
                .requestedDate(LocalDateTime.now())
                .requestedBy(requestedBy)
                .notes(dto.getNotes())
                .retryCount(0)
                .maxRetries(3)
                .build();

        Refund saved = refundRepository.save(refund);

        // Log audit
        logRefundAudit(saved, "REFUND_REQUESTED", currentUserId,
                String.format("Refund requested. Amount: %s, Reason: %s, Method: %s",
                        dto.getRefundAmount(), dto.getRefundReason(), refundMethod));

        log.info("Refund request created: {}", refundCode);
        return mapToResponseDTO(saved);
    }

    // ========== APPROVE (REQUESTED → APPROVED) ==========

    @Override
    @Transactional
    public RefundResponseDTO approveRefund(Long refundId, ApproveRefundDTO dto, Long currentUserId) {
        log.info("Approving refund ID: {} by user: {}", refundId, currentUserId);

        Refund refund = refundRepository.findByIdWithDetails(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund", "id", refundId));

        // Validate status
        if (!refund.canBeApproved()) {
            throw new BadRequestException("Can only approve REQUESTED refunds. Current status: " + refund.getStatus());
        }

        // Segregation of duties: approver must NOT be the requester
        if (refund.getRequestedBy() != null && refund.getRequestedBy().getId().equals(currentUserId)) {
            throw new BadRequestException("Segregation of duties: the approver cannot be the same person who requested the refund");
        }

        User approvedBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Update refund
        refund.setStatus(RefundStatus.APPROVED);
        refund.setApprovedDate(LocalDateTime.now());
        refund.setApprovedBy(approvedBy);

        // Add approval notes to processing notes
        if (dto.getApprovalNotes() != null && !dto.getApprovalNotes().isBlank()) {
            String existingNotes = refund.getProcessingNotes() != null ? refund.getProcessingNotes() + "\n" : "";
            refund.setProcessingNotes(existingNotes + "[Approval] " + dto.getApprovalNotes());
        }

        Refund saved = refundRepository.save(refund);

        // Log audit
        logRefundAudit(saved, "REFUND_APPROVED", currentUserId,
                "Refund approved by " + approvedBy.getFullName() +
                        (dto.getApprovalNotes() != null ? ". Notes: " + dto.getApprovalNotes() : ""));

        // Send notification
        if (Boolean.TRUE.equals(dto.getSendNotification())) {
            sendRefundNotification(refund, "APPROVED");
        }

        log.info("Refund {} approved successfully", refundId);
        return mapToResponseDTO(saved);
    }

    // ========== PROCESS (APPROVED → COMPLETED) ==========

    @Override
    @Transactional
    public RefundResponseDTO processRefund(Long refundId, ProcessRefundDTO dto, Long currentUserId) {
        log.info("Processing refund ID: {} by user: {}", refundId, currentUserId);

        Refund refund = refundRepository.findByIdWithDetails(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund", "id", refundId));

        // Validate status - allow from APPROVED, PENDING (legacy), or PROCESSING
        if (!refund.canBeProcessed()) {
            throw new BadRequestException("Can only process APPROVED, PENDING, or PROCESSING refunds. Current status: "
                    + refund.getStatus());
        }

        User processedBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // If MANUAL type or specifically set in the DTO, apply manual refund fields
        RefundType dtoRefundType = parseEnum(dto.getRefundType(), RefundType.class, "refund type");
        RefundMethod dtoRefundMethod = parseEnum(dto.getRefundMethod(), RefundMethod.class, "refund method");

        if (dtoRefundType != null) {
            refund.setRefundType(dtoRefundType);
        }
        if (dtoRefundMethod != null) {
            refund.setRefundMethod(dtoRefundMethod);
        }

        // For MANUAL CASH refunds, require transactionReference and evidence
        if (refund.getRefundType() == RefundType.MANUAL && refund.getRefundMethod() == RefundMethod.CASH) {
            if (dto.getTransactionReference() == null || dto.getTransactionReference().isBlank()) {
                throw new BadRequestException("Manual cash refund requires a transaction reference (receipt number)");
            }
            if (!Boolean.TRUE.equals(dto.getCashierConfirmed())) {
                throw new BadRequestException("Manual cash refund requires cashier confirmation");
            }
        }

        // Update evidence/manual fields
        if (dto.getEvidenceUrl() != null) {
            refund.setEvidenceUrl(dto.getEvidenceUrl());
        }
        if (dto.getWorkstationId() != null) {
            refund.setWorkstationId(dto.getWorkstationId());
        }
        if (dto.getCashierConfirmed() != null) {
            refund.setCashierConfirmed(dto.getCashierConfirmed());
        }

        // Update refund
        refund.setStatus(RefundStatus.COMPLETED);
        refund.setProcessedDate(dto.getProcessedDate() != null ? dto.getProcessedDate() : LocalDateTime.now());
        refund.setProcessedBy(processedBy);
        refund.setTransactionReference(dto.getTransactionReference());
        refund.setProcessingNotes(appendNotes(refund.getProcessingNotes(), dto.getProcessingNotes()));

        // Update payment status
        Payment payment = refund.getPayment();
        BigDecimal totalRefunded = refundRepository.sumCompletedRefundAmountByPaymentId(payment.getId())
                .add(refund.getRefundAmount()); // Include current refund being completed
        
        if (totalRefunded.compareTo(payment.getTotalAmount()) >= 0) {
            payment.setPaymentStatus("REFUNDED");
        } else {
            payment.setPaymentStatus("PARTIALLY_REFUNDED");
        }
        payment.setRefundedAt(refund.getProcessedDate());
        payment.setRefundAmount(totalRefunded);
        payment.setRefundReason(refund.getRefundReason());

        Refund saved = refundRepository.save(refund);

        // Log audit
        logRefundAudit(saved, "REFUND_COMPLETED", currentUserId,
                String.format("Refund processed. Method: %s, Type: %s, Transaction: %s",
                        refund.getRefundMethod(), refund.getRefundType(), dto.getTransactionReference()));

        // Restore inventory if this is a prescription payment refund
        restoreInventoryIfPrescriptionRefund(saved);

        // Send notification if requested
        if (Boolean.TRUE.equals(dto.getSendNotification())) {
            sendRefundNotification(refund, "COMPLETED");
        }

        log.info("Refund {} processed successfully", refundId);
        return mapToResponseDTO(saved);
    }

    // ========== REJECT (REQUESTED/APPROVED → REJECTED) ==========

    @Override
    @Transactional
    public RefundResponseDTO rejectRefund(Long refundId, RejectRefundDTO dto, Long currentUserId) {
        log.info("Rejecting refund ID: {} by user: {}", refundId, currentUserId);

        Refund refund = refundRepository.findByIdWithDetails(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund", "id", refundId));

        // Validate status - allow rejection from REQUESTED, APPROVED, PENDING (legacy), PROCESSING
        if (!refund.canBeRejected()) {
            throw new BadRequestException("Can only reject REQUESTED, APPROVED, PENDING, or PROCESSING refunds. Current status: "
                    + refund.getStatus());
        }

        User rejectedBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        String previousStatus = refund.getStatus().name();

        // Update refund
        refund.setStatus(RefundStatus.REJECTED);
        refund.setRejectedDate(LocalDateTime.now());
        refund.setRejectedBy(rejectedBy);
        refund.setRejectionReason(dto.getRejectionReason());

        Refund saved = refundRepository.save(refund);

        // Log audit
        logRefundAudit(saved, "REFUND_REJECTED", currentUserId,
                String.format("Refund rejected (was %s). Reason: %s", previousStatus, dto.getRejectionReason()));

        // Send notification if requested
        if (Boolean.TRUE.equals(dto.getSendNotification())) {
            sendRefundNotification(refund, "REJECTED");
        }

        log.info("Refund {} rejected", refundId);
        return mapToResponseDTO(saved);
    }

    // ========== RETRY (FAILED → PROCESSING) ==========

    @Override
    @Transactional
    public RefundResponseDTO retryRefund(Long refundId, RetryRefundDTO dto, Long currentUserId) {
        log.info("Retrying refund ID: {} by user: {}", refundId, currentUserId);

        Refund refund = refundRepository.findByIdWithDetails(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund", "id", refundId));

        // Validate can retry
        if (!refund.canRetry()) {
            if (refund.getStatus() != RefundStatus.FAILED) {
                throw new BadRequestException("Can only retry FAILED refunds. Current status: " + refund.getStatus());
            } else {
                throw new BadRequestException(
                        String.format("Refund has reached max retry count (%d/%d). Create a new refund request instead.",
                                refund.getRetryCount(), refund.getMaxRetries()));
            }
        }

        User retriedBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Optionally switch method/type for retry
        RefundMethod newMethod = parseEnum(dto.getRefundMethod(), RefundMethod.class, "refund method");
        RefundType newType = parseEnum(dto.getRefundType(), RefundType.class, "refund type");

        if (newMethod != null) {
            refund.setRefundMethod(newMethod);
        }
        if (newType != null) {
            refund.setRefundType(newType);
        }

        // Increment retry count & reset to PROCESSING
        refund.setRetryCount(refund.getRetryCount() + 1);
        refund.setStatus(RefundStatus.PROCESSING);
        refund.setProcessedBy(retriedBy);
        refund.setProcessedDate(null); // Reset — will be set on completion

        // Append retry notes
        String retryNote = String.format("[Retry #%d] %s", refund.getRetryCount(),
                dto.getNotes() != null ? dto.getNotes() : "Retrying refund");
        refund.setProcessingNotes(appendNotes(refund.getProcessingNotes(), retryNote));

        Refund saved = refundRepository.save(refund);

        // Log audit
        logRefundAudit(saved, "REFUND_RETRIED", currentUserId,
                String.format("Refund retried (attempt %d/%d). Method: %s, Type: %s",
                        refund.getRetryCount(), refund.getMaxRetries(),
                        refund.getRefundMethod(), refund.getRefundType()));

        // Send notification
        if (Boolean.TRUE.equals(dto.getSendNotification())) {
            sendRefundNotification(refund, "RETRYING");
        }

        log.info("Refund {} retry initiated (attempt {}/{})", refundId, refund.getRetryCount(), refund.getMaxRetries());
        return mapToResponseDTO(saved);
    }

    // ========== MARK FAILED ==========

    @Override
    @Transactional
    public RefundResponseDTO markRefundFailed(Long refundId, String reason, Long currentUserId) {
        log.info("Marking refund ID: {} as FAILED. Reason: {}", refundId, reason);

        Refund refund = refundRepository.findByIdWithDetails(refundId)
                .orElseThrow(() -> new ResourceNotFoundException("Refund", "id", refundId));

        if (refund.getStatus() != RefundStatus.PROCESSING) {
            throw new BadRequestException("Can only mark PROCESSING refunds as FAILED. Current status: " + refund.getStatus());
        }

        refund.setStatus(RefundStatus.FAILED);
        refund.setProcessingNotes(appendNotes(refund.getProcessingNotes(), "[Failed] " + reason));

        Refund saved = refundRepository.save(refund);

        // Log audit
        logRefundAudit(saved, "REFUND_FAILED", currentUserId,
                "Refund failed. Reason: " + reason);

        sendRefundNotification(refund, "FAILED");

        log.info("Refund {} marked as FAILED", refundId);
        return mapToResponseDTO(saved);
    }

    // ========== HELPER METHODS ==========

    private RefundResponseDTO mapToResponseDTO(Refund refund) {
        RefundResponseDTO.RefundResponseDTOBuilder builder = RefundResponseDTO.builder()
                .id(refund.getId())
                .refundCode(refund.getRefundCode())
                .refundAmount(refund.getRefundAmount())
                .originalAmount(refund.getOriginalAmount())
                .currency(refund.getCurrency())
                .status(refund.getStatus())
                .refundReason(refund.getRefundReason())
                .refundReasonType(refund.getRefundReasonType() != null ? refund.getRefundReasonType().name() : null)
                .refundMethod(refund.getRefundMethod() != null ? refund.getRefundMethod().name() : null)
                .refundType(refund.getRefundType() != null ? refund.getRefundType().name() : null)
                .urgent(refund.getUrgent())
                .retryCount(refund.getRetryCount())
                .requestedDate(refund.getRequestedDate())
                .approvedDate(refund.getApprovedDate())
                .processedDate(refund.getProcessedDate())
                .transactionReference(refund.getTransactionReference())
                .rejectedDate(refund.getRejectedDate())
                .rejectionReason(refund.getRejectionReason())
                .notes(refund.getNotes())
                .createdAt(refund.getCreatedAt())
                .updatedAt(refund.getUpdatedAt());

        // Payment info
        Payment payment = refund.getPayment();
        if (payment != null) {
            builder.paymentId(payment.getId())
                    .paymentCode(payment.getPaymentCode())
                    .paymentMethod(payment.getPaymentMethod());

            // Patient info
            Patient patient = payment.getPatient();
            if (patient != null && patient.getUser() != null) {
                builder.patientId(patient.getId())
                        .patientName(patient.getUser().getFullName())
                        .patientEmail(patient.getUser().getEmail());
            }

            // Appointment & Doctor info
            Appointment appointment = payment.getAppointment();
            if (appointment != null) {
                builder.appointmentId(appointment.getId())
                        .appointmentCode(appointment.getAppointmentCode());

                Doctor doctor = appointment.getDoctor();
                if (doctor != null && doctor.getUser() != null) {
                    builder.doctorId(doctor.getId())
                            .doctorName(doctor.getUser().getFullName());
                }
            }
        }

        // User info
        if (refund.getRequestedBy() != null) {
            builder.requestedById(refund.getRequestedBy().getId())
                    .requestedByName(refund.getRequestedBy().getFullName());
        }

        if (refund.getApprovedBy() != null) {
            builder.approvedById(refund.getApprovedBy().getId())
                    .approvedByName(refund.getApprovedBy().getFullName());
        }

        if (refund.getProcessedBy() != null) {
            builder.processedById(refund.getProcessedBy().getId())
                    .processedByName(refund.getProcessedBy().getFullName());
        }

        if (refund.getRejectedBy() != null) {
            builder.rejectedById(refund.getRejectedBy().getId())
                    .rejectedByName(refund.getRejectedBy().getFullName());
        }

        return builder.build();
    }

    private List<RefundDetailDTO.RefundHistoryEvent> buildRefundHistory(Refund refund) {
        List<RefundDetailDTO.RefundHistoryEvent> history = new ArrayList<>();
        long eventId = 1;

        // 1. Created / Requested event
        history.add(RefundDetailDTO.RefundHistoryEvent.builder()
                .id(eventId++)
                .eventType("REQUESTED")
                .description("Refund request created")
                .newStatus("REQUESTED")
                .performedById(refund.getRequestedBy() != null ? refund.getRequestedBy().getId() : null)
                .performedByName(refund.getRequestedBy() != null ? refund.getRequestedBy().getFullName() : "System")
                .eventTime(refund.getRequestedDate())
                .build());

        // 2. Approved event
        if (refund.getApprovedDate() != null) {
            history.add(RefundDetailDTO.RefundHistoryEvent.builder()
                    .id(eventId++)
                    .eventType("APPROVED")
                    .description("Refund approved")
                    .previousStatus("REQUESTED")
                    .newStatus("APPROVED")
                    .performedById(refund.getApprovedBy() != null ? refund.getApprovedBy().getId() : null)
                    .performedByName(refund.getApprovedBy() != null ? refund.getApprovedBy().getFullName() : "System")
                    .eventTime(refund.getApprovedDate())
                    .build());
        }

        // 3. Processing event (if went through processing)
        if (refund.getStatus() == RefundStatus.PROCESSING ||
                refund.getStatus() == RefundStatus.COMPLETED ||
                refund.getStatus() == RefundStatus.FAILED) {

            String prevStatus = refund.getApprovedDate() != null ? "APPROVED" : "REQUESTED";
            LocalDateTime processingTime = refund.getProcessedDate() != null
                    ? refund.getProcessedDate().minusMinutes(1)
                    : refund.getUpdatedAt();

            history.add(RefundDetailDTO.RefundHistoryEvent.builder()
                    .id(eventId++)
                    .eventType("PROCESSING")
                    .description("Refund processing started" +
                            (refund.getRetryCount() > 0 ? " (retry #" + refund.getRetryCount() + ")" : ""))
                    .previousStatus(prevStatus)
                    .newStatus("PROCESSING")
                    .eventTime(processingTime)
                    .build());
        }

        // 4. Completed event
        if (refund.getStatus() == RefundStatus.COMPLETED && refund.getProcessedDate() != null) {
            history.add(RefundDetailDTO.RefundHistoryEvent.builder()
                    .id(eventId++)
                    .eventType("COMPLETED")
                    .description("Refund completed successfully" +
                            (refund.getRefundMethod() != null ? " via " + refund.getRefundMethod() : ""))
                    .previousStatus("PROCESSING")
                    .newStatus("COMPLETED")
                    .performedById(refund.getProcessedBy() != null ? refund.getProcessedBy().getId() : null)
                    .performedByName(refund.getProcessedBy() != null ? refund.getProcessedBy().getFullName() : "System")
                    .eventTime(refund.getProcessedDate())
                    .build());
        }

        // 5. Rejected event
        if (refund.getStatus() == RefundStatus.REJECTED && refund.getRejectedDate() != null) {
            String prevStatus = refund.getApprovedDate() != null ? "APPROVED"
                    : (refund.getProcessedDate() != null ? "PROCESSING" : "REQUESTED");
            history.add(RefundDetailDTO.RefundHistoryEvent.builder()
                    .id(eventId++)
                    .eventType("REJECTED")
                    .description("Refund rejected: " + refund.getRejectionReason())
                    .previousStatus(prevStatus)
                    .newStatus("REJECTED")
                    .performedById(refund.getRejectedBy() != null ? refund.getRejectedBy().getId() : null)
                    .performedByName(refund.getRejectedBy() != null ? refund.getRejectedBy().getFullName() : "System")
                    .eventTime(refund.getRejectedDate())
                    .build());
        }

        // 6. Failed event
        if (refund.getStatus() == RefundStatus.FAILED) {
            history.add(RefundDetailDTO.RefundHistoryEvent.builder()
                    .id(eventId++)
                    .eventType("FAILED")
                    .description("Refund processing failed" +
                            (refund.canRetry() ? " (can retry)" : " (max retries reached)"))
                    .previousStatus("PROCESSING")
                    .newStatus("FAILED")
                    .eventTime(refund.getUpdatedAt())
                    .build());
        }

        // Sort by event time
        history.sort((a, b) -> {
            if (a.getEventTime() == null) return -1;
            if (b.getEventTime() == null) return 1;
            return a.getEventTime().compareTo(b.getEventTime());
        });

        return history;
    }

    private String generateRefundCode() {
        String prefix = "RF" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String maxCode = refundRepository.findMaxRefundCodeByPrefix(prefix);

        int nextNumber = 1;
        if (maxCode != null && maxCode.length() > prefix.length()) {
            try {
                nextNumber = Integer.parseInt(maxCode.substring(prefix.length())) + 1;
            } catch (NumberFormatException e) {
                // Ignore, use 1
            }
        }

        return prefix + String.format("%04d", nextNumber);
    }

    private LocalDateTime parseDate(String dateStr, boolean isStartOfDay) {
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        try {
            LocalDate date = LocalDate.parse(dateStr);
            return isStartOfDay ? date.atStartOfDay() : date.atTime(23, 59, 59);
        } catch (Exception e) {
            throw new BadRequestException("Invalid date format: " + dateStr + ". Expected: yyyy-MM-dd");
        }
    }

    @SuppressWarnings("unchecked")
    private <T extends Enum<T>> T parseEnum(String value, Class<T> enumClass, String fieldName) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Enum.valueOf(enumClass, value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid " + fieldName + ": " + value +
                    ". Valid values: " + Arrays.toString(enumClass.getEnumConstants()));
        }
    }

    private String appendNotes(String existing, String addition) {
        if (addition == null || addition.isBlank()) return existing;
        if (existing == null || existing.isBlank()) return addition;
        return existing + "\n" + addition;
    }

    private String mapSortField(String sortBy) {
        if (sortBy == null) return "requestedDate";

        return switch (sortBy.toLowerCase()) {
            case "requesteddate", "requestdate" -> "requestedDate";
            case "processeddate" -> "processedDate";
            case "approveddate" -> "approvedDate";
            case "refundamount", "amount" -> "refundAmount";
            case "status" -> "status";
            case "createdat" -> "createdAt";
            default -> "requestedDate";
        };
    }

    private void restoreInventoryIfPrescriptionRefund(Refund refund) {
        try {
            Payment payment = refund.getPayment();
            if (payment == null || !"PRESCRIPTION".equals(payment.getReferenceType())
                    || payment.getPrescription() == null) {
                return;
            }

            Prescription prescription = prescriptionRepository
                    .findByIdWithDetails(payment.getPrescription().getId())
                    .orElse(null);
            if (prescription == null || prescription.getItems() == null) return;

            for (var item : prescription.getItems()) {
                if (item.getMedicationId() != null && item.getQuantity() != null && item.getQuantity() > 0) {
                    medicationInventoryRepository.findByMedicationId(item.getMedicationId())
                            .ifPresent(inventory -> {
                                int before = inventory.getQuantity();
                                int after = before + item.getQuantity();
                                inventory.setQuantity(after);
                                medicationInventoryRepository.save(inventory);

                                MedicationInventoryLog invLog = MedicationInventoryLog.builder()
                                        .medication(inventory.getMedication())
                                        .type("INVENTORY_RESTORE_BY_REFUND")
                                        .quantityBefore(before)
                                        .quantityAfter(after)
                                        .delta(after - before)
                                        .note("Refund " + refund.getRefundCode()
                                                + " for prescription " + prescription.getPrescriptionCode())
                                        .referenceType("REFUND")
                                        .referenceId(refund.getId())
                                        .changedAt(java.time.LocalDateTime.now())
                                        .build();
                                medicationInventoryLogRepository.save(invLog);

                                log.info("Restored {} units to medication ID {} ({}→{}) on refund {}",
                                        item.getQuantity(), item.getMedicationId(), before, after,
                                        refund.getRefundCode());
                            });
                }
            }
        } catch (Exception e) {
            log.error("Failed to restore inventory on refund {}: {}", refund.getRefundCode(), e.getMessage(), e);
        }
    }

    private void logRefundAudit(Refund refund, String action, Long userId, String details) {
        try {
            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
            AuditLog auditLog = AuditLog.builder()
                    .entityType("Refund")
                    .entityId(refund.getId())
                    .action(action)
                    .user(user)
                    .newValues(details)
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Failed to log refund audit: {}", e.getMessage());
        }
    }

    private void sendRefundNotification(Refund refund, String status) {
        // TODO: Implement email/SMS notification
        log.info("Sending refund notification for {} - status: {}", refund.getRefundCode(), status);
    }
}
