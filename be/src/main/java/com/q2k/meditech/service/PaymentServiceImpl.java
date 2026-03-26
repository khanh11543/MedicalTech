package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.receptionist.EndOfDayReportDTO;
import com.q2k.meditech.dto.receptionist.HourlyRevenueDTO;
import com.q2k.meditech.dto.receptionist.PendingPaymentDTO;
import com.q2k.meditech.dto.receptionist.SendPaymentLinkDTO;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.util.ExportUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.q2k.meditech.entity.enums.RefundMethod;
import com.q2k.meditech.entity.enums.RefundReason;
import com.q2k.meditech.entity.enums.RefundStatus;
import com.q2k.meditech.entity.enums.RefundType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Payment Service Implementation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentQrRepository paymentQrRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicationInventoryRepository medicationInventoryRepository;
    private final MedicationInventoryLogRepository medicationInventoryLogRepository;
    private final MedicationRepository medicationRepository;
    private final MomoClient momoClient;
    private final UserRepository userRepository;
    private final InvoiceService invoiceService;
    private final InvoiceDeliveryService invoiceDeliveryService;
    private final InvoiceRepository invoiceRepository;
    private final AuditLogRepository auditLogRepository;
    private final SecurityEventRepository securityEventRepository;
    private final RefundRepository refundRepository;
    private final PaymentStatusWebSocketService paymentStatusWebSocketService;
    private final NotificationEventService notificationEventService;
    private final EmailService emailService;
    private final SmsService smsService;
    private final PrivacyMaskingService privacyMaskingService;
    private final ObjectMapper objectMapper;
    private final PlatformTransactionManager transactionManager;

    // QR refresh rate limiting: paymentId -> list of refresh timestamps
    private static final int QR_REFRESH_MAX = 3;
    private static final long QR_REFRESH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    private static final java.util.Set<String> ALLOWED_PAYMENT_SORT_FIELDS = java.util.Set.of(
            "createdAt", "updatedAt", "status", "amount", "paidAt", "paymentMethod", "paymentDate", "id", "daysPending");
    private final ConcurrentHashMap<Long, java.util.Deque<Long>> qrRefreshTracker = new ConcurrentHashMap<>();

    @Override
    @Transactional
    public PaymentDTO createPayment(PaymentCreateDTO dto, Long currentUserId) {
        log.info("Creating payment for appointment ID: {}, method: {}", dto.getAppointmentId(), dto.getPaymentMethod());

        // Validate currentUserId is not null
        if (currentUserId == null) {
            throw new BadRequestException("Current user ID cannot be null. Please ensure you are logged in.");
        }

        // Validate appointmentId is not null
        if (dto.getAppointmentId() == null) {
            throw new BadRequestException("Appointment ID cannot be null");
        }

        // Check if appointment exists
        Appointment appointment = appointmentRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", dto.getAppointmentId()));

        // If payment already exists for this appointment, return it instead of failing
        Optional<Payment> existingPayment = paymentRepository.findByAppointmentIdWithDetails(dto.getAppointmentId());
        if (existingPayment.isPresent()) {
            log.info("Payment already exists for appointment {}, returning existing payment ID: {}",
                    dto.getAppointmentId(), existingPayment.get().getId());
            return mapToDTO(existingPayment.get());
        }

        // Get patient
        Patient patient = appointment.getPatient();

        // Get doctor for fee calculation
        Doctor doctor = appointment.getDoctor();
        BigDecimal consultationFee = doctor.getConsultationFee() != null
                ? doctor.getConsultationFee()
                : BigDecimal.ZERO;

        // Calculate amounts
        BigDecimal amount = consultationFee;
        BigDecimal discountAmount = dto.getDiscountAmount() != null
                ? dto.getDiscountAmount()
                : BigDecimal.ZERO;
        BigDecimal taxAmount = dto.getTaxAmount() != null
                ? dto.getTaxAmount()
                : BigDecimal.ZERO;
        BigDecimal totalAmount = amount.subtract(discountAmount).add(taxAmount);

        // Get current user (receptionist/admin)
        User processedBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Create payment
        Payment payment = Payment.builder()
                .paymentCode(generatePaymentCode())
                .appointment(appointment)
                .patient(patient)
                .amount(amount)
                .discountAmount(discountAmount)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .currency("VND")
                .paymentMethod(dto.getPaymentMethod())
                .paymentStatus("PENDING")
                .processedBy(processedBy)
                .notes(dto.getNotes())
                .build();

        payment = paymentRepository.save(payment);
        log.info("Payment created with ID: {}, code: {}", payment.getId(), payment.getPaymentCode());

        // Send notification: new pending payment
        try {
            notificationEventService.onNewPendingPayment(payment);
        } catch (Exception e) {
            log.warn("Failed to send new payment notification: {}", e.getMessage());
        }

        return mapToDTO(payment);
    }

    @Override
    @Transactional
    public PaymentDTO createPaymentForAppointment(Long appointmentId, Long processedByUserId) {
        log.info("Creating payment for appointment ID: {} (processedBy: {})", appointmentId, processedByUserId);
        if (appointmentId == null) {
            throw new BadRequestException("Appointment ID cannot be null");
        }
        Optional<Payment> existing = paymentRepository.findByAppointmentIdWithDetails(appointmentId);
        if (existing.isPresent()) {
            log.debug("Payment already exists for appointment {}, returning it", appointmentId);
            return mapToDTO(existing.get());
        }
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));
        Patient patient = appointment.getPatient();
        Doctor doctor = appointment.getDoctor();
        BigDecimal consultationFee = doctor.getConsultationFee() != null ? doctor.getConsultationFee() : BigDecimal.ZERO;
        BigDecimal totalAmount = consultationFee;
        User processedBy = processedByUserId != null
                ? userRepository.findById(processedByUserId).orElse(null)
                : null;
        Payment payment = Payment.builder()
                .paymentCode(generatePaymentCode())
                .appointment(appointment)
                .patient(patient)
                .amount(consultationFee)
                .discountAmount(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(totalAmount)
                .currency("VND")
                .paymentMethod(null)
                .paymentStatus("PENDING")
                .processedBy(processedBy)
                .notes(null)
                .build();
        payment = paymentRepository.save(payment);
        log.info("Payment created for appointment {} with ID: {}", appointmentId, payment.getId());
        try {
            notificationEventService.onNewPendingPayment(payment);
        } catch (Exception e) {
            log.warn("Failed to send new payment notification: {}", e.getMessage());
        }
        return mapToDTO(payment);
    }

    @Override
    @Transactional
    public PaymentDTO createPrescriptionPayment(PrescriptionPaymentCreateDTO dto, Long currentUserId) {
        log.info("Creating prescription payment for prescription ID: {}, method: {}", dto.getPrescriptionId(), dto.getPaymentMethod());

        if (currentUserId == null) {
            throw new BadRequestException("Current user ID cannot be null. Please ensure you are logged in.");
        }
        if (dto.getPrescriptionId() == null) {
            throw new BadRequestException("Prescription ID cannot be null");
        }

        // Load prescription with items
        Prescription prescription = prescriptionRepository.findByIdWithDetails(dto.getPrescriptionId())
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", dto.getPrescriptionId()));

        // Check prescription is active
        if (prescription.getStatus() != com.q2k.meditech.entity.enums.PrescriptionStatus.ACTIVE) {
            throw new BadRequestException("Prescription is not active. Current status: " + prescription.getStatus());
        }

        // Check no active payment already exists
        Optional<Payment> existingPayment = paymentRepository.findActivePrescriptionPayment(dto.getPrescriptionId());
        if (existingPayment.isPresent()) {
            Payment existing = existingPayment.get();
            if ("PAID".equals(existing.getPaymentStatus())) {
                throw new BadRequestException("Prescription is already paid");
            }
            log.info("Active payment already exists for prescription {}, returning existing payment ID: {}",
                    dto.getPrescriptionId(), existing.getId());
            return mapToDTO(existing);
        }

        // Calculate total from prescription items using medication unit prices
        BigDecimal totalMedicationCost = BigDecimal.ZERO;
        for (var item : prescription.getItems()) {
            BigDecimal itemPrice = item.getPrice();
            // If price not stored on item, look up from medication
            if (itemPrice == null && item.getMedicationId() != null) {
                itemPrice = medicationRepository.findById(item.getMedicationId())
                        .map(med -> med.getUnitPrice())
                        .orElse(BigDecimal.ZERO);
                // Snapshot the price on the item
                item.setPrice(itemPrice);
            }
            if (itemPrice != null && item.getQuantity() != null && item.getQuantity() > 0) {
                totalMedicationCost = totalMedicationCost.add(itemPrice.multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }

        // Update prescription totalCost
        prescription.setTotalCost(totalMedicationCost);
        prescription.setPrescriptionPaymentStatus("PENDING");
        prescriptionRepository.save(prescription);

        BigDecimal amount = totalMedicationCost;
        BigDecimal discountAmount = dto.getDiscountAmount() != null ? dto.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal taxAmount = dto.getTaxAmount() != null ? dto.getTaxAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount = amount.subtract(discountAmount).add(taxAmount);

        User processedBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        Payment payment = Payment.builder()
                .paymentCode(generatePaymentCode())
                .prescription(prescription)
                .appointment(prescription.getAppointment()) // link to appointment if available
                .patient(prescription.getPatient())
                .amount(amount)
                .discountAmount(discountAmount)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .currency("VND")
                .paymentMethod(dto.getPaymentMethod())
                .paymentStatus("PENDING")
                .referenceType("PRESCRIPTION")
                .processedBy(processedBy)
                .notes(dto.getNotes())
                .build();

        payment = paymentRepository.save(payment);
        log.info("Prescription payment created with ID: {}, code: {}, total: {}", payment.getId(), payment.getPaymentCode(), totalAmount);

        return mapToDTO(payment);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public PaymentInitDTO initMomoPayment(Long paymentId, MomoInitDTO dto, Long currentUserId) {
        return initMomoPaymentInternal(paymentId, dto, currentUserId, false);
    }

    /**
     * Internal method to initialize MoMo payment
     * @param isRefresh if true, generates a new unique orderId with timestamp suffix
     */
    private PaymentInitDTO initMomoPaymentInternal(Long paymentId, MomoInitDTO dto, Long currentUserId, boolean isRefresh) {
        log.info("Initializing MoMo payment for payment ID: {}, isRefresh: {}", paymentId, isRefresh);

        // Validate paymentId is not null
        if (paymentId == null) {
            throw new BadRequestException("Payment ID cannot be null");
        }

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Validate payment method — auto-switch to MOMO if needed
        if (!"MOMO".equals(payment.getPaymentMethod())) {
            log.info("Switching payment {} method from {} to MOMO", paymentId, payment.getPaymentMethod());
            payment.setPaymentMethod("MOMO");
            paymentRepository.save(payment);
        }

        // Validate payment status
        if ("PAID".equals(payment.getPaymentStatus()) || "CANCELLED".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Cannot initialize payment with status: " + payment.getPaymentStatus());
        }

        // Build order info (simple, no special characters)
        String orderInfo = dto.getOrderInfo() != null
                ? dto.getOrderInfo()
                : "Payment " + payment.getPaymentCode();

        // Generate MoMo order ID — always unique to prevent duplicate orderId error (MoMo error 41)
        String orderId = payment.getPaymentCode() + "-R" + System.currentTimeMillis();

        // Call MoMo API to create payment order
        MomoClient.MomoPaymentResponse momoResponse;
        try {
            momoResponse = momoClient.createPaymentOrder(
                    orderId,
                    payment.getTotalAmount().longValue(),
                    orderInfo,
                    ""
            );
        } catch (Exception e) {
            log.error("MoMo API call failed for payment {}: {}", paymentId, e.getMessage());
            throw new BadRequestException("Failed to create MoMo payment: " + e.getMessage());
        }
        
        String payUrl = momoResponse.payUrl;
        
        // Use MoMo's qrCodeUrl (direct payment QR data) instead of payUrl
        // When scanned with MoMo app, this triggers direct payment instead of gateway redirect
        String momoQrData = momoResponse.qrCodeUrl;
        String qrCodeUrl = generateQrCodeUrl(
                momoQrData != null && !momoQrData.isEmpty() ? momoQrData : payUrl
        );

        // Update payment status and store latest MoMo orderId for querying
        payment.setPaymentStatus("INITIATED");
        payment.setMomoOrderId(orderId);
        paymentRepository.save(payment);

        // Create or update PaymentQr with QR code image URL and payUrl
        createOrUpdatePaymentQr(payment, "MOMO", qrCodeUrl, payUrl);

        log.info("MoMo payment initialized for payment: {}", paymentId);

        return PaymentInitDTO.builder()
                .paymentId(payment.getId())
                .paymentCode(payment.getPaymentCode())
                .payUrl(payUrl)
                .qrCodeUrl(qrCodeUrl)
                .orderId(orderId)
                .message("Payment initialized successfully")
                .success(true)
                .build();
    }

    @Override
    public PaymentQrDTO getPaymentQr(Long paymentId, Long currentUserId) {
        log.info("Getting QR code for payment ID: {}", paymentId);

        // Validate paymentId is not null
        if (paymentId == null) {
            throw new BadRequestException("Payment ID cannot be null");
        }

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Validate payment method
        if (!"MOMO".equals(payment.getPaymentMethod())) {
            throw new BadRequestException("QR code is only available for MoMo payments");
        }

        // Check if payment is initiated
        if (!"INITIATED".equals(payment.getPaymentStatus()) && !"PROCESSING".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Payment must be initiated first. Current status: " + payment.getPaymentStatus());
        }

        // Get QR
        PaymentQr paymentQr = paymentQrRepository.findActiveByPaymentId(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("QR code not found for payment: " + paymentId));

        // Check if expired
        if (paymentQr.getExpiresAt().isBefore(LocalDateTime.now())) {
            paymentQr.setStatus("EXPIRED");
            paymentQrRepository.save(paymentQr);
            throw new BadRequestException("QR code has expired. Please refresh.");
        }

        return mapToQrDTO(paymentQr);
    }

    @Override
    @Transactional
    public PaymentInitDTO refreshQr(Long paymentId, Long currentUserId) {
        log.info("Refreshing QR for payment ID: {}", paymentId);

        // Rate limit: max 3 refreshes per 15 minutes per payment
        java.util.Deque<Long> timestamps = qrRefreshTracker.computeIfAbsent(paymentId, k -> new java.util.concurrent.ConcurrentLinkedDeque<>());
        long now = System.currentTimeMillis();
        // Remove expired entries
        while (!timestamps.isEmpty() && (now - timestamps.peekFirst()) > QR_REFRESH_WINDOW_MS) {
            timestamps.pollFirst();
        }
        if (timestamps.size() >= QR_REFRESH_MAX) {
            long oldestTs = timestamps.peekFirst();
            long waitSeconds = (QR_REFRESH_WINDOW_MS - (now - oldestTs)) / 1000;
            throw new BadRequestException(
                    String.format("QR refresh rate limit exceeded. Maximum %d refreshes per 15 minutes. Please wait %d seconds.",
                            QR_REFRESH_MAX, waitSeconds));
        }
        timestamps.addLast(now);

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Re-initialize payment with refresh flag to generate new orderId
        // createOrUpdatePaymentQr will update the existing QR record
        MomoInitDTO initDto = new MomoInitDTO();
        return initMomoPaymentInternal(paymentId, initDto, currentUserId, true);
    }

    // Continued in next part...

    @Override
    @Transactional
    public PaymentDTO markPaidCash(Long paymentId, MarkCashDTO dto, Long currentUserId) {
        log.info("Marking payment as paid with cash: {}", paymentId);

        // Validate paymentId is not null
        if (paymentId == null) {
            throw new BadRequestException("Payment ID cannot be null");
        }

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Auto-switch payment method to CASH if needed (e.g., user switched from MoMo to Cash)
        if (!"CASH".equals(payment.getPaymentMethod())) {
            log.info("Switching payment {} method from {} to CASH", paymentId, payment.getPaymentMethod());
            payment.setPaymentMethod("CASH");
            paymentRepository.save(payment);
        }

        // Validate status
        if ("PAID".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Payment is already paid");
        }

        if ("CANCELLED".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Cannot mark cancelled payment as paid");
        }

        // Validate amount received >= total amount due
        if (dto.getAmountReceived() != null) {
            if (dto.getAmountReceived().compareTo(payment.getTotalAmount()) < 0) {
                throw new BadRequestException("Amount received (" + dto.getAmountReceived() 
                        + ") must be >= total amount due (" + payment.getTotalAmount() + ")");
            }
            payment.setAmountReceived(dto.getAmountReceived());

            // Auto-calculate change if not provided
            BigDecimal change = dto.getChangeGiven() != null
                    ? dto.getChangeGiven()
                    : dto.getAmountReceived().subtract(payment.getTotalAmount());
            payment.setChangeGiven(change);
        } else {
            // If no amountReceived provided, assume exact amount
            payment.setAmountReceived(payment.getTotalAmount());
            payment.setChangeGiven(BigDecimal.ZERO);
        }

        // Update payment
        payment.setPaymentStatus("PAID");
        payment.setPaidAt(LocalDateTime.now());

        if (dto.getTransactionId() != null) {
            payment.setTransactionId(dto.getTransactionId());
        } else {
            payment.setTransactionId("CASH-" + payment.getPaymentCode());
        }

        if (dto.getNotes() != null) {
            payment.setNotes(payment.getNotes() != null
                    ? payment.getNotes() + " | " + dto.getNotes()
                    : dto.getNotes());
        }

        // Get current user
        User processedBy = userRepository.findById(currentUserId).orElse(null);
        payment.setProcessedBy(processedBy);

        payment = paymentRepository.save(payment);

        // Create invoice
        invoiceService.createInvoiceForPayment(payment.getId());

        // Auto-send invoice notification based on receipt options
        boolean shouldEmail = dto.getEmailReceipt() != null ? dto.getEmailReceipt() : true;
        if (shouldEmail) {
            invoiceDeliveryService.autoSendInvoiceOnPaymentSuccess(payment.getId());
        }

        // Audit log with cash handling details
        String auditDetails = String.format(
                "Cash payment completed. amount_due=%s, amount_received=%s, change=%s, cashier_id=%d, print=%s, email=%s, sms=%s",
                payment.getTotalAmount(), payment.getAmountReceived(), payment.getChangeGiven(),
                currentUserId,
                dto.getPrintReceipt() != null ? dto.getPrintReceipt() : true,
                shouldEmail,
                dto.getSmsReceipt() != null ? dto.getSmsReceipt() : false
        );
        logPaymentAudit(payment, "MARK_PAID_CASH", currentUserId, auditDetails);

        // Broadcast real-time update via WebSocket
        paymentStatusWebSocketService.broadcastPaymentStatusChange(
                payment.getId(), payment.getPaymentCode(), "PAID", "CASH");

        // If this is a prescription payment, deduct inventory and update prescription status
        deductInventoryIfPrescriptionPayment(payment);

        log.info("Payment marked as paid: {}", paymentId);
        return mapToDTO(payment);
    }

    @Override
    @Transactional
    public PaymentDTO cancelPayment(Long paymentId, CancelPaymentDTO dto, Long currentUserId) {
        log.info("Cancelling payment ID: {}", paymentId);

        // Validate paymentId is not null
        if (paymentId == null) {
            throw new BadRequestException("Payment ID cannot be null");
        }

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Validate status
        if ("PAID".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Cannot cancel paid payment. Use refund instead.");
        }

        if ("CANCELLED".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Payment is already cancelled");
        }

        // Update payment
        payment.setPaymentStatus("CANCELLED");
        payment.setNotes(payment.getNotes() != null
                ? payment.getNotes() + " | CANCELLED: " + dto.getReason()
                : "CANCELLED: " + dto.getReason());

        // Revoke QR if exists
        paymentQrRepository.findByPaymentId(paymentId).ifPresent(qr -> {
            qr.setStatus("REVOKED");
            qr.setRevokedAt(LocalDateTime.now());
            paymentQrRepository.save(qr);
        });

        payment = paymentRepository.save(payment);

        // Sync prescription payment status back so receptionist can retry
        syncPrescriptionPaymentStatus(payment, "CANCELLED");

        log.info("Payment cancelled: {}", paymentId);
        return mapToDTO(payment);
    }

    @Override
    public PaymentDTO handleMomoWebhook(MomoWebhookDTO webhookDto) {
        log.info("Handling MoMo webhook for orderId: {}, resultCode: {}",
                webhookDto.getOrderId(), webhookDto.getResultCode());

        // Find payment by order ID (payment code)
        // orderId may have -R{timestamp} suffix from QR refresh, so extract base payment code
        String orderId = webhookDto.getOrderId();
        String paymentCode = orderId.contains("-R") ? orderId.substring(0, orderId.indexOf("-R")) : orderId;
        
        Payment payment = paymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));

        // Idempotency: if already PAID, return current state (MoMo may send duplicate callbacks)
        if ("PAID".equals(payment.getPaymentStatus())) {
            log.info("Payment {} already PAID, ignoring duplicate webhook (idempotent)", payment.getId());
            return mapToDTO(payment);
        }

        // Idempotency: if already in terminal state (REFUNDED, CANCELLED), skip
        if ("REFUNDED".equals(payment.getPaymentStatus()) || "CANCELLED".equals(payment.getPaymentStatus())) {
            log.warn("Payment {} in terminal state {}, ignoring webhook", payment.getId(), payment.getPaymentStatus());
            return mapToDTO(payment);
        }

        // Handle result code
        if (webhookDto.getResultCode() == 0) {
            // Success - update payment status in separate transaction
            Payment finalPayment = updatePaymentStatusSuccess(payment.getId(), String.valueOf(webhookDto.getTransId()));

            // Create invoice (separate transaction, don't fail if error)
            try {
                invoiceService.createInvoiceForPayment(finalPayment.getId());
            } catch (Exception e) {
                log.error("Failed to create invoice for payment {}: {}", finalPayment.getId(), e.getMessage());
            }

            // Auto-send invoice notification (separate transaction, don't fail if error)
            try {
                invoiceDeliveryService.autoSendInvoiceOnPaymentSuccess(finalPayment.getId());
            } catch (Exception e) {
                log.error("Failed to send invoice notification for payment {}: {}", finalPayment.getId(), e.getMessage());
            }

            log.info("Payment successful: {}", finalPayment.getId());
            return mapToDTO(finalPayment);
        } else {
            // Failed - update payment status in separate transaction
            Payment failedPayment = updatePaymentStatusFailed(payment.getId(), webhookDto.getMessage());
            log.warn("Payment failed: {}, reason: {}", failedPayment.getId(), webhookDto.getMessage());
            return mapToDTO(failedPayment);
        }
    }

    @Override
    public PaymentDTO handleMockWebhook(WebhookMockDTO mockDto) {
        log.info("Handling mock webhook for payment ID: {}, resultCode: {}",
                mockDto.getPaymentId(), mockDto.getResultCode());

        Payment payment = paymentRepository.findByIdWithDetails(mockDto.getPaymentId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", mockDto.getPaymentId()));

        // Handle result code
        if (mockDto.getResultCode() == 0 || "success".equals(mockDto.getStatus())) {
            // Success - update payment status in separate transaction
            String transactionId = mockDto.getTransactionId() != null
                    ? mockDto.getTransactionId()
                    : "MOCK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            Payment finalPayment = updatePaymentStatusSuccess(payment.getId(), transactionId);

            // Create invoice (separate transaction, don't fail if error)
            try {
                invoiceService.createInvoiceForPayment(finalPayment.getId());
            } catch (Exception e) {
                log.error("Failed to create invoice for payment {}: {}", finalPayment.getId(), e.getMessage());
            }

            // Auto-send invoice notification (separate transaction, don't fail if error)
            try {
                invoiceDeliveryService.autoSendInvoiceOnPaymentSuccess(finalPayment.getId());
            } catch (Exception e) {
                log.error("Failed to send invoice notification for payment {}: {}", finalPayment.getId(), e.getMessage());
            }

            log.info("Mock payment successful: {}", finalPayment.getId());
            return mapToDTO(finalPayment);
        } else {
            // Failed - update payment status in separate transaction
            String status = "failed".equals(mockDto.getStatus()) ? "FAILED" : "CANCELLED";
            Payment failedPayment = updatePaymentStatusFailedWithStatus(payment.getId(), status, mockDto.getMessage());
            log.warn("Mock payment {}: {}, reason: {}", status.toLowerCase(), failedPayment.getId(), mockDto.getMessage());
            return mapToDTO(failedPayment);
        }
    }

    /**
     * Update payment status to PAID in separate transaction
     */
    @Transactional
    public Payment updatePaymentStatusSuccess(Long paymentId, String transactionId) {
        return updatePaymentStatusSuccess(paymentId, transactionId, null);
    }

    @Transactional
    public Payment updatePaymentStatusSuccess(Long paymentId, String transactionId, Long momoResponseTime) {
        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Idempotency: if already PAID, return as-is (prevents double invoice creation)
        if ("PAID".equals(payment.getPaymentStatus())) {
            log.info("Payment {} already PAID, skipping duplicate status update (idempotent)", paymentId);
            return payment;
        }

        payment.setPaymentStatus("PAID");
        // Use MoMo's actual payment time if available, otherwise use current time
        if (momoResponseTime != null && momoResponseTime > 0) {
            payment.setPaidAt(LocalDateTime.ofInstant(
                    java.time.Instant.ofEpochMilli(momoResponseTime),
                    java.time.ZoneId.systemDefault()));
        } else {
            payment.setPaidAt(LocalDateTime.now());
        }
        payment.setTransactionId(transactionId);
        Payment saved = paymentRepository.save(payment);

        // Broadcast real-time update via WebSocket
        paymentStatusWebSocketService.broadcastPaymentStatusChange(
                saved.getId(), saved.getPaymentCode(), "PAID", saved.getPaymentMethod());

        // If this is a prescription payment, deduct inventory and update prescription status
        deductInventoryIfPrescriptionPayment(saved);

        // Send notification: payment received (to receptionists/admins)
        try {
            notificationEventService.onMomoPaymentReceived(saved);
        } catch (Exception e) {
            log.warn("Failed to send payment success notification: {}", e.getMessage());
        }

        return saved;
    }

    /**
     * Update payment status to FAILED in separate transaction
     */
    @Transactional
    public Payment updatePaymentStatusFailed(Long paymentId, String message) {
        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        payment.setPaymentStatus("FAILED");
        payment.setNotes(payment.getNotes() != null
                ? payment.getNotes() + " | FAILED: " + message
                : "FAILED: " + message);
        Payment saved = paymentRepository.save(payment);

        // Sync prescription payment status
        syncPrescriptionPaymentStatus(saved, "FAILED");

        // Broadcast real-time update via WebSocket
        paymentStatusWebSocketService.broadcastPaymentStatusChange(
                saved.getId(), saved.getPaymentCode(), "FAILED", saved.getPaymentMethod());

        // Send notification: payment failed
        try {
            notificationEventService.onPaymentFailed(saved);
        } catch (Exception e) {
            log.warn("Failed to send payment failed notification: {}", e.getMessage());
        }

        return saved;
    }

    /**
     * Update payment status with custom status in separate transaction
     */
    @Transactional
    public Payment updatePaymentStatusFailedWithStatus(Long paymentId, String status, String message) {
        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        payment.setPaymentStatus(status);
        payment.setNotes(payment.getNotes() != null
                ? payment.getNotes() + " | " + status + ": " + message
                : status + ": " + message);
        Payment saved = paymentRepository.save(payment);

        // Sync prescription payment status for terminal states
        if ("FAILED".equals(status) || "CANCELLED".equals(status)) {
            syncPrescriptionPaymentStatus(saved, status);
        }

        return saved;
    }

    @Override
    public PaymentDTO getPaymentById(Long paymentId) {
        log.info("Getting payment by ID: {}", paymentId);

        // Validate paymentId is not null
        if (paymentId == null) {
            throw new BadRequestException("Payment ID cannot be null");
        }

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // If payment is INITIATED with MoMo, actively query MoMo for real-time status
        // This is essential because MoMo IPN webhook cannot reach localhost in dev
        if ("MOMO".equals(payment.getPaymentMethod()) 
                && ("INITIATED".equals(payment.getPaymentStatus()) || "PROCESSING".equals(payment.getPaymentStatus()))
                && payment.getMomoOrderId() != null) {
            try {
                MomoClient.MomoQueryResponse queryResult = momoClient.queryPaymentStatus(payment.getMomoOrderId());
                log.info("MoMo query for payment {}: resultCode={}, message={}", 
                        paymentId, queryResult.resultCode, queryResult.message);
                
                if (queryResult.resultCode != null && queryResult.resultCode == 0) {
                    // Payment successful — update status
                    String transId = queryResult.transId != null ? String.valueOf(queryResult.transId) : "MOMO-" + payment.getMomoOrderId();
                    payment = updatePaymentStatusSuccess(payment.getId(), transId, queryResult.responseTime);

                    // Create invoice & send notification (don't fail on error)
                    try {
                        invoiceService.createInvoiceForPayment(payment.getId());
                    } catch (Exception e) {
                        log.error("Failed to create invoice for payment {}: {}", payment.getId(), e.getMessage());
                    }
                    try {
                        invoiceDeliveryService.autoSendInvoiceOnPaymentSuccess(payment.getId());
                    } catch (Exception e) {
                        log.error("Failed to send invoice notification for payment {}: {}", payment.getId(), e.getMessage());
                    }
                    
                    // Re-fetch with details after update
                    payment = paymentRepository.findByIdWithDetails(paymentId)
                            .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
                } else if (queryResult.resultCode != null && queryResult.resultCode == 1006) {
                    // MoMo: User denied / cancelled the transaction
                    payment = updatePaymentStatusFailed(payment.getId(), queryResult.message);
                    payment = paymentRepository.findByIdWithDetails(paymentId)
                            .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
                }
                // Other resultCodes (1000=pending, etc.) → keep polling
            } catch (Exception e) {
                log.warn("MoMo query failed for payment {} (will retry on next poll): {}", paymentId, e.getMessage());
                // Don't fail the GET request — just return current DB status
            }
        }

        return mapToDTO(payment);
    }

    // ========== HELPER METHODS ==========

    private String generatePaymentCode() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = String.format("%04d%02d%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());
        int randomPart = (int) (Math.random() * 90000) + 10000;
        return "PAY-" + datePart + "-" + randomPart;
    }

    private String generateMockMomoPayUrl(String orderId, BigDecimal amount) {
        // Mock deep link for MoMo app
        return "https://test-payment.momo.vn/pay?orderId=" + orderId + "&amount=" + amount;
    }

    private String generateMockQrCode(String orderId, BigDecimal amount) {
        // ✅ IMPROVED: Generate QR with amount embedded in deep link
        // When scanned: MoMo app will automatically show the amount
        // User only needs to confirm payment, not manually enter amount
        
        // Create MoMo deep link with amount
        String deepLink = "momo://payment?orderId=" + orderId 
                        + "&amount=" + amount.longValue() 
                        + "&description=Payment%20for%20appointment";
        
        // Encode and generate QR code
        try {
            String encodedData = java.net.URLEncoder.encode(deepLink, java.nio.charset.StandardCharsets.UTF_8);
            return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodedData;
        } catch (Exception e) {
            log.error("Error encoding QR data", e);
            // Fallback: return simple QR
            return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + orderId;
        }
    }

    /**
     * Generate QR code image URL from MoMo payment data (qrCodeUrl or deeplink).
     * Uses QR Server API to create a scannable QR image.
     * When the encoded data is MoMo's qrCodeUrl, scanning with MoMo app
     * triggers direct payment instead of redirecting to the web gateway.
     */
    private String generateQrCodeUrl(String deeplink) {
        try {
            if (deeplink == null || deeplink.isEmpty()) {
                log.warn("Deeplink is empty, cannot generate QR code");
                return null;
            }

            // URL encode the deeplink
            String encodedData = java.net.URLEncoder.encode(deeplink, "UTF-8");

            // Return QR code image URL from QR Server API
            // Size 300x300 is good for display
            return "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" + encodedData;
        } catch (Exception e) {
            log.error("Error generating QR code URL from deeplink: {}", deeplink, e);
            return null;
        }
    }

    private void createOrUpdatePaymentQr(Payment payment, String provider, String qrPayload, String payUrl) {
        // Check for existing QR and update it, or create new
        PaymentQr paymentQr = paymentQrRepository.findByPaymentId(payment.getId())
                .map(existingQr -> {
                    // Update existing QR
                    existingQr.setProvider(provider);
                    existingQr.setQrPayload(qrPayload);
                    existingQr.setPayUrl(payUrl);
                    existingQr.setExpiresAt(LocalDateTime.now().plusMinutes(15));
                    existingQr.setStatus("ACTIVE");
                    existingQr.setRevokedAt(null); // Clear revoked timestamp
                    return existingQr;
                })
                .orElseGet(() -> {
                    // Create new QR
                    return PaymentQr.builder()
                            .payment(payment)
                            .provider(provider)
                            .qrPayload(qrPayload)
                            .payUrl(payUrl)
                            .expiresAt(LocalDateTime.now().plusMinutes(15))
                            .status("ACTIVE")
                            .build();
                });

        paymentQrRepository.save(paymentQr);
    }

    /**
     * Sync prescription's prescriptionPaymentStatus when a prescription payment changes state.
     * e.g. CANCELLED, FAILED, EXPIRED → prescription reverts so receptionist can retry.
     */
    private void syncPrescriptionPaymentStatus(Payment payment, String newStatus) {
        if (!"PRESCRIPTION".equals(payment.getReferenceType()) || payment.getPrescription() == null) {
            return;
        }
        prescriptionRepository.findById(payment.getPrescription().getId()).ifPresent(prescription -> {
            String oldStatus = prescription.getPrescriptionPaymentStatus();
            prescription.setPrescriptionPaymentStatus(newStatus);
            prescriptionRepository.save(prescription);
            log.info("Prescription {} payment status synced: {} → {}",
                    prescription.getPrescriptionCode(), oldStatus, newStatus);
        });
    }

    /**
     * Deduct medication inventory when a prescription payment is marked as PAID.
     * Also updates the prescription's prescriptionPaymentStatus to PAID.
     */
    private void deductInventoryIfPrescriptionPayment(Payment payment) {
        if (!"PRESCRIPTION".equals(payment.getReferenceType()) || payment.getPrescription() == null) {
            return;
        }

        Prescription prescription = prescriptionRepository.findByIdWithDetails(payment.getPrescription().getId())
                .orElse(null);
        if (prescription == null) return;

        // Update prescription payment status
        prescription.setPrescriptionPaymentStatus("PAID");
        prescriptionRepository.save(prescription);

        // Deduct inventory for each item
        for (var item : prescription.getItems()) {
            if (item.getMedicationId() != null && item.getQuantity() != null && item.getQuantity() > 0) {
                medicationInventoryRepository.findByMedicationId(item.getMedicationId()).ifPresent(inventory -> {
                    int before = inventory.getQuantity();
                    int after = Math.max(0, before - item.getQuantity());
                    inventory.setQuantity(after);
                    medicationInventoryRepository.save(inventory);

                    MedicationInventoryLog invLog = MedicationInventoryLog.builder()
                            .medication(inventory.getMedication())
                            .type("INVENTORY_DEDUCT_BY_PRESCRIPTION")
                            .quantityBefore(before)
                            .quantityAfter(after)
                            .delta(after - before)
                            .note("Prescription " + prescription.getPrescriptionCode() + " paid - Payment " + payment.getPaymentCode())
                            .referenceType("PRESCRIPTION")
                            .referenceId(prescription.getId())
                            .changedAt(LocalDateTime.now())
                            .build();
                    medicationInventoryLogRepository.save(invLog);
                    log.info("Deducted {} units from medication ID {} ({}→{}) on prescription payment",
                            item.getQuantity(), item.getMedicationId(), before, after);
                });
            }
        }
    }

    private PaymentDTO mapToDTO(Payment payment) {
        PaymentDTO.PaymentDTOBuilder dtoBuilder = PaymentDTO.builder()
                .id(payment.getId())
                .paymentCode(payment.getPaymentCode())
                .patientId(payment.getPatient().getId())
                .patientName(payment.getPatient().getUser().getFullName())
                .amount(payment.getAmount())
                .discountAmount(payment.getDiscountAmount())
                .taxAmount(payment.getTaxAmount())
                .totalAmount(payment.getTotalAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .transactionId(payment.getTransactionId())
                .paidAt(payment.getPaidAt())
                .refundedAt(payment.getRefundedAt())
                .refundAmount(payment.getRefundAmount())
                .refundReason(payment.getRefundReason())
                .amountReceived(payment.getAmountReceived())
                .changeGiven(payment.getChangeGiven())
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .referenceType(payment.getReferenceType() != null ? payment.getReferenceType() : "APPOINTMENT");

        // Appointment info (may be null for prescription-only payments)
        if (payment.getAppointment() != null) {
            dtoBuilder.appointmentId(payment.getAppointment().getId())
                    .appointmentCode(payment.getAppointment().getAppointmentCode() != null
                            ? payment.getAppointment().getAppointmentCode()
                            : "APT-" + payment.getAppointment().getId());
            if (payment.getAppointment().getDoctor() != null) {
                dtoBuilder.doctorName(payment.getAppointment().getDoctor().getUser() != null
                        ? payment.getAppointment().getDoctor().getUser().getFullName() : null);
                dtoBuilder.doctorSpecialty(payment.getAppointment().getDoctor().getSpecialization());
            }
            dtoBuilder.appointmentDate(payment.getAppointment().getAppointmentDate());
            dtoBuilder.appointmentStatus(payment.getAppointment().getStatus() != null
                    ? payment.getAppointment().getStatus().name() : null);
        }

        // Prescription info
        if (payment.getPrescription() != null) {
            dtoBuilder.prescriptionId(payment.getPrescription().getId())
                    .prescriptionCode(payment.getPrescription().getPrescriptionCode());
        }

        PaymentDTO dto = dtoBuilder.build();

        if (payment.getProcessedBy() != null) {
            dto.setProcessedBy(payment.getProcessedBy().getId());
            dto.setProcessedByName(payment.getProcessedBy().getEmail());
        }

        // Add QR info if exists
        paymentQrRepository.findActiveByPaymentId(payment.getId())
                .ifPresent(qr -> dto.setQrInfo(mapToQrDTO(qr)));

        return dto;
    }

    private PaymentQrDTO mapToQrDTO(PaymentQr paymentQr) {
        return PaymentQrDTO.builder()
                .id(paymentQr.getId())
                .paymentId(paymentQr.getPayment().getId())
                .provider(paymentQr.getProvider())
                .qrPayload(paymentQr.getQrPayload())
                .payUrl(paymentQr.getPayUrl())
                .expiresAt(paymentQr.getExpiresAt())
                .status(paymentQr.getStatus())
                .createdAt(paymentQr.getCreatedAt())
                .build();
    }

    // ========== PATIENT METHODS ==========

    @Override
    @Transactional
    public org.springframework.data.domain.Page<PaymentDTO> getMyPayments(
            Long patientId,
            String status,
            String method,
            String from,
            String to,
            int pageNumber,
            int pageSize) {

        log.info("Getting payments for patient ID: {}, status: {}, method: {}", patientId, status, method);

        // Sync pending MoMo payments with MoMo API before returning results
        syncPendingMomoPayments(patientId);

        // Parse dates if provided
        LocalDateTime fromDate = null;
        LocalDateTime toDate = null;

        if (from != null && !from.isBlank()) {
            try {
                fromDate = LocalDate.parse(from).atStartOfDay();
            } catch (Exception e) {
                log.warn("Invalid from date: {}", from);
            }
        }

        if (to != null && !to.isBlank()) {
            try {
                toDate = LocalDate.parse(to).atTime(23, 59, 59);
            } catch (Exception e) {
                log.warn("Invalid to date: {}", to);
            }
        }

        // Create pageable
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(pageNumber, pageSize);

        // Translate special tab status values into actual filters
        java.util.List<String> paymentStatuses;
        com.q2k.meditech.entity.enums.AppointmentStatus appointmentStatus = null;
        java.util.List<com.q2k.meditech.entity.enums.AppointmentStatus> excludeAppointmentStatuses = null;

        if ("UNPAID".equals(status)) {
            // Unpaid tab: PENDING, INITIATED, FAILED — show for any appointment status (pre-payment flow)
            paymentStatuses = java.util.List.of("PENDING", "INITIATED", "FAILED");
            // No appointment status filter — allow payment before exam
            excludeAppointmentStatuses = java.util.List.of(
                    com.q2k.meditech.entity.enums.AppointmentStatus.CANCELLED
            );
        } else if ("COMPLETED".equals(status)) {
            // Completed tab: payment PAID (any appointment status)
            paymentStatuses = java.util.List.of("PAID");
        } else if (status != null && !status.isBlank()) {
            // Direct status filter (e.g. PAID, CANCELLED)
            paymentStatuses = java.util.List.of(status);
        } else {
            paymentStatuses = null; // no filter
        }

        // Query with advanced filters
        org.springframework.data.domain.Page<Payment> payments =
                paymentRepository.findByPatientIdWithAdvancedFilters(
                        patientId, paymentStatuses, appointmentStatus, excludeAppointmentStatuses,
                        method, fromDate, toDate, pageable);

        // Map to DTOs
        return payments.map(this::mapToDTO);
    }

    /**
     * Sync pending MoMo payments for a patient by querying MoMo API.
     * This handles the case where patient paid from email QR and MoMo webhook couldn't reach the server.
     */
    private void syncPendingMomoPayments(Long patientId) {
        try {
            List<Payment> pendingMomoPayments = paymentRepository.findByPatientIdAndPaymentMethodAndPaymentStatusIn(
                    patientId, "MOMO", java.util.List.of("INITIATED", "PROCESSING"));

            // Limit to 5 queries to avoid slow response
            int limit = Math.min(pendingMomoPayments.size(), 5);
            for (int i = 0; i < limit; i++) {
                Payment p = pendingMomoPayments.get(i);
                if (p.getMomoOrderId() == null) continue;
                try {
                    MomoClient.MomoQueryResponse queryResult = momoClient.queryPaymentStatus(p.getMomoOrderId());
                    if (queryResult.resultCode != null && queryResult.resultCode == 0) {
                        String transId = queryResult.transId != null
                                ? String.valueOf(queryResult.transId)
                                : "MOMO-" + p.getMomoOrderId();
                        updatePaymentStatusSuccess(p.getId(), transId, queryResult.responseTime);
                        try {
                            invoiceService.createInvoiceForPayment(p.getId());
                        } catch (Exception e) {
                            log.error("Failed to create invoice for synced payment {}: {}", p.getId(), e.getMessage());
                        }
                        try {
                            invoiceDeliveryService.autoSendInvoiceOnPaymentSuccess(p.getId());
                        } catch (Exception e) {
                            log.error("Failed to send invoice for synced payment {}: {}", p.getId(), e.getMessage());
                        }
                        log.info("Synced MoMo payment {} → PAID", p.getId());
                    } else if (queryResult.resultCode != null && queryResult.resultCode == 1006) {
                        updatePaymentStatusFailed(p.getId(), queryResult.message);
                        log.info("Synced MoMo payment {} → FAILED (user denied)", p.getId());
                    }
                } catch (Exception e) {
                    log.warn("MoMo sync failed for payment {}: {}", p.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to sync pending MoMo payments for patient {}: {}", patientId, e.getMessage());
        }
    }

    @Override
    @Transactional
    public PaymentDTO getPaymentByIdForPatient(Long paymentId, Long patientId) {
        log.info("Getting payment ID: {} for patient ID: {}", paymentId, patientId);

        // Validate parameters
        if (paymentId == null) {
            throw new BadRequestException("Payment ID cannot be null");
        }
        if (patientId == null) {
            throw new BadRequestException("Patient ID cannot be null");
        }

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Check ownership
        if (!payment.getPatient().getId().equals(patientId)) {
            throw new BadRequestException("You can only view your own payments");
        }

        // If payment is INITIATED/PROCESSING with MoMo, actively query MoMo for real-time status
        // This is essential because MoMo IPN webhook cannot reach localhost in dev
        if ("MOMO".equals(payment.getPaymentMethod())
                && ("INITIATED".equals(payment.getPaymentStatus()) || "PROCESSING".equals(payment.getPaymentStatus()))
                && payment.getMomoOrderId() != null) {
            try {
                MomoClient.MomoQueryResponse queryResult = momoClient.queryPaymentStatus(payment.getMomoOrderId());
                log.info("MoMo query for patient payment {}: resultCode={}, message={}",
                        paymentId, queryResult.resultCode, queryResult.message);

                if (queryResult.resultCode != null && queryResult.resultCode == 0) {
                    // Payment successful — update status
                    String transId = queryResult.transId != null ? String.valueOf(queryResult.transId) : "MOMO-" + payment.getMomoOrderId();
                    payment = updatePaymentStatusSuccess(payment.getId(), transId, queryResult.responseTime);

                    // Create invoice & send notification (don't fail on error)
                    try {
                        invoiceService.createInvoiceForPayment(payment.getId());
                    } catch (Exception e) {
                        log.error("Failed to create invoice for payment {}: {}", payment.getId(), e.getMessage());
                    }
                    try {
                        invoiceDeliveryService.autoSendInvoiceOnPaymentSuccess(payment.getId());
                    } catch (Exception e) {
                        log.error("Failed to send invoice notification for payment {}: {}", payment.getId(), e.getMessage());
                    }

                    // Re-fetch with details after update
                    payment = paymentRepository.findByIdWithDetails(paymentId)
                            .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
                } else if (queryResult.resultCode != null && queryResult.resultCode == 1006) {
                    // MoMo: User denied / cancelled the transaction
                    payment = updatePaymentStatusFailed(payment.getId(), queryResult.message);
                    payment = paymentRepository.findByIdWithDetails(paymentId)
                            .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
                }
                // Other resultCodes (1000=pending, etc.) → keep polling
            } catch (Exception e) {
                log.warn("MoMo query failed for patient payment {} (will retry on next poll): {}", paymentId, e.getMessage());
                // Don't fail the GET request — just return current DB status
            }
        }

        return mapToDTO(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentQrDTO getPaymentQrForPatient(Long paymentId, Long patientId) {
        log.info("Getting QR for payment ID: {} for patient ID: {}", paymentId, patientId);

        // Validate parameters
        if (paymentId == null) {
            throw new BadRequestException("Payment ID cannot be null");
        }
        if (patientId == null) {
            throw new BadRequestException("Patient ID cannot be null");
        }

        // Check payment exists and belongs to patient
        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Check ownership
        if (!payment.getPatient().getId().equals(patientId)) {
            throw new BadRequestException("You can only view your own payments");
        }

        // Check payment method is MoMo
        if (!"MOMO".equals(payment.getPaymentMethod())) {
            throw new BadRequestException("QR code is only available for MoMo payments");
        }

        // Get active QR code
        PaymentQr qr = paymentQrRepository.findActiveByPaymentId(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("No active QR code found for payment: " + paymentId));

        return mapToQrDTO(qr);
    }

    @Override
    @Transactional
    public PaymentInitDTO initMomoPaymentForPatient(Long paymentId, Long patientId) {
        log.info("Patient {} initiating MoMo payment for payment ID: {}", patientId, paymentId);

        if (paymentId == null) throw new BadRequestException("Payment ID cannot be null");
        if (patientId == null) throw new BadRequestException("Patient ID cannot be null");

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        if (!payment.getPatient().getId().equals(patientId)) {
            throw new BadRequestException("You can only pay for your own payments");
        }

        Long userId = payment.getPatient().getUser().getId();
        return initMomoPaymentInternal(paymentId, new MomoInitDTO(), userId, false);
    }

    @Override
    @Transactional
    public PaymentDTO cancelPaymentForPatient(Long paymentId, Long patientId, String reason) {
        log.info("Patient {} cancelling payment ID: {}", patientId, paymentId);

        if (paymentId == null) throw new BadRequestException("Payment ID cannot be null");
        if (patientId == null) throw new BadRequestException("Patient ID cannot be null");

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        if (!payment.getPatient().getId().equals(patientId)) {
            throw new BadRequestException("You can only cancel your own payments");
        }

        if (!"PENDING".equals(payment.getPaymentStatus()) && !"INITIATED".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Can only cancel PENDING or INITIATED payments, current status: " + payment.getPaymentStatus());
        }

        CancelPaymentDTO dto = CancelPaymentDTO.builder()
                .reason(reason != null ? reason : "Cancelled by patient")
                .build();

        Long userId = payment.getPatient().getUser().getId();
        return cancelPayment(paymentId, dto, userId);
    }

    // ========== ADMIN METHODS ==========

    @Override
    public org.springframework.data.domain.Page<PaymentDTO> getAllPayments(
            String status,
            String method,
            String from,
            String to,
            Long patientId,
            Long appointmentId,
            int pageNumber,
            int pageSize) {

        log.info("Admin getting all payments - status: {}, method: {}, patientId: {}, appointmentId: {}",
                status, method, patientId, appointmentId);

        // Parse dates if provided
        LocalDateTime fromDate = null;
        LocalDateTime toDate = null;

        if (from != null && !from.isBlank()) {
            try {
                fromDate = LocalDate.parse(from).atStartOfDay();
            } catch (Exception e) {
                log.warn("Invalid from date: {}", from);
            }
        }

        if (to != null && !to.isBlank()) {
            try {
                toDate = LocalDate.parse(to).atTime(23, 59, 59);
            } catch (Exception e) {
                log.warn("Invalid to date: {}", to);
            }
        }

        // Create pageable
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(pageNumber, pageSize);

        // Query with filters
        org.springframework.data.domain.Page<Payment> payments =
                paymentRepository.findAllWithFilters(
                        status, method, patientId, appointmentId, fromDate, toDate, pageable);

        // Map to DTOs
        return payments.map(this::mapToDTO);
    }

    @Override
    @Transactional
    public PaymentDTO refundPayment(Long paymentId, RefundDTO dto, Long currentUserId) {
        log.info("Processing refund for payment ID: {}, amount: {}", paymentId, dto.getRefundAmount());

        // Get request info for audit
        String ipAddress = "unknown";
        String userAgent = "unknown";
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                ipAddress = request.getRemoteAddr();
                userAgent = request.getHeader("User-Agent");
            }
        } catch (Exception e) {
            log.warn("Could not get request info for audit: {}", e.getMessage());
        }

        // Get payment
        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        String currentStatus = payment.getPaymentStatus();

        // Idempotency check - if already fully refunded, return current state
        if ("REFUNDED".equals(currentStatus)) {
            log.info("Payment {} already fully refunded, returning current state (idempotent)", paymentId);
            return mapToDTO(payment);
        }

        // Validate payment status - can only refund PAID or PARTIALLY_REFUNDED
        if (!"PAID".equals(currentStatus) && !"PARTIALLY_REFUNDED".equals(currentStatus)) {
            throw new BadRequestException("Can only refund PAID or PARTIALLY_REFUNDED payments. Current status: " + currentStatus);
        }

        // Calculate already refunded amount
        BigDecimal alreadyRefunded = payment.getRefundAmount() != null ? payment.getRefundAmount() : BigDecimal.ZERO;
        BigDecimal remainingRefundable = payment.getTotalAmount().subtract(alreadyRefunded);

        // Determine refund amount
        BigDecimal refundAmount = dto.getRefundAmount();
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            // Null or zero means full refund (refund remaining)
            refundAmount = remainingRefundable;
            log.info("Refund amount not specified, performing full refund of remaining: {}", refundAmount);
        }

        // Validate refund amount doesn't exceed remaining
        if (refundAmount.compareTo(remainingRefundable) > 0) {
            throw new BadRequestException(String.format(
                    "Refund amount %.2f exceeds remaining refundable amount %.2f (total: %.2f, already refunded: %.2f)",
                    refundAmount, remainingRefundable, payment.getTotalAmount(), alreadyRefunded));
        }

        // Calculate new total refunded
        BigDecimal newTotalRefunded = alreadyRefunded.add(refundAmount);
        boolean isFullRefund = newTotalRefunded.compareTo(payment.getTotalAmount()) >= 0;
        String newStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

        log.info("Payment {}: refunding {} (total refunded will be: {}, status: {})",
                paymentId, refundAmount, newTotalRefunded, newStatus);

        // Process refund based on payment method
        String momoRefundTransId = null;
        if ("CASH".equals(payment.getPaymentMethod())) {
            // Cash refund - just update records
            log.info("Processing cash refund for payment: {}", paymentId);

        } else if ("MOMO".equals(payment.getPaymentMethod())) {
            // MoMo refund - call MoMo API
            log.info("Processing MoMo refund for payment: {}", paymentId);

            // Call MoMo refund API
            momoRefundTransId = processMomoRefund(payment, dto);
        }

        // Update payment record
        payment.setRefundAmount(newTotalRefunded);
        payment.setRefundReason(dto.getRefundReason());
        payment.setRefundedAt(LocalDateTime.now());
        payment.setPaymentStatus(newStatus);

        // Add MoMo transaction ID if applicable
        if (momoRefundTransId != null) {
            payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "")
                    + "MoMo Refund TxnID: " + momoRefundTransId + " (Amount: " + refundAmount + ")");
        } else if ("MOMO".equals(payment.getPaymentMethod())) {
            payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "")
                    + "MoMo refund API failed - manual refund may be required (Amount: " + refundAmount + ")");
        }

        // Add notes
        if (dto.getNotes() != null && !dto.getNotes().isBlank()) {
            payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "")
                    + "Refund Notes: " + dto.getNotes());
        }

        // Update processed by
        User adminUser = userRepository.findById(currentUserId).orElse(null);
        if (adminUser != null) {
            payment.setProcessedBy(adminUser);
        }

        payment.setUpdatedAt(LocalDateTime.now());

        // === STEP 1: Save payment status update FIRST ===
        Payment saved = paymentRepository.saveAndFlush(payment);
        log.info("Updated payment {} status to {}", paymentId, newStatus);

        // === STEP 2: Create & save Refund record for Refund Management tab ===
        RefundMethod refMethod = resolveRefundMethod(payment.getPaymentMethod());
        RefundReason refReasonType = resolveRefundReason(dto.getRefundReason());
        String refundCode = generateRefundCode();

        log.info("Saving refund record: code={}, paymentId={}, amount={}, originalAmount={}, status=COMPLETED, reason={}, method={}, adminUserId={}",
                refundCode, paymentId, refundAmount, payment.getTotalAmount(),
                dto.getRefundReason() != null ? dto.getRefundReason() : "Auto refund",
                refMethod, adminUser != null ? adminUser.getId() : "null");

        // Save refund in the SAME transaction as the payment update
        String finalRefundReason = dto.getRefundReason() != null ? dto.getRefundReason() : "Auto refund";
        Refund newRefund = Refund.builder()
                .refundCode(refundCode)
                .payment(saved)
                .refundAmount(refundAmount)
                .originalAmount(payment.getTotalAmount())
                .currency(payment.getCurrency() != null ? payment.getCurrency() : "VND")
                .status(RefundStatus.COMPLETED)
                .refundReason(finalRefundReason)
                .refundReasonType(refReasonType)
                .refundMethod(refMethod)
                .refundType(RefundType.AUTO)
                .requestedDate(LocalDateTime.now())
                .requestedBy(adminUser)
                .approvedDate(LocalDateTime.now())
                .approvedBy(adminUser)
                .processedDate(LocalDateTime.now())
                .processedBy(adminUser)
                .transactionReference(momoRefundTransId)
                .notes(dto.getNotes())
                .retryCount(0)
                .maxRetries(3)
                .build();
        Refund savedRefund = refundRepository.saveAndFlush(newRefund);
        log.info("Successfully saved refund record {} (DB id={}) for payment {}",
                refundCode, savedRefund.getId(), paymentId);

        // === STEP 3: Update associated invoice status (non-critical) ===
        try {
            Invoice invoice = invoiceRepository.findByPaymentIdWithDetails(paymentId).orElse(null);
            if (invoice != null) {
                invoice.setStatus(isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED");
                invoiceRepository.save(invoice);
                log.info("Updated invoice {} status to {}", invoice.getId(), invoice.getStatus());
            }
        } catch (Exception e) {
            log.warn("Could not update invoice status: {}", e.getMessage());
        }

        // === STEP 4: Create audit log (non-critical) ===
        try {
            Map<String, Object> details = new HashMap<>();
            details.put("paymentId", paymentId);
            details.put("refundAmount", refundAmount);
            details.put("totalRefunded", newTotalRefunded);
            details.put("previousStatus", currentStatus);
            details.put("newStatus", newStatus);
            details.put("refundReason", dto.getRefundReason());
            details.put("paymentMethod", payment.getPaymentMethod());
            if (momoRefundTransId != null) {
                details.put("momoRefundTransId", momoRefundTransId);
            }

            String newValuesJson = null;
            try {
                newValuesJson = objectMapper.writeValueAsString(details);
            } catch (JsonProcessingException e) {
                log.warn("Could not serialize audit newValues: {}", e.getMessage());
            }
            AuditLog auditLog = AuditLog.builder()
                    .action("PAYMENT_REFUND")
                    .entityType("Payment")
                    .entityId(paymentId)
                    .user(adminUser)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .newValues(newValuesJson)
                    .createdAt(LocalDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
            log.info("Created audit log for refund: {}", auditLog.getId());
        } catch (Exception e) {
            log.warn("Could not create audit log: {}", e.getMessage());
        }

        // === STEP 5: Create security event (non-critical) ===
        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("paymentId", paymentId);
            metadata.put("refundAmount", refundAmount.toString());
            metadata.put("paymentMethod", payment.getPaymentMethod());
            metadata.put("newStatus", newStatus);

            // Serialize metadata to JSON string to avoid Hibernate type cast issues
            String metadataJson = null;
            try {
                metadataJson = objectMapper.writeValueAsString(metadata);
            } catch (JsonProcessingException e) {
                log.warn("Could not serialize security event metadata: {}", e.getMessage());
            }

            SecurityEvent securityEvent = SecurityEvent.builder()
                    .eventType(com.q2k.meditech.entity.enums.SecurityEventType.UNUSUAL_DATA_ACCESS)
                    .severity(com.q2k.meditech.entity.enums.SecuritySeverity.MEDIUM)
                    .description("Payment refund processed - PaymentID: " + paymentId)
                    .user(adminUser)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .metadata(metadataJson)
                    .createdAt(LocalDateTime.now())
                    .build();
            securityEventRepository.save(securityEvent);
            log.info("Created security event for refund: {}", securityEvent.getId());
        } catch (Exception e) {
            log.warn("Could not create security event: {}", e.getMessage());
        }

        // === STEP 6: Auto-send refund notification (non-critical) ===
        try {
            invoiceDeliveryService.autoSendRefundNotification(saved.getId());
        } catch (Exception e) {
            log.warn("Could not send refund notification for payment {}: {}", paymentId, e.getMessage());
        }

        log.info("Refund processed successfully for payment: {} (amount: {}, newStatus: {}, refundCode: {})",
                paymentId, refundAmount, newStatus, refundCode);
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public PaymentDTO adminCancelPayment(Long paymentId, CancelPaymentDTO dto, Long currentUserId) {
        log.info("Admin cancelling payment ID: {}", paymentId);

        // Validate paymentId is not null
        if (paymentId == null) {
            throw new BadRequestException("Payment ID cannot be null");
        }

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Admin can cancel PENDING, INITIATED, or EXPIRED payments
        if (!payment.getPaymentStatus().matches("PENDING|INITIATED|EXPIRED|PROCESSING")) {
            throw new BadRequestException("Cannot cancel payment with status: " + payment.getPaymentStatus());
        }

        // Update status
        payment.setPaymentStatus("CANCELLED");
        StringBuilder cancelNotes = new StringBuilder();
        if (payment.getNotes() != null) {
            cancelNotes.append(payment.getNotes()).append("\n");
        }
        cancelNotes.append("Admin Cancel Reason: ").append(dto.getReason() != null ? dto.getReason() : "N/A");
        if (dto.getNotes() != null && !dto.getNotes().isBlank()) {
            cancelNotes.append("\nAdmin Notes: ").append(dto.getNotes());
        }
        payment.setNotes(cancelNotes.toString());

        // Revoke active QR codes
        paymentQrRepository.findActiveByPaymentId(paymentId)
                .ifPresent(qr -> {
                    qr.setStatus("REVOKED");
                    paymentQrRepository.save(qr);
                });

        // Update processed by
        userRepository.findById(currentUserId).ifPresent(payment::setProcessedBy);

        payment.setUpdatedAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);

        // Sync prescription payment status back so receptionist can retry
        syncPrescriptionPaymentStatus(saved, "CANCELLED");

        log.info("Payment cancelled by admin: {}", paymentId);
        return mapToDTO(saved);
    }

    @Override
    @Transactional
    public ExpirePaymentsResultDTO expirePayments(ExpirePaymentsDTO dto) {
        log.info("Running expire payments job - expiryMinutes: {}, dryRun: {}",
                dto.getExpiryMinutes(), dto.getDryRun());

        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(dto.getExpiryMinutes());

        ExpirePaymentsResultDTO result = ExpirePaymentsResultDTO.builder()
                .executedAt(LocalDateTime.now())
                .dryRun(dto.getDryRun())
                .build();

        // Find payments to expire
        List<Payment> paymentsToExpire;
        if (dto.getTargetStatus() != null) {
            paymentsToExpire = paymentRepository.findByStatusAndCreatedBefore(dto.getTargetStatus(), cutoffTime);
        } else {
            paymentsToExpire = paymentRepository.findPaymentsToExpire(cutoffTime);
        }

        result.setExpiredCount(paymentsToExpire.size());
        result.setExpiredPaymentIds(paymentsToExpire.stream()
                .map(Payment::getId)
                .collect(java.util.stream.Collectors.toList()));

        if (!Boolean.TRUE.equals(dto.getDryRun())) {
            // Actually expire payments
            for (Payment payment : paymentsToExpire) {
                payment.setPaymentStatus("EXPIRED");
                payment.setUpdatedAt(LocalDateTime.now());
                payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "")
                        + "Auto-expired after " + dto.getExpiryMinutes() + " minutes");
                paymentRepository.save(payment);

                // Sync prescription payment status so receptionist can retry
                syncPrescriptionPaymentStatus(payment, "EXPIRED");
            }

            // Expire QR codes
            List<PaymentQr> qrsToExpire = paymentQrRepository.findExpiredQrs(LocalDateTime.now());
            result.setQrExpiredCount(qrsToExpire.size());
            result.setExpiredQrIds(qrsToExpire.stream()
                    .map(PaymentQr::getId)
                    .collect(java.util.stream.Collectors.toList()));

            for (PaymentQr qr : qrsToExpire) {
                qr.setStatus("EXPIRED");
                paymentQrRepository.save(qr);
            }

            result.setMessage(String.format("Expired %d payments and %d QR codes",
                    result.getExpiredCount(), result.getQrExpiredCount()));
        } else {
            result.setMessage(String.format("Dry run: Would expire %d payments", result.getExpiredCount()));
        }

        log.info("Expire payments job completed: {}", result.getMessage());
        return result;
    }

    @Override
    @Transactional
    public PaymentDTO reconcileMomoStatus(Long paymentId, Long currentUserId) {
        log.info("Reconciling MoMo status for payment ID: {}", paymentId);

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Validate payment method
        if (!"MOMO".equals(payment.getPaymentMethod())) {
            throw new BadRequestException("Can only reconcile MoMo payments");
        }

        // TODO: Call actual MoMo query API to get current status
        // For now, mock the reconciliation
        String currentStatus = queryMomoPaymentStatus(payment);

        log.info("MoMo reconciliation result for payment {}: status = {}", paymentId, currentStatus);

        // Update payment status based on MoMo response
        if ("SUCCESS".equals(currentStatus) && !"PAID".equals(payment.getPaymentStatus())) {
            payment.setPaymentStatus("PAID");
            payment.setPaidAt(LocalDateTime.now());
            payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "")
                    + "Status reconciled via MoMo API query");

            // Save payment first
            Payment savedPayment = paymentRepository.save(payment);

            // Create invoice if paid
            try {
                invoiceService.createInvoiceForPayment(savedPayment.getId());
                // Auto-send invoice notification via email/SMS
                invoiceDeliveryService.autoSendInvoiceOnPaymentSuccess(savedPayment.getId());
            } catch (Exception e) {
                log.error("Failed to create/send invoice after reconciliation", e);
            }

            payment = savedPayment;

        } else if ("FAILED".equals(currentStatus)) {
            payment.setPaymentStatus("FAILED");
            payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "")
                    + "Status reconciled via MoMo API query: FAILED");
        }

        payment.setUpdatedAt(LocalDateTime.now());
        Payment saved = paymentRepository.save(payment);

        log.info("MoMo reconciliation completed for payment: {}", paymentId);
        return mapToDTO(saved);
    }

    // ========== HELPER METHODS FOR ADMIN ==========

    /**
     * Process MoMo refund (mock implementation)
     */
    private String processMomoRefund(Payment payment, RefundDTO dto) {
        log.info("Processing MoMo refund: payment={}, amount={}, transactionId={}",
                payment.getId(), dto.getRefundAmount(), payment.getTransactionId());

        // Determine the orderId to use for querying original transaction
        String orderId = payment.getMomoOrderId() != null
                ? payment.getMomoOrderId() : payment.getPaymentCode();

        // Parse transId from stored transactionId
        Long transId = null;
        if (payment.getTransactionId() != null && !payment.getTransactionId().isBlank()) {
            try {
                transId = Long.parseLong(payment.getTransactionId());
            } catch (NumberFormatException e) {
                log.warn("Could not parse transactionId '{}' as Long, querying MoMo for transId",
                        payment.getTransactionId());
            }
        }

        // If transId not available, query MoMo to get it
        if (transId == null) {
            try {
                MomoClient.MomoQueryResponse queryResult = momoClient.queryPaymentStatus(orderId);
                if (queryResult.resultCode == 0 && queryResult.transId != null) {
                    transId = queryResult.transId;
                    log.info("Got transId {} from MoMo query for orderId {}", transId, orderId);
                } else {
                    log.error("Cannot get transId from MoMo query for orderId {}: resultCode={}",
                            orderId, queryResult.resultCode);
                    return null; // Cannot refund via MoMo, but still update DB
                }
            } catch (Exception e) {
                log.error("Failed to query MoMo for transId: {}", e.getMessage());
                return null;
            }
        }

        // Call MoMo Refund API (orderId is auto-generated inside momoClient)
        Long refundAmount = dto.getRefundAmount().longValue();
        String reason = dto.getRefundReason() != null ? dto.getRefundReason() : "Refund payment";

        try {
            MomoClient.MomoRefundResponse refundResponse = momoClient.refundPayment(
                    transId, refundAmount, reason);

            if (refundResponse.resultCode != null && refundResponse.resultCode == 0) {
                log.info("MoMo refund succeeded: refundOrderId={}, refundTransId={}",
                        refundResponse.orderId, refundResponse.refundTransId);

                // Verify refund via Query API using ORIGINAL orderId
                try {
                    MomoClient.MomoQueryResponse verifyResult = momoClient.queryPaymentStatus(orderId);
                    if (verifyResult.refundTrans != null && !verifyResult.refundTrans.isEmpty()) {
                        log.info("Verified {} refund transaction(s) for original orderId {}",
                                verifyResult.refundTrans.size(), orderId);
                        for (MomoClient.RefundTransItem rt : verifyResult.refundTrans) {
                            log.info("  RefundTrans: orderId={}, transId={}, amount={}, resultCode={}",
                                    rt.orderId, rt.transId, rt.amount, rt.resultCode);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Could not verify refund via Query API: {}", e.getMessage());
                }

                return refundResponse.refundTransId != null
                        ? refundResponse.refundTransId.toString()
                        : "REFUND-" + System.currentTimeMillis();
            } else {
                log.error("MoMo refund failed: refundOrderId={}, resultCode={}, message={}",
                        refundResponse.orderId, refundResponse.resultCode, refundResponse.message);
                return null; // MoMo refund failed, but still update DB status
            }
        } catch (Exception e) {
            log.error("MoMo refund API call failed for payment {}: {}", payment.getId(), e.getMessage());
            return null; // API call failed, but still update DB status
        }
    }

    /**
     * Query MoMo payment status (mock implementation)
     */
    private String queryMomoPaymentStatus(Payment payment) {
        // TODO: Implement actual MoMo query API call
        // https://developers.momo.vn/v3/docs/payment/api/payment-api/query/

        log.info("Mock MoMo query: payment={}, transactionId={}",
                payment.getId(), payment.getTransactionId());

        // Mock response based on current status
        if (payment.getTransactionId() != null) {
            return "SUCCESS";
        }

        return "PENDING";
    }

    // ==================== ADVANCED ADMIN METHODS ====================

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<PaymentDTO> getAllPaymentsAdvanced(
            String search,
            String status,
            String method,
            Long doctorId,
            Long patientId,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            String from,
            String to,
            int pageNumber,
            int pageSize,
            String sortBy,
            String sortDir) {

        log.info("Getting payments with advanced filters: search={}, status={}, method={}, doctorId={}", 
                search, status, method, doctorId);

        // Parse dates
        LocalDateTime fromDate = null;
        LocalDateTime toDate = null;

        if (from != null && !from.isBlank()) {
            try {
                fromDate = LocalDate.parse(from).atStartOfDay();
            } catch (Exception e) {
                log.warn("Invalid from date: {}", from);
            }
        }

        if (to != null && !to.isBlank()) {
            try {
                toDate = LocalDate.parse(to).atTime(23, 59, 59);
            } catch (Exception e) {
                log.warn("Invalid to date: {}", to);
            }
        }

        // Create sort
        org.springframework.data.domain.Sort sort;
        String sortField = com.q2k.meditech.util.SortFieldValidator.validate(
                sortBy, ALLOWED_PAYMENT_SORT_FIELDS, "createdAt");
        if (sortField.equals("paymentDate")) {
            sortField = "paidAt";
        }
        
        if ("ASC".equalsIgnoreCase(sortDir)) {
            sort = org.springframework.data.domain.Sort.by(sortField).ascending();
        } else {
            sort = org.springframework.data.domain.Sort.by(sortField).descending();
        }

        // Create pageable
        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(pageNumber, pageSize, sort);

        // Query with filters
        org.springframework.data.domain.Page<Payment> payments =
                paymentRepository.findAllWithAdvancedFilters(
                        search, status, method, doctorId, patientId,
                        minAmount, maxAmount, fromDate, toDate, pageable);

        // Map to DTOs
        return payments.map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentStatsDTO getPaymentStatistics(String from, String to) {
        log.info("Getting payment statistics from {} to {}", from, to);

        // Parse dates for stats
        LocalDateTime fromDate = null;
        LocalDateTime toDate = null;

        if (from != null && !from.isBlank()) {
            try {
                fromDate = LocalDate.parse(from).atStartOfDay();
            } catch (Exception e) {
                log.warn("Invalid from date: {}", from);
            }
        }

        if (to != null && !to.isBlank()) {
            try {
                toDate = LocalDate.parse(to).atTime(23, 59, 59);
            } catch (Exception e) {
                log.warn("Invalid to date: {}", to);
            }
        }

        // Today's stats
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(23, 59, 59);

        BigDecimal todayRevenue = paymentRepository.sumAmountByStatusInDateRange("PAID", todayStart, todayEnd);
        Long todayCount = paymentRepository.countCompletedInDateRange(todayStart, todayEnd);
        BigDecimal todayAvg = todayCount > 0 
                ? todayRevenue.divide(BigDecimal.valueOf(todayCount), 2, java.math.RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // This month's stats
        LocalDateTime monthStart = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = LocalDate.now().atTime(23, 59, 59);

        BigDecimal monthRevenue = paymentRepository.sumAmountByStatusInDateRange("PAID", monthStart, monthEnd);
        Long monthCount = paymentRepository.countCompletedInDateRange(monthStart, monthEnd);

        // Last month's stats
        LocalDateTime lastMonthStart = LocalDate.now().minusMonths(1).withDayOfMonth(1).atStartOfDay();
        LocalDateTime lastMonthEnd = LocalDate.now().minusMonths(1)
                .withDayOfMonth(LocalDate.now().minusMonths(1).lengthOfMonth())
                .atTime(23, 59, 59);

        BigDecimal lastMonthRevenue = paymentRepository.sumAmountByStatusInDateRange("PAID", lastMonthStart, lastMonthEnd);

        // Calculate growth percentage
        Double growthPercentage = 0.0;
        if (lastMonthRevenue != null && lastMonthRevenue.compareTo(BigDecimal.ZERO) > 0) {
            growthPercentage = monthRevenue.subtract(lastMonthRevenue)
                    .divide(lastMonthRevenue, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
        }

        // Payment methods distribution
        List<Object[]> methodStats = paymentRepository.countAndSumByPaymentMethodInDateRange(
                fromDate != null ? fromDate : monthStart, 
                toDate != null ? toDate : monthEnd);

        BigDecimal totalMethodAmount = methodStats.stream()
                .map(row -> convertToBigDecimal(row[2]))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<PaymentStatsDTO.PaymentMethodStats> methodDistribution = methodStats.stream()
                .map(row -> {
                    BigDecimal amount = convertToBigDecimal(row[2]);
                    return PaymentStatsDTO.PaymentMethodStats.builder()
                            .method(row[0] != null ? row[0].toString() : "UNKNOWN")
                            .count(convertToInteger(row[1]))
                            .amount(amount)
                            .percentage(totalMethodAmount.compareTo(BigDecimal.ZERO) > 0
                                    ? amount.divide(totalMethodAmount, 4, java.math.RoundingMode.HALF_UP)
                                            .multiply(BigDecimal.valueOf(100)).doubleValue()
                                    : 0.0)
                            .build();
                })
                .toList();

        // Pending payments
        Object[] pendingStats = paymentRepository.getPendingPaymentsStats();
        Integer pendingCount = 0;
        BigDecimal pendingAmount = BigDecimal.ZERO;
        if (pendingStats != null && pendingStats.length >= 2) {
            pendingCount = convertToInteger(pendingStats[0]);
            pendingAmount = convertToBigDecimal(pendingStats[1]);
        }

        // Refund stats this month
        Object[] refundStats = paymentRepository.getRefundStatsInDateRange(monthStart, monthEnd);
        Integer refundCountThisMonth = 0;
        BigDecimal totalRefundedThisMonth = BigDecimal.ZERO;
        if (refundStats != null && refundStats.length >= 2) {
            refundCountThisMonth = convertToInteger(refundStats[0]);
            totalRefundedThisMonth = convertToBigDecimal(refundStats[1]);
        }

        // Calculate refund rate
        Double refundRate = 0.0;
        if (monthCount != null && monthCount > 0) {
            refundRate = (refundCountThisMonth.doubleValue() / (monthCount + refundCountThisMonth)) * 100;
        }

        // Status breakdown
        List<Object[]> statusStats = paymentRepository.countByStatusInDateRange(
                fromDate != null ? fromDate : monthStart,
                toDate != null ? toDate : monthEnd);

        java.util.Map<String, Integer> statusCounts = new HashMap<>();
        for (Object[] row : statusStats) {
            String status = row[0] != null ? row[0].toString() : "UNKNOWN";
            statusCounts.put(status, convertToInteger(row[1]));
        }

        return PaymentStatsDTO.builder()
                .todayRevenue(todayRevenue != null ? todayRevenue : BigDecimal.ZERO)
                .todayTransactionCount(todayCount != null ? todayCount.intValue() : 0)
                .todayAverageTransaction(todayAvg)
                .monthRevenue(monthRevenue != null ? monthRevenue : BigDecimal.ZERO)
                .lastMonthRevenue(lastMonthRevenue != null ? lastMonthRevenue : BigDecimal.ZERO)
                .monthGrowthPercentage(growthPercentage)
                .monthTransactionCount(monthCount != null ? monthCount.intValue() : 0)
                .paymentMethodsDistribution(methodDistribution)
                .pendingCount(pendingCount)
                .pendingAmount(pendingAmount)
                .totalRefundedThisMonth(totalRefundedThisMonth)
                .refundCountThisMonth(refundCountThisMonth)
                .refundRatePercentage(refundRate)
                .statusCounts(statusCounts)
                .fromDate(from != null ? LocalDate.parse(from) : LocalDate.now().withDayOfMonth(1))
                .toDate(to != null ? LocalDate.parse(to) : LocalDate.now())
                .build();
    }

    @Override
    @Transactional
    public PaymentBulkResultDTO bulkMarkAsPaid(BulkMarkPaidDTO dto, Long currentUserId) {
        log.info("Bulk marking {} payments as paid", dto.getPaymentIds().size());

        List<PaymentBulkResultDTO.PaymentItemResult> results = new java.util.ArrayList<>();
        int successCount = 0;
        int failCount = 0;

        // Get current user
        User processedBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Get all payments
        List<Payment> payments = paymentRepository.findByIdIn(dto.getPaymentIds());

        // Create map for quick lookup
        java.util.Map<Long, Payment> paymentMap = payments.stream()
                .collect(java.util.stream.Collectors.toMap(Payment::getId, p -> p));

        for (Long paymentId : dto.getPaymentIds()) {
            try {
                Payment payment = paymentMap.get(paymentId);

                if (payment == null) {
                    results.add(PaymentBulkResultDTO.failItem(
                            paymentId, null, "Payment not found", "NOT_FOUND"));
                    failCount++;
                    continue;
                }

                if (!"PENDING".equals(payment.getPaymentStatus())) {
                    results.add(PaymentBulkResultDTO.failItem(
                            paymentId, payment.getPaymentCode(),
                            "Payment is not in PENDING status (current: " + payment.getPaymentStatus() + ")",
                            "INVALID_STATUS"));
                    failCount++;
                    continue;
                }

                // Mark as paid
                payment.setPaymentStatus("PAID");
                payment.setPaymentMethod(dto.getPaymentMethod());
                payment.setPaidAt(LocalDateTime.now());
                payment.setProcessedBy(processedBy);
                payment.setTransactionId(dto.getTransactionReference());
                
                String notes = dto.getNotes() != null ? dto.getNotes() : "";
                notes = "Bulk marked as paid. " + notes;
                payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "") + notes);

                paymentRepository.save(payment);

                // Create invoice
                try {
                    invoiceService.createInvoiceForPayment(payment.getId());
                    
                    // Send receipt if requested
                    if (Boolean.TRUE.equals(dto.getSendReceipts())) {
                        invoiceDeliveryService.autoSendInvoiceOnPaymentSuccess(payment.getId());
                    }
                } catch (Exception e) {
                    log.warn("Failed to create/send invoice for payment {}: {}", paymentId, e.getMessage());
                }

                results.add(PaymentBulkResultDTO.successItem(
                        paymentId, payment.getPaymentCode(), "Marked as paid successfully"));
                successCount++;

            } catch (Exception e) {
                log.error("Error processing payment {}: {}", paymentId, e.getMessage());
                results.add(PaymentBulkResultDTO.failItem(
                        paymentId, null, "Error: " + e.getMessage(), "PROCESSING_ERROR"));
                failCount++;
            }
        }

        return PaymentBulkResultDTO.builder()
                .totalProcessed(dto.getPaymentIds().size())
                .successCount(successCount)
                .failCount(failCount)
                .results(results)
                .message(String.format("Processed %d payments: %d succeeded, %d failed",
                        dto.getPaymentIds().size(), successCount, failCount))
                .build();
    }

    @Override
    public byte[] exportPayments(
            String search,
            String status,
            String method,
            Long doctorId,
            Long patientId,
            BigDecimal minAmount,
            BigDecimal maxAmount,
            String from,
            String to,
            String format) {

        log.info("Exporting payments in format: {}", format);

        // Get all matching payments (no pagination for export)
        org.springframework.data.domain.Page<PaymentDTO> paymentsPage = getAllPaymentsAdvanced(
                search, status, method, doctorId, patientId,
                minAmount, maxAmount, from, to, 0, 10000, "createdAt", "DESC");

        List<PaymentDTO> payments = paymentsPage.getContent();

        // Generate export based on format
        if ("CSV".equalsIgnoreCase(format)) {
            return generateCsvExport(payments);
        } else if ("PDF".equalsIgnoreCase(format)) {
            return generatePdfExport(payments);
        } else {
            // Default to Excel
            return generateExcelExport(payments);
        }
    }

    private byte[] generateCsvExport(List<PaymentDTO> payments) {
        StringBuilder csv = new StringBuilder();
        
        // Header
        csv.append("Payment Code,Patient Name,Amount,Payment Method,Status,Payment Date,Created At\n");
        
        // Data rows
        for (PaymentDTO p : payments) {
            csv.append(String.format("%s,%s,%s,%s,%s,%s,%s\n",
                    escapeCSV(p.getPaymentCode()),
                    escapeCSV(p.getPatientName()),
                    p.getTotalAmount(),
                    p.getPaymentMethod() != null ? p.getPaymentMethod() : "",
                    p.getPaymentStatus(),
                    p.getPaidAt() != null ? p.getPaidAt().toString() : "",
                    p.getCreatedAt() != null ? p.getCreatedAt().toString() : ""));
        }
        
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private byte[] generateExcelExport(List<PaymentDTO> payments) {
        try {
            return ExportUtil.toExcel(paymentExportColumns(), payments, "Payments");
        } catch (Exception e) {
            log.error("Error generating Excel export", e);
            throw new RuntimeException("Failed to generate Excel export", e);
        }
    }

    private byte[] generatePdfExport(List<PaymentDTO> payments) {
        try {
            return ExportUtil.toPdf(paymentExportColumns(), payments, "Payment Export Report");
        } catch (Exception e) {
            log.error("Error generating PDF export", e);
            throw new RuntimeException("Failed to generate PDF export", e);
        }
    }

    private List<ExportUtil.ExportColumn<PaymentDTO>> paymentExportColumns() {
        return List.of(
                ExportUtil.ExportColumn.of("Payment Code", PaymentDTO::getPaymentCode),
                ExportUtil.ExportColumn.of("Patient Name", PaymentDTO::getPatientName),
                ExportUtil.ExportColumn.of("Amount", p -> p.getTotalAmount() != null ? p.getTotalAmount().toPlainString() : ""),
                ExportUtil.ExportColumn.of("Payment Method", p -> p.getPaymentMethod() != null ? p.getPaymentMethod() : ""),
                ExportUtil.ExportColumn.of("Status", p -> p.getPaymentStatus() != null ? p.getPaymentStatus() : ""),
                ExportUtil.ExportColumn.of("Payment Date", p -> p.getPaidAt() != null ? p.getPaidAt().toString() : ""),
                ExportUtil.ExportColumn.of("Created At", p -> p.getCreatedAt() != null ? p.getCreatedAt().toString() : "")
        );
    }

    private String escapeCSV(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // ==================== PAYMENT DETAIL & ACTIONS APIs ====================

    @Override
    public PaymentDetailDTO getPaymentDetail(Long paymentId) {
        log.info("Getting payment detail for ID: {}", paymentId);

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        Appointment appointment = payment.getAppointment();
        Patient patient = payment.getPatient();
        Doctor doctor = appointment.getDoctor();

        // Build detailed DTO
        PaymentDetailDTO.PaymentDetailDTOBuilder builder = PaymentDetailDTO.builder()
                // Transaction Info
                .id(payment.getId())
                .paymentCode(payment.getPaymentCode())
                .paymentStatus(payment.getPaymentStatus())
                .paymentDate(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                // Payment Details
                .amount(payment.getAmount())
                .discountAmount(payment.getDiscountAmount())
                .taxAmount(payment.getTaxAmount())
                .totalAmount(payment.getTotalAmount())
                .transactionFee(BigDecimal.ZERO) // Default, can be calculated
                .netAmount(payment.getTotalAmount()) // totalAmount - fee
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod())
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
                .appointmentType(appointment.getReasonForVisit())
                .appointmentStatus(appointment.getStatus() != null 
                        ? appointment.getStatus().name() : null)
                // Gateway Info
                .gatewayName(payment.getPaymentMethod())
                .gatewayTransactionId(payment.getTransactionId())
                .gatewayResponse(payment.getGatewayResponse())
                // Refund Info
                .isRefunded("REFUNDED".equals(payment.getPaymentStatus()))
                .refundAmount(payment.getRefundAmount())
                .refundDate(payment.getRefundedAt())
                .refundReason(payment.getRefundReason())
                .refundStatus("REFUNDED".equals(payment.getPaymentStatus()) ? "COMPLETED" : null)
                .refundedByName("REFUNDED".equals(payment.getPaymentStatus()) && payment.getProcessedBy() != null
                        ? payment.getProcessedBy().getFullName() : null)
                // Processing Info
                .notes(payment.getNotes());

        // Add processed by info
        if (payment.getProcessedBy() != null) {
            builder.processedBy(payment.getProcessedBy().getId())
                    .processedByName(payment.getProcessedBy().getFullName());
        }

        // Add QR info if exists
        paymentQrRepository.findActiveByPaymentId(paymentId)
                .ifPresent(qr -> builder.qrInfo(mapToQrDTO(qr)));

        // Add Invoice info
        try {
            Invoice invoice = invoiceRepository.findByPaymentIdWithDetails(paymentId).orElse(null);
            if (invoice != null) {
                builder.invoiceId(invoice.getId())
                        .invoiceNumber(invoice.getInvoiceNumber())
                        .invoiceStatus(invoice.getStatus());
            }
        } catch (Exception e) {
            log.warn("Could not get invoice for payment {}: {}", paymentId, e.getMessage());
        }

        return builder.build();
    }

    @Override
    @Transactional
    public PaymentDTO markAsPaid(Long paymentId, MarkPaidDTO dto, Long currentUserId) {
        log.info("Marking payment {} as paid", paymentId);

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Validate status
        if (!"PENDING".equals(payment.getPaymentStatus()) && 
            !"INITIATED".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Can only mark PENDING or INITIATED payments as paid. Current status: " 
                    + payment.getPaymentStatus());
        }

        // Get current user
        User processedBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUserId));

        // Update payment
        payment.setPaymentStatus("PAID");
        payment.setPaymentMethod(dto.getPaymentMethod());
        payment.setPaidAt(dto.getPaidDate() != null ? dto.getPaidDate() : LocalDateTime.now());
        payment.setTransactionId(dto.getTransactionReference());
        payment.setProcessedBy(processedBy);

        String notes = dto.getNotes() != null ? dto.getNotes() : "";
        notes = "Manually marked as paid. " + notes;
        payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "") + notes);

        Payment saved = paymentRepository.save(payment);

        // Create invoice
        try {
            invoiceService.createInvoiceForPayment(saved.getId());

            // Send receipt if requested
            if (Boolean.TRUE.equals(dto.getSendReceipt())) {
                invoiceDeliveryService.autoSendInvoiceOnPaymentSuccess(saved.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to create/send invoice for payment {}: {}", paymentId, e.getMessage());
        }

        // Log audit
        logPaymentAudit(payment, "MARK_PAID", currentUserId, 
                "Payment marked as paid via " + dto.getPaymentMethod());

        log.info("Payment {} marked as paid successfully", paymentId);
        return mapToDTO(saved);
    }

    @Override
    public MessageDTO retryPayment(Long paymentId, RetryPaymentDTO dto, Long currentUserId) {
        log.info("Retrying payment {}, send via: {}", paymentId, dto.getSendVia());

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Validate status - can only retry PENDING or FAILED
        if (!"PENDING".equals(payment.getPaymentStatus()) && 
            !"FAILED".equals(payment.getPaymentStatus()) &&
            !"INITIATED".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Can only retry PENDING, INITIATED, or FAILED payments. Current status: " 
                    + payment.getPaymentStatus());
        }

        Patient patient = payment.getPatient();
        String patientEmail = patient.getUser().getEmail();
        String patientPhone = patient.getUser().getPhone();
        String patientName = patient.getUser().getFullName();

        // Generate payment link
        String paymentLink = generatePaymentLink(payment);

        StringBuilder resultMessage = new StringBuilder();
        int successCount = 0;

        // Send via requested channel(s)
        String sendVia = dto.getSendVia().toUpperCase();

        if ("EMAIL".equals(sendVia) || "BOTH".equals(sendVia)) {
            try {
                // Send email with payment link
                String emailMessage = dto.getCustomMessage() != null 
                        ? dto.getCustomMessage() 
                        : "Please complete your payment using the link below.";

                // TODO: Implement actual email sending
                log.info("Sending payment retry email to: {}", patientEmail);
                resultMessage.append("Email sent to ").append(patientEmail).append(". ");
                successCount++;
            } catch (Exception e) {
                log.error("Failed to send retry email: {}", e.getMessage());
                resultMessage.append("Failed to send email. ");
            }
        }

        if ("SMS".equals(sendVia) || "BOTH".equals(sendVia)) {
            try {
                // Send SMS with payment link
                log.info("Sending payment retry SMS to: {}", patientPhone);
                resultMessage.append("SMS sent to ").append(patientPhone).append(". ");
                successCount++;
            } catch (Exception e) {
                log.error("Failed to send retry SMS: {}", e.getMessage());
                resultMessage.append("Failed to send SMS. ");
            }
        }

        // Log audit
        logPaymentAudit(payment, "RETRY_PAYMENT", currentUserId, 
                "Payment link resent via " + sendVia);

        return MessageDTO.builder()
                .message(resultMessage.toString())
                .success(successCount > 0)
                .build();
    }

    @Override
    public MessageDTO sendReceipt(Long paymentId, SendReceiptDTO dto, Long currentUserId) {
        log.info("Sending receipt for payment {} to {}", paymentId, dto.getEmail());

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Must be paid to send receipt
        if (!"PAID".equals(payment.getPaymentStatus()) && 
            !"REFUNDED".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Can only send receipt for PAID or REFUNDED payments. Current status: " 
                    + payment.getPaymentStatus());
        }

        try {
            // Get or create invoice
            Invoice invoice = invoiceRepository.findByPaymentIdWithDetails(paymentId)
                    .orElseGet(() -> {
                        try {
                            InvoiceDTO invoiceDTO = invoiceService.createInvoiceForPayment(paymentId);
                            return invoiceRepository.findById(invoiceDTO.getId()).orElse(null);
                        } catch (Exception e) {
                            log.warn("Could not create invoice: {}", e.getMessage());
                            return null;
                        }
                    });

            // Send via invoice delivery service
            if (invoice != null) {
                SendInvoiceDTO sendDto = SendInvoiceDTO.builder()
                        .email(dto.getEmail())
                        .sendEmail(true)
                        .message(dto.getCustomMessage() != null ? dto.getCustomMessage() : 
                                "Thank you for your payment. Please find your receipt attached.")
                        .build();

                invoiceDeliveryService.sendInvoice(invoice.getId(), sendDto, currentUserId);
            }

            // Log audit
            logPaymentAudit(payment, "RECEIPT_SENT", currentUserId, 
                    "Receipt sent to " + dto.getEmail());

            return MessageDTO.builder()
                    .message("Receipt sent successfully to " + dto.getEmail())
                    .success(true)
                    .build();

        } catch (Exception e) {
            log.error("Failed to send receipt: {}", e.getMessage());
            return MessageDTO.builder()
                    .message("Failed to send receipt: " + e.getMessage())
                    .success(false)
                    .build();
        }
    }

    @Override
    public byte[] downloadReceipt(Long paymentId) {
        log.info("Downloading receipt for payment {}", paymentId);

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        Appointment appointment = payment.getAppointment();

        try (java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream()) {
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(baos);
            com.itextpdf.kernel.pdf.PdfDocument pdfDoc = new com.itextpdf.kernel.pdf.PdfDocument(writer);
            com.itextpdf.layout.Document document = new com.itextpdf.layout.Document(pdfDoc, 
                    com.itextpdf.kernel.geom.PageSize.A4);
            document.setMargins(40, 40, 40, 40);

            // Fonts
            com.itextpdf.layout.properties.TextAlignment CENTER = com.itextpdf.layout.properties.TextAlignment.CENTER;
            com.itextpdf.layout.properties.TextAlignment LEFT = com.itextpdf.layout.properties.TextAlignment.LEFT;
            com.itextpdf.layout.properties.TextAlignment RIGHT = com.itextpdf.layout.properties.TextAlignment.RIGHT;

            com.itextpdf.kernel.colors.Color headerBg = new com.itextpdf.kernel.colors.DeviceRgb(41, 128, 185);
            com.itextpdf.kernel.colors.Color white = com.itextpdf.kernel.colors.ColorConstants.WHITE;
            com.itextpdf.kernel.colors.Color lightGray = new com.itextpdf.kernel.colors.DeviceRgb(245, 245, 245);

            // ===== HEADER =====
            document.add(new com.itextpdf.layout.element.Paragraph("MEDITECH CLINIC")
                    .setFontSize(22).setBold().setTextAlignment(CENTER)
                    .setFontColor(headerBg).setMarginBottom(2));
            document.add(new com.itextpdf.layout.element.Paragraph("PAYMENT RECEIPT")
                    .setFontSize(16).setBold().setTextAlignment(CENTER)
                    .setMarginBottom(5));

            // Separator
            document.add(new com.itextpdf.layout.element.LineSeparator(
                    new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(1.5f)).setMarginBottom(15));

            // ===== RECEIPT INFO =====
            float[] infoCols = {1, 1};
            com.itextpdf.layout.element.Table infoTable = new com.itextpdf.layout.element.Table(
                    com.itextpdf.layout.properties.UnitValue.createPercentArray(infoCols)).useAllAvailableWidth();
            infoTable.addCell(createCell("Receipt No: " + payment.getPaymentCode(), 10, true, LEFT));
            String dateStr = payment.getPaidAt() != null 
                    ? payment.getPaidAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                    : payment.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
            infoTable.addCell(createCell("Date: " + dateStr, 10, false, RIGHT));
            document.add(infoTable.setMarginBottom(15));

            // ===== PATIENT SECTION =====
            document.add(createSectionHeader("PATIENT INFORMATION", headerBg, white));
            float[] patCols = {1, 2};
            com.itextpdf.layout.element.Table patTable = new com.itextpdf.layout.element.Table(
                    com.itextpdf.layout.properties.UnitValue.createPercentArray(patCols)).useAllAvailableWidth();
            addRow(patTable, "Name:", payment.getPatient().getUser().getFullName(), lightGray);
            addRow(patTable, "Email:", payment.getPatient().getUser().getEmail(), null);
            addRow(patTable, "Phone:", payment.getPatient().getUser().getPhone() != null 
                    ? payment.getPatient().getUser().getPhone() : "N/A", lightGray);
            document.add(patTable.setMarginBottom(15));

            // ===== APPOINTMENT SECTION =====
            document.add(createSectionHeader("APPOINTMENT DETAILS", headerBg, white));
            com.itextpdf.layout.element.Table aptTable = new com.itextpdf.layout.element.Table(
                    com.itextpdf.layout.properties.UnitValue.createPercentArray(patCols)).useAllAvailableWidth();
            addRow(aptTable, "Code:", appointment.getAppointmentCode(), lightGray);
            addRow(aptTable, "Doctor:", appointment.getDoctor().getUser().getFullName(), null);
            addRow(aptTable, "Specialization:", appointment.getDoctor().getSpecialization() != null 
                    ? appointment.getDoctor().getSpecialization() : "N/A", lightGray);
            addRow(aptTable, "Date:", appointment.getAppointmentDate().format(
                    java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")), null);
            document.add(aptTable.setMarginBottom(15));

            // ===== PAYMENT BREAKDOWN =====
            document.add(createSectionHeader("PAYMENT DETAILS", headerBg, white));
            float[] payCols = {3, 2};
            com.itextpdf.layout.element.Table payTable = new com.itextpdf.layout.element.Table(
                    com.itextpdf.layout.properties.UnitValue.createPercentArray(payCols)).useAllAvailableWidth();
            addAmountRow(payTable, "Consultation Fee", payment.getAmount(), payment.getCurrency(), lightGray);
            if (payment.getDiscountAmount() != null && payment.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                addAmountRow(payTable, "Discount", payment.getDiscountAmount().negate(), payment.getCurrency(), null);
            }
            if (payment.getTaxAmount() != null && payment.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
                addAmountRow(payTable, "Tax", payment.getTaxAmount(), payment.getCurrency(), null);
            }
            document.add(payTable);

            // Total row
            document.add(new com.itextpdf.layout.element.LineSeparator(
                    new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(1)).setMarginTop(5).setMarginBottom(5));
            float[] totalCols = {3, 2};
            com.itextpdf.layout.element.Table totalTable = new com.itextpdf.layout.element.Table(
                    com.itextpdf.layout.properties.UnitValue.createPercentArray(totalCols)).useAllAvailableWidth();
            totalTable.addCell(new com.itextpdf.layout.element.Cell().add(
                    new com.itextpdf.layout.element.Paragraph("TOTAL").setBold().setFontSize(12))
                    .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setTextAlignment(LEFT));
            totalTable.addCell(new com.itextpdf.layout.element.Cell().add(
                    new com.itextpdf.layout.element.Paragraph(
                            String.format("%,.0f %s", payment.getTotalAmount().doubleValue(), payment.getCurrency()))
                            .setBold().setFontSize(12))
                    .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setTextAlignment(RIGHT));
            document.add(totalTable.setMarginBottom(15));

            // ===== PAYMENT METHOD / STATUS =====
            document.add(new com.itextpdf.layout.element.LineSeparator(
                    new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(0.5f)).setMarginBottom(10));
            com.itextpdf.layout.element.Table metaTable = new com.itextpdf.layout.element.Table(
                    com.itextpdf.layout.properties.UnitValue.createPercentArray(patCols)).useAllAvailableWidth();
            addRow(metaTable, "Payment Method:", payment.getPaymentMethod(), lightGray);
            addRow(metaTable, "Status:", payment.getPaymentStatus(), null);
            if (payment.getTransactionId() != null) {
                addRow(metaTable, "Transaction ID:", payment.getTransactionId(), lightGray);
            }
            document.add(metaTable.setMarginBottom(20));

            // ===== FOOTER =====
            document.add(new com.itextpdf.layout.element.LineSeparator(
                    new com.itextpdf.kernel.pdf.canvas.draw.SolidLine(1.5f)).setMarginBottom(10));
            document.add(new com.itextpdf.layout.element.Paragraph("Thank you for choosing MediTech Clinic!")
                    .setFontSize(11).setItalic().setTextAlignment(CENTER)
                    .setFontColor(new com.itextpdf.kernel.colors.DeviceRgb(100, 100, 100)));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Error generating PDF receipt for payment {}: {}", paymentId, e.getMessage(), e);
            throw new RuntimeException("Failed to generate receipt PDF", e);
        }
    }

    // ===== PDF Helper Methods =====
    private com.itextpdf.layout.element.Paragraph createSectionHeader(String text,
            com.itextpdf.kernel.colors.Color bgColor, com.itextpdf.kernel.colors.Color fontColor) {
        return new com.itextpdf.layout.element.Paragraph(text)
                .setFontSize(11).setBold()
                .setBackgroundColor(bgColor)
                .setFontColor(fontColor)
                .setPadding(6)
                .setMarginBottom(0);
    }

    private com.itextpdf.layout.element.Cell createCell(String text, float fontSize, boolean bold,
            com.itextpdf.layout.properties.TextAlignment alignment) {
        com.itextpdf.layout.element.Paragraph p = new com.itextpdf.layout.element.Paragraph(text).setFontSize(fontSize);
        if (bold) p.setBold();
        return new com.itextpdf.layout.element.Cell().add(p)
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setTextAlignment(alignment);
    }

    private void addRow(com.itextpdf.layout.element.Table table, String label, String value,
            com.itextpdf.kernel.colors.Color bgColor) {
        com.itextpdf.layout.element.Cell labelCell = new com.itextpdf.layout.element.Cell()
                .add(new com.itextpdf.layout.element.Paragraph(label).setFontSize(10).setBold())
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setPadding(4);
        com.itextpdf.layout.element.Cell valueCell = new com.itextpdf.layout.element.Cell()
                .add(new com.itextpdf.layout.element.Paragraph(value != null ? value : "N/A").setFontSize(10))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setPadding(4);
        if (bgColor != null) {
            labelCell.setBackgroundColor(bgColor);
            valueCell.setBackgroundColor(bgColor);
        }
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private void addAmountRow(com.itextpdf.layout.element.Table table, String label, BigDecimal amount,
            String currency, com.itextpdf.kernel.colors.Color bgColor) {
        com.itextpdf.layout.element.Cell labelCell = new com.itextpdf.layout.element.Cell()
                .add(new com.itextpdf.layout.element.Paragraph(label).setFontSize(10))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setPadding(4);
        com.itextpdf.layout.element.Cell valueCell = new com.itextpdf.layout.element.Cell()
                .add(new com.itextpdf.layout.element.Paragraph(
                        String.format("%,.0f %s", amount.doubleValue(), currency)).setFontSize(10))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setPadding(4)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.RIGHT);
        if (bgColor != null) {
            labelCell.setBackgroundColor(bgColor);
            valueCell.setBackgroundColor(bgColor);
        }
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    @Override
    public PaymentHistoryDTO getPaymentHistory(Long paymentId) {
        log.info("Getting payment history for ID: {}", paymentId);

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        List<PaymentHistoryDTO.HistoryEvent> events = new java.util.ArrayList<>();
        long eventId = 1;

        // Created event
        events.add(PaymentHistoryDTO.HistoryEvent.builder()
                .id(eventId++)
                .eventType("CREATED")
                .description("Payment created")
                .newValue(payment.getPaymentStatus())
                .eventTime(payment.getCreatedAt())
                .build());

        // If paid, add paid event
        if (payment.getPaidAt() != null) {
            events.add(PaymentHistoryDTO.HistoryEvent.builder()
                    .id(eventId++)
                    .eventType("STATUS_CHANGED")
                    .description("Payment completed")
                    .previousValue("PENDING")
                    .newValue("PAID")
                    .performedByName(payment.getProcessedBy() != null 
                            ? payment.getProcessedBy().getFullName() : "System")
                    .performedById(payment.getProcessedBy() != null 
                            ? payment.getProcessedBy().getId() : null)
                    .eventTime(payment.getPaidAt())
                    .build());
        }

        // If refunded, add refund event
        if (payment.getRefundedAt() != null) {
            events.add(PaymentHistoryDTO.HistoryEvent.builder()
                    .id(eventId++)
                    .eventType("REFUND_PROCESSED")
                    .description("Payment refunded: " + payment.getRefundReason())
                    .previousValue("PAID")
                    .newValue("REFUNDED")
                    .eventTime(payment.getRefundedAt())
                    .metadata(Map.of("refundAmount", payment.getRefundAmount()))
                    .build());
        }

        // Check if cancelled
        if ("CANCELLED".equals(payment.getPaymentStatus())) {
            events.add(PaymentHistoryDTO.HistoryEvent.builder()
                    .id(eventId++)
                    .eventType("STATUS_CHANGED")
                    .description("Payment cancelled")
                    .newValue("CANCELLED")
                    .eventTime(payment.getUpdatedAt())
                    .build());
        }

        // Check if expired
        if ("EXPIRED".equals(payment.getPaymentStatus())) {
            events.add(PaymentHistoryDTO.HistoryEvent.builder()
                    .id(eventId++)
                    .eventType("STATUS_CHANGED")
                    .description("Payment expired")
                    .newValue("EXPIRED")
                    .eventTime(payment.getUpdatedAt())
                    .build());
        }

        // Sort events by time
        events.sort((a, b) -> {
            if (a.getEventTime() == null) return -1;
            if (b.getEventTime() == null) return 1;
            return a.getEventTime().compareTo(b.getEventTime());
        });

        return PaymentHistoryDTO.builder()
                .paymentId(paymentId)
                .paymentCode(payment.getPaymentCode())
                .events(events)
                .build();
    }

    // ========== RECEPTIONIST TAB 5 — NEW METHODS ==========

    @Override
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<PendingPaymentDTO> getPendingPayments(
            String search, int pageNumber, int pageSize, String sortBy, String sortDir) {

        log.info("Getting pending payments list - search: {}, page: {}, size: {}", search, pageNumber, pageSize);

        // "daysPending" is a computed DTO field — map it to createdAt with inverted direction
        String effectiveSortBy = com.q2k.meditech.util.SortFieldValidator.validate(
                sortBy, ALLOWED_PAYMENT_SORT_FIELDS, "createdAt");
        String effectiveSortDir = sortDir;
        if ("daysPending".equalsIgnoreCase(sortBy)) {
            effectiveSortBy = "createdAt";
            // Invert: more days pending = older = smaller createdAt
            effectiveSortDir = "DESC".equalsIgnoreCase(sortDir) ? "ASC" : "DESC";
        }

        org.springframework.data.domain.Sort sort = "ASC".equalsIgnoreCase(effectiveSortDir)
                ? org.springframework.data.domain.Sort.by(effectiveSortBy).ascending()
                : org.springframework.data.domain.Sort.by(effectiveSortBy).descending();

        // Default sort: oldest first (createdAt ASC)
        if (effectiveSortBy == null || effectiveSortBy.isEmpty()) {
            sort = org.springframework.data.domain.Sort.by("createdAt").ascending();
        }

        org.springframework.data.domain.Pageable pageable =
                org.springframework.data.domain.PageRequest.of(pageNumber, pageSize, sort);

        org.springframework.data.domain.Page<Payment> paymentPage = paymentRepository.findPendingPayments(search, pageable);

        return paymentPage.map(this::mapToPendingPaymentDTO);
    }

    private PendingPaymentDTO mapToPendingPaymentDTO(Payment payment) {
        Appointment appointment = payment.getAppointment();
        Patient patient = payment.getPatient();
        User patientUser = patient.getUser();

        // Calculate days pending
        LocalDateTime completedAt = appointment.getConsultationEndedAt() != null
                ? appointment.getConsultationEndedAt()
                : payment.getCreatedAt();
        long daysPending = java.time.Duration.between(completedAt, LocalDateTime.now()).toDays();

        // Determine urgency level (matches frontend URGENCY_STYLES: HIGH, MEDIUM, LOW)
        String urgencyLevel;
        if (daysPending >= 3) {
            urgencyLevel = "HIGH";
        } else if (daysPending >= 1) {
            urgencyLevel = "MEDIUM";
        } else {
            urgencyLevel = "LOW";
        }

        // Mask phone: 0912345678 -> 091****678
        String maskedPhone = privacyMaskingService.maskPhone(patientUser.getPhone());

        return PendingPaymentDTO.builder()
                .paymentId(payment.getId())
                .paymentCode(payment.getPaymentCode())
                .appointmentId(appointment.getId())
                .appointmentCode(appointment.getAppointmentCode())
                .appointmentStatus(appointment.getStatus() != null ? appointment.getStatus().name() : null)
                .completedAt(completedAt)
                .patientId(patient.getId())
                .patientName(patientUser.getFullName())
                .maskedPhone(maskedPhone)
                .email(patientUser.getEmail())
                .doctorName(appointment.getDoctor() != null && appointment.getDoctor().getUser() != null
                        ? appointment.getDoctor().getUser().getFullName() : null)
                .amountDue(payment.getTotalAmount())
                .currency(payment.getCurrency())
                .daysPending(daysPending)
                .lastReminderSent(null) // TODO: implement reminder tracking entity
                .reminderCount(0)
                .urgencyLevel(urgencyLevel)
                .createdAt(payment.getCreatedAt())
                .build();
    }

    // masking is now handled by PrivacyMaskingService

    @Override
    public MessageDTO sendPaymentLink(Long paymentId, SendPaymentLinkDTO dto, Long currentUserId) {
        log.info("Sending payment link for payment {} via {}", paymentId, dto.getSendVia());

        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Only allow sending for PENDING / FAILED / INITIATED payments
        if (!"PENDING".equals(payment.getPaymentStatus())
                && !"FAILED".equals(payment.getPaymentStatus())
                && !"INITIATED".equals(payment.getPaymentStatus())) {
            throw new BadRequestException(
                    "Can only send payment link for PENDING, INITIATED, or FAILED payments. Current status: "
                            + payment.getPaymentStatus());
        }

        Patient patient = payment.getPatient();
        String patientEmail = patient.getUser().getEmail();
        String patientPhone = patient.getUser().getPhone();
        String patientName = patient.getUser().getFullName();

        String paymentLink = generatePaymentLink(payment);

        StringBuilder resultMessage = new StringBuilder();
        int successCount = 0;
        String sendVia = dto.getSendVia().toUpperCase();

        if ("EMAIL".equals(sendVia) || "BOTH".equals(sendVia)) {
            try {
                String emailBody = dto.getCustomMessage() != null
                        ? dto.getCustomMessage()
                        : String.format("Dear %s, please complete your payment of %s %s using the link: %s",
                                patientName, payment.getTotalAmount(), payment.getCurrency(), paymentLink);
                log.info("Sending payment link email to: {} - message: {}", patientEmail, emailBody);

                String htmlContent = buildPaymentLinkEmailTemplate(patientName, payment.getTotalAmount(), payment.getCurrency(), paymentLink, payment.getPaymentCode());
                String subject = "Invoice Payment - MediTech (#" + payment.getPaymentCode() + ")";
                emailService.sendHtmlEmail(patientEmail, subject, htmlContent);

                resultMessage.append("Email sent to ").append(patientEmail).append(". ");
                successCount++;
            } catch (Exception e) {
                log.error("Failed to send payment link email: {}", e.getMessage());
                resultMessage.append("Failed to send email. ");
            }
        }

        if ("SMS".equals(sendVia) || "BOTH".equals(sendVia)) {
            try {
                String smsMessage = dto.getCustomMessage() != null
                        ? dto.getCustomMessage()
                        : String.format("MediTech: Please complete your payment of %s VND. Link: %s",
                                payment.getTotalAmount(), paymentLink);
                log.info("Sending payment link SMS to: {} - message: {}", patientPhone, smsMessage);
                smsService.sendSms(patientPhone, smsMessage);
                resultMessage.append("SMS sent to ").append(patientPhone).append(". ");
                successCount++;
            } catch (Exception e) {
                log.error("Failed to send payment link SMS: {}", e.getMessage());
                resultMessage.append("Failed to send SMS. ");
            }
        }

        logPaymentAudit(payment, "SEND_PAYMENT_LINK", currentUserId,
                "Payment link sent via " + sendVia + " for payment " + payment.getPaymentCode());

        return MessageDTO.builder()
                .message(resultMessage.toString())
                .success(successCount > 0)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public HourlyRevenueDTO getHourlyRevenue(String date) {
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        LocalDateTime startOfDay = targetDate.atStartOfDay();
        LocalDateTime endOfDay = targetDate.atTime(23, 59, 59);

        log.info("Getting hourly revenue for date: {}", targetDate);

        List<Object[]> hourlyData = paymentRepository.getHourlyRevenue(startOfDay, endOfDay);

        // Initialize all 24 hours
        Map<Integer, HourlyRevenueDTO.HourlyData> hourMap = new java.util.LinkedHashMap<>();
        for (int h = 0; h < 24; h++) {
            hourMap.put(h, HourlyRevenueDTO.HourlyData.builder()
                    .hour(h)
                    .label(String.format("%02d:00", h))
                    .revenue(BigDecimal.ZERO)
                    .transactionCount(0)
                    .cashAmount(BigDecimal.ZERO)
                    .momoAmount(BigDecimal.ZERO)
                    .build());
        }

        BigDecimal totalRevenue = BigDecimal.ZERO;
        int totalTransactions = 0;

        // Fill data from query results
        for (Object[] row : hourlyData) {
            Integer hour = convertToInteger(row[0]);
            String method = row[1] != null ? row[1].toString() : "UNKNOWN";
            Integer count = convertToInteger(row[2]);
            BigDecimal amount = convertToBigDecimal(row[3]);

            HourlyRevenueDTO.HourlyData hd = hourMap.get(hour);
            if (hd != null) {
                hd.setRevenue(hd.getRevenue().add(amount));
                hd.setTransactionCount(hd.getTransactionCount() + count);

                if ("CASH".equals(method)) {
                    hd.setCashAmount(hd.getCashAmount().add(amount));
                } else if ("MOMO".equals(method)) {
                    hd.setMomoAmount(hd.getMomoAmount().add(amount));
                }
            }

            totalRevenue = totalRevenue.add(amount);
            totalTransactions += count;
        }

        return HourlyRevenueDTO.builder()
                .date(targetDate)
                .totalRevenue(totalRevenue)
                .totalTransactions(totalTransactions)
                .hourlyData(new java.util.ArrayList<>(hourMap.values()))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EndOfDayReportDTO generateEndOfDayReport(String date, Long currentUserId) {
        LocalDate targetDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        LocalDateTime startOfDay = targetDate.atStartOfDay();
        LocalDateTime endOfDay = targetDate.atTime(23, 59, 59);

        log.info("Generating end-of-day report for: {}", targetDate);

        // Get all paid transactions for the date
        List<Payment> paidPayments = paymentRepository.findPaidPaymentsForDate(startOfDay, endOfDay);

        // Calculate totals
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal cashTotal = BigDecimal.ZERO;
        BigDecimal momoTotal = BigDecimal.ZERO;
        int cashCount = 0;
        int momoCount = 0;

        List<EndOfDayReportDTO.TransactionSummary> transactions = new java.util.ArrayList<>();

        for (Payment p : paidPayments) {
            BigDecimal amt = p.getTotalAmount() != null ? p.getTotalAmount() : BigDecimal.ZERO;
            totalRevenue = totalRevenue.add(amt);

            if ("CASH".equals(p.getPaymentMethod())) {
                cashTotal = cashTotal.add(amt);
                cashCount++;
            } else if ("MOMO".equals(p.getPaymentMethod())) {
                momoTotal = momoTotal.add(amt);
                momoCount++;
            }

            transactions.add(EndOfDayReportDTO.TransactionSummary.builder()
                    .transactionCode(p.getPaymentCode())
                    .appointmentCode(p.getAppointment() != null && p.getAppointment().getAppointmentCode() != null
                            ? p.getAppointment().getAppointmentCode()
                            : (p.getAppointment() != null ? "APT-" + p.getAppointment().getId() : null))
                    .paidTime(p.getPaidAt() != null ? p.getPaidAt().toLocalTime() : null)
                    .amount(amt)
                    .paymentMethod(p.getPaymentMethod())
                    .status(p.getPaymentStatus())
                    .collectedBy(p.getProcessedBy() != null ? p.getProcessedBy().getEmail() : null)
                    .build());
        }

        // Get pending payments stats
        int pendingCount = 0;
        BigDecimal pendingAmount = BigDecimal.ZERO;
        try {
            Object[] pendingStats = paymentRepository.countPendingPaymentsWithCompletedAppointment();
            if (pendingStats != null && pendingStats.length >= 2) {
                pendingCount = convertToInteger(pendingStats[0]);
                pendingAmount = convertToBigDecimal(pendingStats[1]);
            }
        } catch (Exception e) {
            log.warn("Failed to get pending payment stats: {}", e.getMessage());
        }

        // Get generator name
        String generatedBy = "System";
        if (currentUserId != null) {
            generatedBy = userRepository.findById(currentUserId)
                    .map(User::getEmail)
                    .orElse("System");
        }

        return EndOfDayReportDTO.builder()
                .reportDate(targetDate)
                .generatedBy(generatedBy)
                .generatedAt(LocalDateTime.now())
                .totalRevenue(totalRevenue)
                .totalTransactions(paidPayments.size())
                .cashTotal(cashTotal)
                .cashTransactions(cashCount)
                .momoTotal(momoTotal)
                .momoTransactions(momoCount)
                .pendingCount(pendingCount)
                .pendingAmount(pendingAmount)
                .transactions(transactions)
                .build();
    }

    @Override
    public byte[] exportEndOfDayReport(String date, String format, Long currentUserId) {
        EndOfDayReportDTO report = generateEndOfDayReport(date, currentUserId);

        log.info("Exporting end-of-day report for {} in {} format", report.getReportDate(), format);

        if ("EXCEL".equalsIgnoreCase(format)) {
            return generateEndOfDayExcel(report);
        } else {
            // Default: plain text report
            return generateEndOfDayText(report);
        }
    }

    private byte[] generateEndOfDayExcel(EndOfDayReportDTO report) {
        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("End of Day Report");

            int rowNum = 0;

            // Title
            org.apache.poi.ss.usermodel.Row titleRow = sheet.createRow(rowNum++);
            titleRow.createCell(0).setCellValue("END OF DAY REPORT - " + report.getReportDate());
            rowNum++;

            // Summary
            org.apache.poi.ss.usermodel.Row r1 = sheet.createRow(rowNum++);
            r1.createCell(0).setCellValue("Total Revenue:");
            r1.createCell(1).setCellValue(report.getTotalRevenue().doubleValue());

            org.apache.poi.ss.usermodel.Row r2 = sheet.createRow(rowNum++);
            r2.createCell(0).setCellValue("Total Transactions:");
            r2.createCell(1).setCellValue(report.getTotalTransactions());

            org.apache.poi.ss.usermodel.Row r3 = sheet.createRow(rowNum++);
            r3.createCell(0).setCellValue("Cash Total:");
            r3.createCell(1).setCellValue(report.getCashTotal().doubleValue());
            r3.createCell(2).setCellValue("(" + report.getCashTransactions() + " txns)");

            org.apache.poi.ss.usermodel.Row r4 = sheet.createRow(rowNum++);
            r4.createCell(0).setCellValue("MoMo Total:");
            r4.createCell(1).setCellValue(report.getMomoTotal().doubleValue());
            r4.createCell(2).setCellValue("(" + report.getMomoTransactions() + " txns)");

            org.apache.poi.ss.usermodel.Row r5 = sheet.createRow(rowNum++);
            r5.createCell(0).setCellValue("Pending:");
            r5.createCell(1).setCellValue(report.getPendingAmount().doubleValue());
            r5.createCell(2).setCellValue("(" + report.getPendingCount() + " items)");

            rowNum++;

            // Transaction header
            org.apache.poi.ss.usermodel.Row header = sheet.createRow(rowNum++);
            header.createCell(0).setCellValue("Transaction Code");
            header.createCell(1).setCellValue("Appointment Code");
            header.createCell(2).setCellValue("Time");
            header.createCell(3).setCellValue("Amount");
            header.createCell(4).setCellValue("Method");
            header.createCell(5).setCellValue("Collected By");

            // Transactions
            for (EndOfDayReportDTO.TransactionSummary t : report.getTransactions()) {
                org.apache.poi.ss.usermodel.Row tr = sheet.createRow(rowNum++);
                tr.createCell(0).setCellValue(t.getTransactionCode() != null ? t.getTransactionCode() : "");
                tr.createCell(1).setCellValue(t.getAppointmentCode() != null ? t.getAppointmentCode() : "");
                tr.createCell(2).setCellValue(t.getPaidTime() != null ? t.getPaidTime().toString() : "");
                tr.createCell(3).setCellValue(t.getAmount() != null ? t.getAmount().doubleValue() : 0);
                tr.createCell(4).setCellValue(t.getPaymentMethod() != null ? t.getPaymentMethod() : "");
                tr.createCell(5).setCellValue(t.getCollectedBy() != null ? t.getCollectedBy() : "");
            }

            for (int i = 0; i < 6; i++) {
                sheet.autoSizeColumn(i);
            }

            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
            workbook.write(bos);
            return bos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Excel report: {}", e.getMessage());
            throw new BadRequestException("Failed to generate Excel report: " + e.getMessage());
        }
    }

    private byte[] generateEndOfDayText(EndOfDayReportDTO report) {
        StringBuilder sb = new StringBuilder();
        sb.append("====================================\n");
        sb.append("    END OF DAY REPORT\n");
        sb.append("    Date: ").append(report.getReportDate()).append("\n");
        sb.append("    Generated by: ").append(report.getGeneratedBy()).append("\n");
        sb.append("    Generated at: ").append(report.getGeneratedAt()).append("\n");
        sb.append("====================================\n\n");

        sb.append("SUMMARY\n");
        sb.append("-------\n");
        sb.append("Total Revenue:      ").append(report.getTotalRevenue()).append(" VND\n");
        sb.append("Total Transactions: ").append(report.getTotalTransactions()).append("\n");
        sb.append("Cash:               ").append(report.getCashTotal()).append(" VND (")
                .append(report.getCashTransactions()).append(" txns)\n");
        sb.append("MoMo:               ").append(report.getMomoTotal()).append(" VND (")
                .append(report.getMomoTransactions()).append(" txns)\n");
        sb.append("Pending:            ").append(report.getPendingAmount()).append(" VND (")
                .append(report.getPendingCount()).append(" items)\n\n");

        sb.append("TRANSACTIONS\n");
        sb.append("------------\n");
        sb.append(String.format("%-15s %-15s %-10s %-15s %-8s %-20s\n",
                "TXN Code", "Apt Code", "Time", "Amount", "Method", "Collected By"));
        sb.append("-".repeat(85)).append("\n");

        for (EndOfDayReportDTO.TransactionSummary t : report.getTransactions()) {
            sb.append(String.format("%-15s %-15s %-10s %-15s %-8s %-20s\n",
                    t.getTransactionCode() != null ? t.getTransactionCode() : "",
                    t.getAppointmentCode() != null ? t.getAppointmentCode() : "",
                    t.getPaidTime() != null ? t.getPaidTime().toString() : "",
                    t.getAmount() != null ? t.getAmount().toString() : "0",
                    t.getPaymentMethod() != null ? t.getPaymentMethod() : "",
                    t.getCollectedBy() != null ? t.getCollectedBy() : ""));
        }

        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    // ========== HELPER METHODS ==========

    private String generatePaymentLink(Payment payment) {
        // Generate a payment URL for the patient
        return String.format("https://meditech.app/pay/%s", payment.getPaymentCode());
    }

    private String buildPaymentLinkEmailTemplate(String patientName, BigDecimal amount, String currency, String paymentLink, String paymentCode) {
        String formattedAmount = amount != null 
                ? new java.text.DecimalFormat("#,###").format(amount) + " " + (currency != null ? currency : "VND")
                : "N/A";
        return "<!DOCTYPE html>\n" +
                "<html>\n<head>\n<meta charset='UTF-8'>\n<style>\n" +
                "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n" +
                ".container { max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                ".header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n" +
                ".content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }\n" +
                ".amount-box { background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n" +
                ".amount { font-size: 28px; font-weight: bold; color: #e74c3c; }\n" +
                ".pay-btn { display: inline-block; background: #667eea; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px; }\n" +
                ".footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }\n" +
                "</style>\n</head>\n<body>\n<div class='container'>\n" +
                "<div class='header'>\n<h1>MediTech</h1>\n<p>Payment Notification</p>\n</div>\n" +
                "<div class='content'>\n" +
                "<h2>Hello " + (patientName != null ? patientName : "Valued Customer") + ",</h2>\n" +
                "<p>You have an invoice pending payment at MediTech.</p>\n" +
                "<div class='amount-box'>\n" +
                "<p>Payment Code: <strong>" + (paymentCode != null ? paymentCode : "") + "</strong></p>\n" +
                "<p class='amount'>" + formattedAmount + "</p>\n" +
                "<a href='" + paymentLink + "' class='pay-btn'>Pay Now</a>\n" +
                "</div>\n" +
                "<p>Or copy the payment link: <br/><a href='" + paymentLink + "'>" + paymentLink + "</a></p>\n" +
                "<p style='color: #999; font-size: 13px;'>If you have already made the payment, please disregard this email.</p>\n" +
                "</div>\n" +
                "<div class='footer'>\n<p>© 2026 MediTech. All rights reserved.</p>\n</div>\n" +
                "</div>\n</body>\n</html>";
    }

    private void logPaymentAudit(Payment payment, String action, Long userId, String details) {
        try {
            User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
            // Hibernate JSON type expects a JSON String, not a raw Map
            String jsonValue;
            try {
                Map<String, Object> data = new HashMap<>();
                data.put("action", action);
                data.put("details", details);
                data.put("paymentCode", payment.getPaymentCode());
                data.put("timestamp", LocalDateTime.now().toString());
                jsonValue = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(data);
            } catch (Exception ex) {
                jsonValue = "{\"action\":\"" + action + "\",\"details\":\"" + details + "\"}";
            }

            AuditLog auditLog = AuditLog.builder()
                    .entityType("Payment")
                    .entityId(payment.getId())
                    .action(action)
                    .user(user)
                    .newValues(jsonValue)
                    .ipAddress(getCurrentIpAddress())
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Failed to log payment audit: {}", e.getMessage());
        }
    }

    private String getCurrentIpAddress() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty()) {
                    ip = request.getRemoteAddr();
                }
                return ip;
            }
        } catch (Exception e) {
            // Ignore
        }
        return "unknown";
    }

    /**
     * Safely convert Object to Integer
     */
    private Integer convertToInteger(Object obj) {
        if (obj == null) {
            return 0;
        }
        if (obj instanceof Long) {
            return ((Long) obj).intValue();
        }
        if (obj instanceof Integer) {
            return (Integer) obj;
        }
        if (obj instanceof Number) {
            return ((Number) obj).intValue();
        }
        try {
            return Integer.parseInt(obj.toString());
        } catch (Exception e) {
            log.warn("Cannot convert {} to Integer", obj);
            return 0;
        }
    }

    /**
     * Safely convert Object to BigDecimal
     */
    private BigDecimal convertToBigDecimal(Object obj) {
        if (obj == null) {
            return BigDecimal.ZERO;
        }
        if (obj instanceof BigDecimal) {
            return (BigDecimal) obj;
        }
        if (obj instanceof Number) {
            return BigDecimal.valueOf(((Number) obj).doubleValue());
        }
        try {
            return new BigDecimal(obj.toString());
        } catch (Exception e) {
            log.warn("Cannot convert {} to BigDecimal", obj);
            return BigDecimal.ZERO;
        }
    }

    private String generateRefundCode() {
        String prefix = "RF" + LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
        String maxCode = refundRepository.findMaxRefundCodeByPrefix(prefix);
        int sequence = 1;
        if (maxCode != null && maxCode.length() > prefix.length()) {
            try {
                sequence = Integer.parseInt(maxCode.substring(prefix.length())) + 1;
            } catch (NumberFormatException ignored) {}
        }
        return prefix + String.format("%04d", sequence);
    }

    private RefundMethod resolveRefundMethod(String paymentMethod) {
        if (paymentMethod == null) return RefundMethod.ORIGINAL_METHOD;
        return switch (paymentMethod.toUpperCase()) {
            case "MOMO" -> RefundMethod.MOMO;
            case "CASH" -> RefundMethod.CASH;
            case "BANK_TRANSFER" -> RefundMethod.BANK_TRANSFER;
            case "VNPAY" -> RefundMethod.VNPAY;
            case "ZALOPAY" -> RefundMethod.ZALOPAY;
            case "CARD", "CREDIT_CARD", "DEBIT_CARD" -> RefundMethod.CARD;
            default -> RefundMethod.ORIGINAL_METHOD;
        };
    }

    private RefundReason resolveRefundReason(String reason) {
        if (reason == null) return RefundReason.OTHER;
        String upper = reason.toUpperCase().replaceAll("[\\s-]+", "_");
        try {
            return RefundReason.valueOf(upper);
        } catch (IllegalArgumentException e) {
            if (reason.toLowerCase().contains("cancel")) return RefundReason.PATIENT_CANCELLED_WITHIN_POLICY;
            if (reason.toLowerCase().contains("doctor")) return RefundReason.DOCTOR_CANCELLED;
            return RefundReason.OTHER;
        }
    }
}