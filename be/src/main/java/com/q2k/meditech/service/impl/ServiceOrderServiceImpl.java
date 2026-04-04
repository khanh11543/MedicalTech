package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.ServiceOrderCreateDTO;
import com.q2k.meditech.dto.ServiceOrderDTO;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.*;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.service.ServiceOrderService;
import com.q2k.meditech.service.ServiceOrderAuditLogService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceOrderServiceImpl implements ServiceOrderService {

    /** Fallback mapping from ServiceCategory enum → Specialty name */
    private static final Map<String, String> CATEGORY_TO_DEPARTMENT = Map.of(
            "DIAGNOSTIC_IMAGING", "Radiology",
            "LABORATORY", "Laboratory",
            "ULTRASOUND", "Ultrasound",
            "CARDIOLOGY_TEST", "Cardiology",
            "PATHOLOGY", "Pathology",
            "ENDOSCOPY", "Endoscopy"
    );

    private final ServiceOrderRepository serviceOrderRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationRepository consultationRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final MedicalServiceRepository medicalServiceRepository;
    private final SpecialtyRepository specialtyRepository;
    private final ServiceOrderAuditLogService soAuditLogService;

    @Override
    @Transactional
    public ServiceOrderDTO createServiceOrder(Long appointmentId, ServiceOrderCreateDTO dto) {
        log.debug("Creating service order for appointment ID: {}", appointmentId);

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found: " + appointmentId));

        Consultation consultation = consultationRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("No consultation found for appointment: " + appointmentId));

        Long currentUserId = SecurityUtil.getCurrentUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Current user not found"));

        Doctor doctor = doctorRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Doctor profile not found for user: " + currentUserId));

        ServiceCategory category;
        try {
            category = ServiceCategory.valueOf(dto.getCategory());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid service category: " + dto.getCategory());
        }

        ServicePriority priority = ServicePriority.ROUTINE;
        if (dto.getPriority() != null && !dto.getPriority().isBlank()) {
            try {
                priority = ServicePriority.valueOf(dto.getPriority());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid priority '{}', defaulting to ROUTINE", dto.getPriority());
            }
        }

        // Resolve specialty from catalog if medicalServiceId provided
        Specialty specialty = null;
        MedicalService catalogService = null;
        if (dto.getMedicalServiceId() != null) {
            catalogService = medicalServiceRepository.findById(dto.getMedicalServiceId())
                    .orElse(null);
            if (catalogService != null) {
                specialty = catalogService.getSpecialty();
            }
        }
        // Fallback: derive specialty from category name
        if (specialty == null) {
            String deptName = CATEGORY_TO_DEPARTMENT.getOrDefault(category.name(), category.name());
            specialty = specialtyRepository.findByNameIgnoreCase(deptName).orElse(null);
        }

        ServiceOrder order = ServiceOrder.builder()
                .consultation(consultation)
                .appointment(appointment)
                .orderedByDoctor(doctor)
                .serviceName(dto.getServiceName())
                .category(category)
                .medicalService(catalogService)
                .specialty(specialty)
                .price(dto.getPrice())
                .priority(priority)
                .notes(dto.getNotes())
                .status(ServiceOrderStatus.PENDING_PAYMENT)
                .orderedAt(LocalDateTime.now())
                .build();

        ServiceOrder saved = serviceOrderRepository.save(order);

        // Update consultation status to AWAITING_RESULTS if currently DRAFT
        if (ConsultationStatus.DRAFT.equals(consultation.getStatus())) {
            consultation.setStatus(ConsultationStatus.AWAITING_RESULTS);
            consultationRepository.save(consultation);
        }

        // Update appointment status to AWAITING_SERVICE_RESULTS if currently IN_PROGRESS
        if (AppointmentStatus.IN_PROGRESS.equals(appointment.getStatus())) {
            appointment.setStatus(AppointmentStatus.AWAITING_SERVICE_RESULTS);
            appointmentRepository.save(appointment);
        }

        log.info("Created service order ID: {} for appointment ID: {}", saved.getId(), appointmentId);

        // Audit log
        String patientName = null;
        Long patientId = null;
        try {
            if (appointment.getPatient() != null && appointment.getPatient().getUser() != null) {
                patientName = appointment.getPatient().getUser().getFullName();
                patientId = appointment.getPatient().getId();
            }
        } catch (Exception ignored) {}
        soAuditLogService.logEvent(
                ServiceOrderAuditLogService.event("SERVICE_ORDER_CREATED")
                        .appointment(appointmentId)
                        .consultation(consultation.getId())
                        .patient(patientId, patientName)
                        .serviceOrder(saved.getId())
                        .summary("Doctor " + doctor.getFullName() + " ordered " + dto.getServiceName())
                        .after(Map.of("serviceName", dto.getServiceName(), "category", dto.getCategory(),
                                      "price", dto.getPrice() != null ? dto.getPrice() : "", "status", "PENDING_PAYMENT"))
        );

        return toDTO(saved, doctor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceOrderDTO> getServiceOrdersByAppointment(Long appointmentId) {
        log.debug("Fetching service orders for appointment ID: {}", appointmentId);
        return serviceOrderRepository.findByAppointmentIdOrderByOrderedAtDesc(appointmentId)
                .stream()
                .map(order -> toDTO(order, order.getOrderedByDoctor()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ServiceOrderDTO cancelServiceOrder(Long serviceOrderId) {
        log.debug("Cancelling service order ID: {}", serviceOrderId);

        ServiceOrder order = serviceOrderRepository.findById(serviceOrderId)
                .orElseThrow(() -> new EntityNotFoundException("Service order not found: " + serviceOrderId));

        if (order.getStatus() != ServiceOrderStatus.ORDERED
            && order.getStatus() != ServiceOrderStatus.PENDING_PAYMENT) {
            throw new IllegalStateException("Can only cancel ORDERED or PENDING_PAYMENT service orders. Current: " + order.getStatus());
        }

        String beforeStatus = order.getStatus().name();
        order.setStatus(ServiceOrderStatus.CANCELLED);
        ServiceOrder updated = serviceOrderRepository.save(order);

        // Check if all service orders are done → revert consultation/appointment status
        revertStatusesIfAllDone(order.getAppointment().getId());

        // Audit log
        String patName = null; Long patId = null;
        try {
            if (order.getAppointment().getPatient() != null && order.getAppointment().getPatient().getUser() != null) {
                patName = order.getAppointment().getPatient().getUser().getFullName();
                patId = order.getAppointment().getPatient().getId();
            }
        } catch (Exception ignored) {}
        soAuditLogService.logEvent(
                ServiceOrderAuditLogService.event("SERVICE_ORDER_CANCELLED")
                        .appointment(order.getAppointment().getId())
                        .consultation(order.getConsultation().getId())
                        .patient(patId, patName)
                        .serviceOrder(serviceOrderId)
                        .summary("Service order " + order.getServiceName() + " cancelled (was " + beforeStatus + ")")
                        .before(Map.of("status", beforeStatus))
                        .after(Map.of("status", "CANCELLED"))
        );

        return toDTO(updated, order.getOrderedByDoctor());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPendingServiceOrders(Long appointmentId) {
        List<ServiceOrderStatus> pendingStatuses = List.of(
                ServiceOrderStatus.ORDERED,
                ServiceOrderStatus.PENDING_PAYMENT,
                ServiceOrderStatus.PAID,
                ServiceOrderStatus.IN_PROGRESS
        );
        return serviceOrderRepository.existsByAppointmentIdAndStatusIn(appointmentId, pendingStatuses);
    }

    @Override
    @Transactional
    public ServiceOrderDTO collectPayment(Long serviceOrderId, String paymentMethod, Long currentUserId) {
        log.info("Collecting payment for service order ID: {}, method: {}, by user: {}",
                serviceOrderId, paymentMethod, currentUserId);

        if (!"CASH".equals(paymentMethod) && !"MOMO".equals(paymentMethod)) {
            throw new IllegalArgumentException("Payment method must be CASH or MOMO");
        }

        ServiceOrder order = serviceOrderRepository.findById(serviceOrderId)
                .orElseThrow(() -> new EntityNotFoundException("Service order not found: " + serviceOrderId));

        if (order.getStatus() != ServiceOrderStatus.PENDING_PAYMENT
                && order.getStatus() != ServiceOrderStatus.ORDERED) {
            throw new IllegalStateException(
                    "Can only collect payment for ORDERED or PENDING_PAYMENT orders. Current: " + order.getStatus());
        }

        User paidByUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + currentUserId));

        order.setStatus(ServiceOrderStatus.PAID);
        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus("PAID");
        order.setPaidAt(LocalDateTime.now());
        order.setPaidBy(paidByUser);

        ServiceOrder updated = serviceOrderRepository.save(order);
        log.info("Payment collected for service order ID: {}", updated.getId());

        // Audit log
        String cashierName = paidByUser.getFullName();
        String pName = null; Long pId = null;
        try {
            if (order.getAppointment().getPatient() != null && order.getAppointment().getPatient().getUser() != null) {
                pName = order.getAppointment().getPatient().getUser().getFullName();
                pId = order.getAppointment().getPatient().getId();
            }
        } catch (Exception ignored) {}
        soAuditLogService.logEvent(
                ServiceOrderAuditLogService.event("SERVICE_PAYMENT_COLLECTED")
                        .appointment(order.getAppointment().getId())
                        .consultation(order.getConsultation().getId())
                        .patient(pId, pName)
                        .serviceOrder(serviceOrderId)
                        .summary("Cashier " + cashierName + " collected " + paymentMethod + " payment for " + order.getServiceName())
                        .before(Map.of("status", "PENDING_PAYMENT", "paymentStatus", "UNPAID"))
                        .after(Map.of("status", "PAID", "paymentMethod", paymentMethod, "paymentStatus", "PAID"))
        );

        return toDTO(updated, order.getOrderedByDoctor());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceOrderDTO> getPendingPaymentOrders(Long appointmentId) {
        log.debug("Fetching pending payment service orders for appointment ID: {}", appointmentId);
        List<ServiceOrderStatus> pendingPaymentStatuses = List.of(
                ServiceOrderStatus.ORDERED,
                ServiceOrderStatus.PENDING_PAYMENT
        );
        return serviceOrderRepository.findByAppointmentIdAndStatusIn(appointmentId, pendingPaymentStatuses)
                .stream()
                .map(order -> toDTO(order, order.getOrderedByDoctor()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ServiceOrderDTO> getPendingPaymentServiceOrdersForPatient(Long patientId) {
        List<ServiceOrderStatus> pendingPaymentStatuses = List.of(
                ServiceOrderStatus.ORDERED,
                ServiceOrderStatus.PENDING_PAYMENT
        );
        return serviceOrderRepository.findByPatientIdAndStatusIn(patientId, pendingPaymentStatuses)
                .stream()
                .map(order -> toDTO(order, order.getOrderedByDoctor()))
                .collect(Collectors.toList());
    }

    private void revertStatusesIfAllDone(Long appointmentId) {
        if (!hasPendingServiceOrders(appointmentId)) {
            // All orders completed or cancelled → consultation can be finalized
            consultationRepository.findByAppointmentId(appointmentId).ifPresent(consultation -> {
                if (ConsultationStatus.AWAITING_RESULTS.equals(consultation.getStatus())) {
                    // Check if any orders actually completed (vs all cancelled)
                    long completedCount = serviceOrderRepository.countByAppointmentIdAndStatusIn(
                            appointmentId, List.of(ServiceOrderStatus.COMPLETED));
                    if (completedCount > 0) {
                        consultation.setStatus(ConsultationStatus.READY_TO_FINALIZE);
                    } else {
                        // All cancelled, no results to review → back to DRAFT
                        consultation.setStatus(ConsultationStatus.DRAFT);
                    }
                    consultationRepository.save(consultation);
                }
            });

            appointmentRepository.findById(appointmentId).ifPresent(appointment -> {
                if (AppointmentStatus.AWAITING_SERVICE_RESULTS.equals(appointment.getStatus())) {
                    appointment.setStatus(AppointmentStatus.IN_PROGRESS);
                    appointmentRepository.save(appointment);
                }
            });
        }
    }

    private ServiceOrderDTO toDTO(ServiceOrder order, Doctor doctor) {
        String doctorName = "Unknown";
        if (doctor != null && doctor.getUser() != null) {
            doctorName = doctor.getUser().getFullName();
        }

        String paidByName = null;
        if (order.getPaidBy() != null) {
            paidByName = order.getPaidBy().getFullName();
        }

        String assignedDoctorName = null;
        Long assignedDoctorId = null;
        if (order.getAssignedDoctor() != null) {
            assignedDoctorId = order.getAssignedDoctor().getId();
            if (order.getAssignedDoctor().getUser() != null) {
                assignedDoctorName = order.getAssignedDoctor().getUser().getFullName();
            } else {
                assignedDoctorName = order.getAssignedDoctor().getFullName();
            }
        }

        String patientName = null;
        String appointmentCode = null;
        try {
            if (order.getAppointment() != null) {
                appointmentCode = order.getAppointment().getAppointmentCode();
                if (order.getAppointment().getPatient() != null
                        && order.getAppointment().getPatient().getUser() != null) {
                    patientName = order.getAppointment().getPatient().getUser().getFullName();
                }
            }
        } catch (Exception e) {
            // Lazy loading may fail in some contexts
        }

        return ServiceOrderDTO.builder()
                .id(order.getId())
                .consultationId(order.getConsultation().getId())
                .appointmentId(order.getAppointment().getId())
                .serviceName(order.getServiceName())
                .category(order.getCategory().name())
                .price(order.getPrice())
                .priority(order.getPriority().name())
                .notes(order.getNotes())
                .status(order.getStatus().name())
                .orderedAt(order.getOrderedAt())
                .orderedByDoctorName(doctorName)
                .targetDepartment(order.getSpecialty() != null ? order.getSpecialty().getName() : order.getCategory().name())
                .assignedDoctorId(assignedDoctorId)
                .assignedDoctorName(assignedDoctorName)
                .performedBy(order.getPerformedBy())
                .result(order.getResult())
                .completedAt(order.getCompletedAt())
                .serviceResultId(order.getServiceResult() != null ? order.getServiceResult().getId() : null)
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .paidAt(order.getPaidAt())
                .paidByName(paidByName)
                .patientName(patientName)
                .appointmentCode(appointmentCode)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
