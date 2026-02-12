package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
    private final MomoClient momoClient;
    private final UserRepository userRepository;
    private final InvoiceService invoiceService;
    private final InvoiceDeliveryService invoiceDeliveryService;
    private final InvoiceRepository invoiceRepository;
    private final AuditLogRepository auditLogRepository;
    private final SecurityEventRepository securityEventRepository;

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

        // Check if payment already exists for this appointment
        if (paymentRepository.existsByAppointmentId(dto.getAppointmentId())) {
            throw new DuplicateResourceException("Payment already exists for appointment: " + dto.getAppointmentId());
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

        return mapToDTO(payment);
    }

    @Override
    @Transactional
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

        // Validate payment method
        if (!"MOMO".equals(payment.getPaymentMethod())) {
            throw new BadRequestException("Payment method must be MOMO to initialize MoMo payment");
        }

        // Validate payment status
        if ("PAID".equals(payment.getPaymentStatus()) || "CANCELLED".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Cannot initialize payment with status: " + payment.getPaymentStatus());
        }

        // Build order info (simple, no special characters)
        String orderInfo = dto.getOrderInfo() != null
                ? dto.getOrderInfo()
                : "Thanh toan " + payment.getPaymentCode();

        // Generate MoMo order ID
        // For refresh, append timestamp to ensure uniqueness (MoMo rejects duplicate orderIds)
        String orderId = isRefresh 
                ? payment.getPaymentCode() + "-R" + System.currentTimeMillis()
                : payment.getPaymentCode();

        // Call MoMo API to create payment order
        MomoClient.MomoPaymentResponse momoResponse = momoClient.createPaymentOrder(
                orderId,
                payment.getTotalAmount().longValue(),
                orderInfo,
                ""
        );
        
        String payUrl = momoResponse.payUrl;
        
        // Generate QR code image URL from payUrl
        // Using QR code generation service (e.g., QR Server API)
        String qrCodeUrl = generateQrCodeUrl(payUrl);

        // Update payment status
        payment.setPaymentStatus("INITIATED");
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

        // Validate payment method
        if (!"CASH".equals(payment.getPaymentMethod())) {
            throw new BadRequestException("This method is only for CASH payments");
        }

        // Validate status
        if ("PAID".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Payment is already paid");
        }

        if ("CANCELLED".equals(payment.getPaymentStatus())) {
            throw new BadRequestException("Cannot mark cancelled payment as paid");
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

        // Auto-send invoice notification via email/SMS
        invoiceDeliveryService.autoSendInvoiceOnPaymentSuccess(payment.getId());

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

        log.info("Payment cancelled: {}", paymentId);
        return mapToDTO(payment);
    }

    @Override
    public PaymentDTO handleMomoWebhook(MomoWebhookDTO webhookDto) {
        log.info("Handling MoMo webhook for orderId: {}, resultCode: {}",
                webhookDto.getOrderId(), webhookDto.getResultCode());

        // Find payment by order ID (payment code)
        Payment payment = paymentRepository.findByPaymentCode(webhookDto.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", webhookDto.getOrderId()));

        // TODO: Verify webhook signature
        // if (!verifyMomoSignature(webhookDto)) {
        //     throw new BadRequestException("Invalid webhook signature");
        // }

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
        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        payment.setPaymentStatus("PAID");
        payment.setPaidAt(LocalDateTime.now());
        payment.setTransactionId(transactionId);
        return paymentRepository.save(payment);
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
        return paymentRepository.save(payment);
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
        return paymentRepository.save(payment);
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
     * Generate QR code image URL from MoMo deeplink
     * Uses QR Server API to generate QR code image
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

    private PaymentDTO mapToDTO(Payment payment) {
        PaymentDTO dto = PaymentDTO.builder()
                .id(payment.getId())
                .paymentCode(payment.getPaymentCode())
                .appointmentId(payment.getAppointment().getId())
                .appointmentCode("APT-" + payment.getAppointment().getId())
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
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();

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
    public org.springframework.data.domain.Page<PaymentDTO> getMyPayments(
            Long patientId,
            String status,
            String method,
            String from,
            String to,
            int pageNumber,
            int pageSize) {

        log.info("Getting payments for patient ID: {}, status: {}, method: {}", patientId, status, method);

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
                paymentRepository.findByPatientIdWithFilters(
                        patientId, status, method, fromDate, toDate, pageable);

        // Map to DTOs
        return payments.map(this::mapToDTO);
    }

    @Override
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

        return mapToDTO(payment);
    }

    @Override
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
        Payment saved = paymentRepository.save(payment);

        // Update associated invoice status
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

        // Create audit log
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

            AuditLog auditLog = AuditLog.builder()
                    .action("PAYMENT_REFUND")
                    .entityType("Payment")
                    .entityId(paymentId)
                    .user(adminUser)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .newValues(details)
                    .createdAt(LocalDateTime.now())
                    .build();
            auditLogRepository.save(auditLog);
            log.info("Created audit log for refund: {}", auditLog.getId());
        } catch (Exception e) {
            log.warn("Could not create audit log: {}", e.getMessage());
        }

        // Create security event
        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("paymentId", paymentId);
            metadata.put("refundAmount", refundAmount.toString());
            metadata.put("paymentMethod", payment.getPaymentMethod());
            metadata.put("newStatus", newStatus);

            SecurityEvent securityEvent = SecurityEvent.builder()
                    .eventType("PAYMENT_REFUND")
                    .severity("MEDIUM")
                    .user(adminUser)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .metadata(metadata)
                    .createdAt(LocalDateTime.now())
                    .build();
            securityEventRepository.save(securityEvent);
            log.info("Created security event for refund: {}", securityEvent.getId());
        } catch (Exception e) {
            log.warn("Could not create security event: {}", e.getMessage());
        }

        // Auto-send refund notification via email/SMS
        invoiceDeliveryService.autoSendRefundNotification(saved.getId());

        log.info("Refund processed successfully for payment: {} (amount: {}, newStatus: {})",
                paymentId, refundAmount, newStatus);
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
        payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "\n" : "")
                + "Admin Cancel Reason: " + dto.getReason());

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
        // TODO: Implement actual MoMo refund API call
        // https://developers.momo.vn/v3/docs/payment/api/refund/

        log.info("Mock MoMo refund: payment={}, amount={}", payment.getId(), dto.getRefundAmount());

        // Mock refund transaction ID
        String refundTransId = "REFUND-" + System.currentTimeMillis();

        // In real implementation:
        // 1. Call MoMo refund API with payment.getTransactionId()
        // 2. Verify signature
        // 3. Handle response
        // 4. Return refund transaction ID

        return refundTransId;
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
}