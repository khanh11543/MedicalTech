package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.ServiceOrderStatus;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.ServiceOrderRepository;
import com.q2k.meditech.repository.ServiceResultRepository;
import com.q2k.meditech.service.ServiceResultService;
import com.q2k.meditech.service.ServiceOrderAuditLogService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for Department Service Worklist.
 * Allows department doctors (radiology, lab, etc.) to:
 * - View service orders assigned to their department
 * - Start (accept) a service
 * - Enter and submit results
 */
@RestController
@RequestMapping("/doctor/worklist")
@RequiredArgsConstructor
@Slf4j
public class DepartmentWorklistController {

    private final ServiceOrderRepository serviceOrderRepository;
    private final DoctorRepository doctorRepository;
    private final ServiceResultService serviceResultService;
    private final ServiceResultRepository serviceResultRepository;
    private final ServiceOrderAuditLogService soAuditLogService;

    /**
     * GET /api/doctor/worklist
     * Get all service orders for the current doctor's department
     */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<WorklistItemDTO>> getWorklist(
            @RequestParam(required = false) String status) {

        Doctor currentDoctor = getCurrentDoctor();
        List<Long> specialtyIds = currentDoctor.getSpecialties().stream()
                .map(Specialty::getId)
                .collect(Collectors.toList());

        if (specialtyIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<ServiceOrder> orders;
        if (status != null && !status.isBlank()) {
            List<ServiceOrderStatus> statuses = List.of(ServiceOrderStatus.valueOf(status));
            orders = serviceOrderRepository.findBySpecialtyIdInAndStatusIn(specialtyIds, statuses);
        } else {
            // Default: show PAID, IN_PROGRESS, COMPLETED
            List<ServiceOrderStatus> defaultStatuses = List.of(
                    ServiceOrderStatus.PAID,
                    ServiceOrderStatus.IN_PROGRESS,
                    ServiceOrderStatus.COMPLETED
            );
            orders = serviceOrderRepository.findBySpecialtyIdInAndStatusIn(specialtyIds, defaultStatuses);
        }

        List<WorklistItemDTO> items = orders.stream()
                .map(this::toWorklistItem)
                .collect(Collectors.toList());

        return ResponseEntity.ok(items);
    }

    /**
     * POST /api/doctor/worklist/{serviceOrderId}/start
     * Accept/start a service (PAID → IN_PROGRESS)
     */
    @PostMapping("/{serviceOrderId}/start")
    @Transactional
    public ResponseEntity<WorklistItemDTO> startService(@PathVariable Long serviceOrderId) {
        Doctor currentDoctor = getCurrentDoctor();

        ServiceOrder order = serviceOrderRepository.findById(serviceOrderId)
                .orElseThrow(() -> new EntityNotFoundException("Service order not found: " + serviceOrderId));

        // Validate status
        if (order.getStatus() != ServiceOrderStatus.PAID) {
            throw new IllegalStateException("Can only start PAID service orders. Current: " + order.getStatus());
        }

        // Validate specialty match — doctor must belong to the order's specialty
        boolean specialtyMatch = order.getSpecialty() != null
                && currentDoctor.getSpecialties().stream()
                        .anyMatch(s -> s.getId().equals(order.getSpecialty().getId()));
        if (!specialtyMatch) {
            throw new IllegalStateException("Service order specialty does not match your specialties");
        }

        // Assign and start
        order.setAssignedDoctor(currentDoctor);
        order.setStatus(ServiceOrderStatus.IN_PROGRESS);
        ServiceOrder saved = serviceOrderRepository.save(order);

        // Audit log
        String patientName = null; Long patientId = null;
        try {
            if (order.getAppointment().getPatient() != null && order.getAppointment().getPatient().getUser() != null) {
                patientName = order.getAppointment().getPatient().getUser().getFullName();
                patientId = order.getAppointment().getPatient().getId();
            }
        } catch (Exception ignored) {}
        soAuditLogService.logEvent(
                ServiceOrderAuditLogService.event("SERVICE_STARTED")
                        .appointment(order.getAppointment().getId())
                        .consultation(order.getConsultation().getId())
                        .patient(patientId, patientName)
                        .serviceOrder(serviceOrderId)
                        .summary("Dr. " + currentDoctor.getFullName() + " started service " + order.getServiceName())
                        .before(Map.of("status", "PAID"))
                        .after(Map.of("status", "IN_PROGRESS", "assignedDoctor", currentDoctor.getFullName()))
        );

        log.info("Doctor {} started service order {}", currentDoctor.getFullName(), serviceOrderId);
        return ResponseEntity.ok(toWorklistItem(saved));
    }

    /**
     * GET /api/doctor/worklist/{serviceOrderId}
     * Get a single service order detail
     */
    @GetMapping("/{serviceOrderId}")
    @Transactional(readOnly = true)
    public ResponseEntity<WorklistItemDTO> getServiceOrderDetail(@PathVariable Long serviceOrderId) {
        ServiceOrder order = serviceOrderRepository.findById(serviceOrderId)
                .orElseThrow(() -> new EntityNotFoundException("Service order not found: " + serviceOrderId));

        return ResponseEntity.ok(toWorklistItem(order));
    }

    /**
     * GET /api/doctor/worklist/{serviceOrderId}/result
     * Get the service result for a service order
     */
    @GetMapping("/{serviceOrderId}/result")
    public ResponseEntity<ServiceResultDTO> getResult(@PathVariable Long serviceOrderId) {
        ServiceResultDTO result = serviceResultService.getResultByServiceOrderId(serviceOrderId);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/doctor/worklist/{serviceOrderId}/result
     * Save or complete a service result
     */
    @PostMapping("/{serviceOrderId}/result")
    public ResponseEntity<ServiceResultDTO> saveResult(
            @PathVariable Long serviceOrderId,
            @RequestBody ServiceResultCreateDTO dto) {
        ServiceResultDTO result = serviceResultService.saveResult(serviceOrderId, dto);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/doctor/worklist/{serviceOrderId}/result/upload
     * Upload an attachment to the service result
     */
    @PostMapping("/{serviceOrderId}/result/upload")
    public ResponseEntity<ServiceResultDTO> uploadAttachment(
            @PathVariable Long serviceOrderId,
            @RequestParam("file") MultipartFile file) {
        ServiceResultDTO result = serviceResultService.uploadAttachment(serviceOrderId, file);
        return ResponseEntity.ok(result);
    }

    /**
     * DELETE /api/doctor/worklist/{serviceOrderId}/result/attachment/{attachmentId}
     * Delete an attachment from the service result
     */
    @DeleteMapping("/{serviceOrderId}/result/attachment/{attachmentId}")
    public ResponseEntity<Map<String, String>> deleteAttachment(
            @PathVariable Long serviceOrderId,
            @PathVariable Long attachmentId) {
        serviceResultService.deleteAttachment(serviceOrderId, attachmentId);
        return ResponseEntity.ok(Map.of("message", "Attachment deleted successfully"));
    }

    /**
     * GET /api/doctor/worklist/my-department
     * Get the current doctor's department info
     */
    @GetMapping("/my-department")
    public ResponseEntity<Map<String, Object>> getMyDepartment() {
        Doctor currentDoctor = getCurrentDoctor();
        List<String> specialtyNames = currentDoctor.getSpecialties().stream()
                .map(Specialty::getName)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of(
                "department", currentDoctor.getDepartment() != null ? currentDoctor.getDepartment() : "",
                "specialties", specialtyNames,
                "doctorName", currentDoctor.getFullName()
        ));
    }

    // ── Helpers ──

    private Doctor getCurrentDoctor() {
        Long currentUserId = SecurityUtil.getCurrentUserId();
        return doctorRepository.findByUserIdWithSpecialties(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Doctor profile not found"));
    }

    private WorklistItemDTO toWorklistItem(ServiceOrder order) {
        String orderedByName = "Unknown";
        if (order.getOrderedByDoctor() != null) {
            orderedByName = order.getOrderedByDoctor().getFullName();
        }

        String assignedDoctorName = null;
        Long assignedDoctorId = null;
        if (order.getAssignedDoctor() != null) {
            assignedDoctorId = order.getAssignedDoctor().getId();
            assignedDoctorName = order.getAssignedDoctor().getFullName();
        }

        String patientName = null;
        Long patientId = null;
        String appointmentCode = null;
        Long appointmentId = null;
        Long consultationId = null;

        try {
            if (order.getAppointment() != null) {
                appointmentId = order.getAppointment().getId();
                appointmentCode = order.getAppointment().getAppointmentCode();
                if (order.getAppointment().getPatient() != null) {
                    patientId = order.getAppointment().getPatient().getId();
                    if (order.getAppointment().getPatient().getUser() != null) {
                        patientName = order.getAppointment().getPatient().getUser().getFullName();
                    }
                }
            }
            if (order.getConsultation() != null) {
                consultationId = order.getConsultation().getId();
            }
        } catch (Exception e) {
            log.warn("Error fetching related data for order {}: {}", order.getId(), e.getMessage());
        }

        boolean hasResult = serviceResultRepository.existsByServiceOrderId(order.getId());

        return WorklistItemDTO.builder()
                .id(order.getId())
                .serviceName(order.getServiceName())
                .category(order.getCategory() != null ? order.getCategory().name() : null)
                .targetDepartment(order.getSpecialty() != null ? order.getSpecialty().getName() : (order.getCategory() != null ? order.getCategory().name() : null))
                .price(order.getPrice())
                .priority(order.getPriority() != null ? order.getPriority().name() : null)
                .notes(order.getNotes())
                .status(order.getStatus().name())
                .orderedAt(order.getOrderedAt())
                .orderedByDoctorName(orderedByName)
                .assignedDoctorId(assignedDoctorId)
                .assignedDoctorName(assignedDoctorName)
                .patientName(patientName)
                .patientId(patientId)
                .appointmentCode(appointmentCode)
                .appointmentId(appointmentId)
                .consultationId(consultationId)
                .hasResult(hasResult)
                .completedAt(order.getCompletedAt())
                .build();
    }
}
