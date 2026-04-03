package com.q2k.meditech.service;

import com.q2k.meditech.dto.FinalInvoiceDTO;
import com.q2k.meditech.dto.FinalInvoiceItemDTO;
import com.q2k.meditech.dto.InvoiceDTO;
import com.q2k.meditech.dto.InvoiceItemDTO;
import com.q2k.meditech.dto.InvoiceUpdateDTO;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Invoice Service Implementation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final AppointmentRepository appointmentRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final PrescriptionRepository prescriptionRepository;

    @Override
    @Transactional
    public InvoiceDTO createInvoiceForPayment(Long paymentId) {
        log.info("Creating invoice for payment ID: {}", paymentId);

        // Validate paymentId is not null
        if (paymentId == null) {
            throw new ResourceNotFoundException("Payment", "id", null);
        }

        // Check if invoice already exists - return existing instead of throwing exception
        Invoice existingInvoice = invoiceRepository.findByPaymentIdWithDetails(paymentId).orElse(null);
        if (existingInvoice != null) {
            log.info("Invoice already exists for payment: {}, returning existing invoice: {}", 
                    paymentId, existingInvoice.getInvoiceNumber());
            return mapToDTO(existingInvoice);
        }

        // Get payment
        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        // Create invoice
        Invoice invoice = Invoice.builder()
                .invoiceNumber(generateInvoiceNumber())
                .payment(payment)
                .patient(payment.getPatient())
                .invoiceDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .subtotal(payment.getAmount())
                .discount(payment.getDiscountAmount())
                .tax(payment.getTaxAmount())
                .total(payment.getTotalAmount())
                .status("PAID") // Already paid if invoice is being created
                .build();

        invoice = invoiceRepository.save(invoice);

        // Create invoice item for consultation
        InvoiceItem item = InvoiceItem.builder()
                .invoice(invoice)
                .description("Medical Consultation - Appointment #" + payment.getAppointment().getId())
                .quantity(1)
                .unitPrice(payment.getAmount())
                .totalPrice(payment.getAmount())
                .build();

        invoice.getItems().add(item);
        invoice = invoiceRepository.save(invoice);

        log.info("Invoice created with number: {}", invoice.getInvoiceNumber());

        return mapToDTO(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDTO getInvoiceByPaymentId(Long paymentId) {
        log.info("Getting invoice by payment ID: {}", paymentId);

        // Validate paymentId is not null
        if (paymentId == null) {
            throw new ResourceNotFoundException("Payment", "id", null);
        }

        Invoice invoice = invoiceRepository.findByPaymentIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for payment: " + paymentId));

        return mapToDTO(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDTO getInvoiceById(Long invoiceId) {
        log.info("Getting invoice by ID: {}", invoiceId);

        // Validate invoiceId is not null
        if (invoiceId == null) {
            throw new ResourceNotFoundException("Invoice", "id", null);
        }

        Invoice invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        return mapToDTO(invoice);
    }

    // ========== HELPER METHODS ==========

    private String generateInvoiceNumber() {
        LocalDateTime now = LocalDateTime.now();
        String datePart = String.format("%04d%02d%02d", now.getYear(), now.getMonthValue(), now.getDayOfMonth());
        int randomPart = (int) (Math.random() * 90000) + 10000;
        return "INV-" + datePart + "-" + randomPart;
    }

    private InvoiceDTO mapToDTO(Invoice invoice) {
        InvoiceDTO dto = InvoiceDTO.builder()
                .id(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .paymentId(invoice.getPayment().getId())
                .paymentCode(invoice.getPayment().getPaymentCode())
                .patientId(invoice.getPatient().getId())
                .patientName(invoice.getPatient().getUser() != null ? invoice.getPatient().getUser().getFullName() : "Unknown")
                .invoiceDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())
                .subtotal(invoice.getSubtotal())
                .discount(invoice.getDiscount())
                .tax(invoice.getTax())
                .total(invoice.getTotal())
                .status(invoice.getStatus())
                .notes(invoice.getNotes())
                .createdAt(invoice.getCreatedAt())
                .items(invoice.getItems() != null
                        ? invoice.getItems().stream().map(this::mapItemToDTO).collect(Collectors.toList())
                        : new ArrayList<>())
                .build();

        return dto;
    }

    private InvoiceItemDTO mapItemToDTO(InvoiceItem item) {
        return InvoiceItemDTO.builder()
                .id(item.getId())
                .description(item.getDescription())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .totalPrice(item.getTotalPrice())
                .build();
    }

    // ========== PATIENT METHODS ==========

    @Override
    @Transactional(readOnly = true)
    public InvoiceDTO getInvoiceByPaymentIdForPatient(Long paymentId, Long patientId) {
        log.info("Getting invoice for payment ID: {} for patient ID: {}", paymentId, patientId);

        // Validate parameters
        if (paymentId == null) {
            throw new ResourceNotFoundException("Payment", "id", null);
        }
        if (patientId == null) {
            throw new BadRequestException("Patient ID cannot be null");
        }

        Invoice invoice = invoiceRepository.findByPaymentIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for payment: " + paymentId));

        // Check ownership
        if (!invoice.getPatient().getId().equals(patientId)) {
            throw new BadRequestException("You can only view your own invoices");
        }

        return mapToDTO(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDTO getInvoiceByIdForPatient(Long invoiceId, Long patientId) {
        log.info("Getting invoice ID: {} for patient ID: {}", invoiceId, patientId);

        // Validate parameters
        if (invoiceId == null) {
            throw new ResourceNotFoundException("Invoice", "id", null);
        }
        if (patientId == null) {
            throw new BadRequestException("Patient ID cannot be null");
        }

        Invoice invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        // Check ownership
        if (!invoice.getPatient().getId().equals(patientId)) {
            throw new BadRequestException("You can only view your own invoices");
        }

        return mapToDTO(invoice);
    }
    // ========== ADMIN METHODS ==========

    @Override
    @Transactional
    public InvoiceDTO updateInvoice(Long invoiceId, InvoiceUpdateDTO dto, Long currentUserId) {
        log.info("Admin updating invoice ID: {}", invoiceId);

        // Validate invoiceId is not null
        if (invoiceId == null) {
            throw new ResourceNotFoundException("Invoice", "id", null);
        }

        Invoice invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        // Update fields if provided
        if (dto.getNotes() != null) {
            invoice.setNotes(dto.getNotes());
        }

        if (dto.getDueDate() != null) {
            invoice.setDueDate(dto.getDueDate());
        }

        if (dto.getStatus() != null) {
            // Validate status
            if (!dto.getStatus().matches("PAID|UNPAID|OVERDUE|CANCELLED")) {
                throw new BadRequestException("Invalid invoice status: " + dto.getStatus());
            }
            invoice.setStatus(dto.getStatus());
        }

        Invoice saved = invoiceRepository.save(invoice);

        log.info("Invoice updated successfully: {}", invoiceId);
        return mapToDTO(saved);
    }

    // ========== FINAL INVOICE ==========

    @Override
    @Transactional(readOnly = true)
    public FinalInvoiceDTO getFinalInvoice(Long appointmentId, Long patientId) {
        log.info("Generating final invoice for appointment ID: {} patient ID: {}", appointmentId, patientId);

        if (appointmentId == null) {
            throw new BadRequestException("Appointment ID is required");
        }

        // 1. Fetch appointment with details
        Appointment appointment = appointmentRepository.findByIdWithDetails(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        // 2. Ownership check
        if (patientId != null && !appointment.getPatient().getId().equals(patientId)) {
            throw new BadRequestException("You can only view invoices for your own appointments");
        }

        // 3. Must be COMPLETED
        if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
            throw new BadRequestException("Final invoice is only available for completed appointments");
        }

        Patient patient = appointment.getPatient();
        User patientUser = patient.getUser();
        Doctor doctor = appointment.getDoctor();
        User doctorUser = doctor.getUser();

        // 4. Consultation fee — from appointment payment
        List<FinalInvoiceItemDTO> consultationItems = new ArrayList<>();
        BigDecimal consultationTotal = BigDecimal.ZERO;
        boolean consultationPaid = false;

        Optional<Payment> appointmentPayment = paymentRepository.findByAppointmentIdWithDetails(appointmentId);
        if (appointmentPayment.isPresent()) {
            Payment pay = appointmentPayment.get();
            BigDecimal fee = pay.getAmount() != null ? pay.getAmount() : BigDecimal.ZERO;
            consultationItems.add(FinalInvoiceItemDTO.builder()
                    .category("CONSULTATION")
                    .description("Medical Consultation - " + (doctor.getUser().getFullName() != null ? doctor.getUser().getFullName() : "Doctor"))
                    .quantity(1)
                    .unitPrice(fee)
                    .totalPrice(fee)
                    .detail(getSpecialtyName(doctor))
                    .build());
            consultationTotal = fee;
            consultationPaid = "PAID".equalsIgnoreCase(pay.getPaymentStatus());
        }

        // 5. Service orders
        List<FinalInvoiceItemDTO> serviceItems = new ArrayList<>();
        BigDecimal servicesTotal = BigDecimal.ZERO;
        boolean allServicesPaid = true;
        boolean hasServices = false;

        List<ServiceOrder> serviceOrders = serviceOrderRepository.findByAppointmentIdOrderByOrderedAtDesc(appointmentId);
        for (ServiceOrder so : serviceOrders) {
            hasServices = true;
            BigDecimal price = so.getPrice() != null ? so.getPrice() : BigDecimal.ZERO;
            serviceItems.add(FinalInvoiceItemDTO.builder()
                    .category("SERVICE")
                    .description(so.getServiceName())
                    .quantity(1)
                    .unitPrice(price)
                    .totalPrice(price)
                    .detail(so.getCategory() != null ? so.getCategory().name() : null)
                    .build());
            servicesTotal = servicesTotal.add(price);
            if (!"PAID".equalsIgnoreCase(so.getPaymentStatus())) {
                allServicesPaid = false;
            }
        }

        // 6. Prescription medications
        List<FinalInvoiceItemDTO> medicationItems = new ArrayList<>();
        BigDecimal medicationsTotal = BigDecimal.ZERO;
        boolean prescriptionPaid = false;
        boolean hasPrescription = false;

        Optional<Prescription> prescriptionOpt = prescriptionRepository.findByAppointmentId(appointmentId);
        if (prescriptionOpt.isPresent()) {
            Prescription prescription = prescriptionOpt.get();
            // Need to fetch with items
            Prescription fullPrescription = prescriptionRepository.findByIdWithDetails(prescription.getId())
                    .orElse(prescription);

            hasPrescription = true;
            prescriptionPaid = "PAID".equalsIgnoreCase(fullPrescription.getPrescriptionPaymentStatus());

            if (fullPrescription.getItems() != null) {
                for (PrescriptionItem item : fullPrescription.getItems()) {
                    BigDecimal unitPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                    int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                    BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(qty));

                    String detail = "";
                    if (item.getDosage() != null) detail += item.getDosage();
                    if (item.getFrequency() != null) detail += (detail.isEmpty() ? "" : " - ") + item.getFrequency();
                    if (item.getDuration() != null) detail += (detail.isEmpty() ? "" : " - ") + item.getDuration();

                    medicationItems.add(FinalInvoiceItemDTO.builder()
                            .category("MEDICATION")
                            .description(item.getMedicineName())
                            .quantity(qty)
                            .unitPrice(unitPrice)
                            .totalPrice(lineTotal)
                            .detail(detail.isEmpty() ? null : detail)
                            .build());
                    medicationsTotal = medicationsTotal.add(lineTotal);
                }
            }
        }

        // 7. Compute totals
        BigDecimal subtotal = consultationTotal.add(servicesTotal).add(medicationsTotal);
        BigDecimal discount = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;
        // Accumulate discount/tax from payment if present
        if (appointmentPayment.isPresent()) {
            Payment pay = appointmentPayment.get();
            if (pay.getDiscountAmount() != null) discount = discount.add(pay.getDiscountAmount());
            if (pay.getTaxAmount() != null) tax = tax.add(pay.getTaxAmount());
        }
        BigDecimal grandTotal = subtotal.subtract(discount).add(tax);

        // 8. Determine payment status
        boolean allPaid = consultationPaid
                && (!hasServices || allServicesPaid)
                && (!hasPrescription || prescriptionPaid);
        boolean anyPaid = consultationPaid || (hasServices && serviceOrders.stream()
                .anyMatch(so -> "PAID".equalsIgnoreCase(so.getPaymentStatus())))
                || (hasPrescription && prescriptionPaid);

        String paymentStatus;
        if (allPaid) {
            paymentStatus = "ALL_PAID";
        } else if (anyPaid) {
            paymentStatus = "PARTIALLY_PAID";
        } else {
            paymentStatus = "UNPAID";
        }

        // 9. Generate a virtual invoice number
        String invoiceNumber = "FI-" + appointment.getAppointmentCode();

        return FinalInvoiceDTO.builder()
                .appointmentId(appointmentId)
                .appointmentCode(appointment.getAppointmentCode())
                .patientId(patient.getId())
                .patientName(patientUser != null ? patientUser.getFullName() : "Unknown")
                .patientEmail(patientUser != null ? patientUser.getEmail() : null)
                .patientPhone(patientUser != null ? patientUser.getPhone() : null)
                .doctorName(doctorUser != null ? doctorUser.getFullName() : "Unknown")
                .doctorSpecialty(getSpecialtyName(doctor))
                .invoiceDate(LocalDate.now())
                .invoiceNumber(invoiceNumber)
                .consultationItems(consultationItems)
                .serviceItems(serviceItems)
                .medicationItems(medicationItems)
                .consultationTotal(consultationTotal)
                .servicesTotal(servicesTotal)
                .medicationsTotal(medicationsTotal)
                .subtotal(subtotal)
                .discount(discount)
                .tax(tax)
                .grandTotal(grandTotal)
                .paymentStatus(paymentStatus)
                .invoiceReady(allPaid)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private String getSpecialtyName(Doctor doctor) {
        try {
            List<Specialty> specialties = doctor.getSpecialties();
            if (specialties != null && !specialties.isEmpty()) {
                return specialties.get(0).getName();
            }
        } catch (Exception e) {
            // lazy loading may fail in some contexts
        }
        return null;
    }
}