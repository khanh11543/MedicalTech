package com.q2k.meditech.controller;

import com.q2k.meditech.dto.ServiceOrderDTO;
import com.q2k.meditech.dto.ServiceResultDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.service.PatientProfileService;
import com.q2k.meditech.service.ServiceOrderService;
import com.q2k.meditech.service.ServiceResultService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Patient-facing read-only controller for viewing service orders and diagnostic results.
 */
@RestController
@RequestMapping("/patient/service-orders")
@RequiredArgsConstructor
public class PatientServiceOrderController {

    private final ServiceOrderService serviceOrderService;
    private final ServiceResultService serviceResultService;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final PatientProfileService patientProfileService;

    /**
     * Service orders that still require payment (all appointments for the logged-in patient).
     * GET /api/patient/service-orders/pending-payment
     */
    @GetMapping("/pending-payment")
    public ResponseEntity<List<ServiceOrderDTO>> getMyPendingPaymentServiceOrders() {
        Long userId = SecurityUtil.getCurrentUserId();
        Long patientId = patientProfileService.getOrCreatePatientForUser(userId).getId();
        List<ServiceOrderDTO> orders = serviceOrderService.getPendingPaymentServiceOrdersForPatient(patientId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get all service orders with results for a patient's appointment.
     * GET /api/patient/service-orders/appointment/{appointmentId}
     */
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<Map<String, Object>> getServiceOrdersWithResults(
            @PathVariable Long appointmentId) {

        // Verify current user owns this appointment
        Long userId = SecurityUtil.getCurrentUserId();
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found"));

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found"));

        if (!appointment.getPatient().getId().equals(patient.getId())) {
            return ResponseEntity.status(403).build();
        }

        List<ServiceOrderDTO> orders = serviceOrderService.getServiceOrdersByAppointment(appointmentId);

        List<Map<String, Object>> items = orders.stream()
                .filter(o -> !"CANCELLED".equals(o.getStatus()))
                .map(order -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("serviceOrder", order);
                    try {
                        ServiceResultDTO result = serviceResultService.getResultByServiceOrderId(order.getId());
                        item.put("result", result);
                    } catch (Exception e) {
                        item.put("result", null);
                    }
                    return item;
                })
                .toList();

        long completed = orders.stream().filter(o -> "COMPLETED".equals(o.getStatus())).count();
        long total = orders.stream().filter(o -> !"CANCELLED".equals(o.getStatus())).count();

        return ResponseEntity.ok(Map.of(
                "appointmentId", appointmentId,
                "items", items,
                "completedCount", completed,
                "totalCount", total
        ));
    }
}
