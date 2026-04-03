package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MedicalServiceDTO;
import com.q2k.meditech.dto.ServiceOrderCreateDTO;
import com.q2k.meditech.dto.ServiceOrderDTO;
import com.q2k.meditech.dto.ServiceResultDTO;
import com.q2k.meditech.service.MedicalServiceService;
import com.q2k.meditech.service.ServiceOrderAuditLogService;
import com.q2k.meditech.service.ServiceOrderService;
import com.q2k.meditech.service.ServiceResultService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller for Doctor service order operations.
 * Allows doctors to order additional services (lab, imaging, etc.) during consultation.
 */
@RestController
@RequestMapping("/doctor/service-orders")
@RequiredArgsConstructor
public class DoctorServiceOrderController {

    private final ServiceOrderService serviceOrderService;
    private final MedicalServiceService medicalServiceService;
    private final ServiceResultService serviceResultService;
    private final ServiceOrderAuditLogService soAuditLogService;

    /**
     * Get all active medical services from catalog
     * GET /api/doctor/service-orders/catalog
     */
    @GetMapping("/catalog")
    public ResponseEntity<List<MedicalServiceDTO>> getServiceCatalog(
            @RequestParam(required = false) String category) {
        List<MedicalServiceDTO> services = (category != null && !category.isEmpty())
                ? medicalServiceService.getServicesByCategory(category)
                : medicalServiceService.getAllActiveServices();
        return ResponseEntity.ok(services);
    }

    /**
     * Get all service orders for an appointment
     * GET /api/doctor/service-orders/appointment/{appointmentId}
     */
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<List<ServiceOrderDTO>> getServiceOrders(@PathVariable Long appointmentId) {
        List<ServiceOrderDTO> orders = serviceOrderService.getServiceOrdersByAppointment(appointmentId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Create a new service order for an appointment
     * POST /api/doctor/service-orders/appointment/{appointmentId}
     */
    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<ServiceOrderDTO> createServiceOrder(
            @PathVariable Long appointmentId,
            @Valid @RequestBody ServiceOrderCreateDTO dto) {
        ServiceOrderDTO created = serviceOrderService.createServiceOrder(appointmentId, dto);
        return ResponseEntity.ok(created);
    }

    /**
     * Cancel a service order
     * PATCH /api/doctor/service-orders/{id}/cancel
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ServiceOrderDTO> cancelServiceOrder(@PathVariable Long id) {
        ServiceOrderDTO cancelled = serviceOrderService.cancelServiceOrder(id);
        return ResponseEntity.ok(cancelled);
    }

    /**
     * Check if there are pending service orders blocking finalization
     * GET /api/doctor/service-orders/appointment/{appointmentId}/has-pending
     */
    @GetMapping("/appointment/{appointmentId}/has-pending")
    public ResponseEntity<Map<String, Boolean>> hasPending(@PathVariable Long appointmentId) {
        boolean pending = serviceOrderService.hasPendingServiceOrders(appointmentId);
        return ResponseEntity.ok(Map.of("hasPending", pending));
    }

    /**
     * View the service result (read-only for principal doctor)
     * GET /api/doctor/service-orders/{id}/result
     */
    @GetMapping("/{id}/result")
    public ResponseEntity<ServiceResultDTO> getServiceResult(@PathVariable Long id) {
        ServiceResultDTO result = serviceResultService.getResultByServiceOrderId(id);

        // Audit log — doctor viewed result
        try {
            soAuditLogService.logEvent(
                    ServiceOrderAuditLogService.event("SERVICE_RESULT_VIEWED")
                            .serviceOrder(id)
                            .serviceResult(result.getId())
                            .summary("Principal doctor viewed result for service order #" + id)
            );
        } catch (Exception ignored) {}

        return ResponseEntity.ok(result);
    }

    /**
     * Get all service orders with their results for an appointment (comprehensive view)
     * GET /api/doctor/service-orders/appointment/{appointmentId}/with-results
     */
    @GetMapping("/appointment/{appointmentId}/with-results")
    public ResponseEntity<Map<String, Object>> getServiceOrdersWithResults(@PathVariable Long appointmentId) {
        List<ServiceOrderDTO> orders = serviceOrderService.getServiceOrdersByAppointment(appointmentId);
        
        // Map each order to include result if available
        List<Map<String, Object>> ordersWithResults = orders.stream()
                .map(order -> {
                    Map<String, Object> item = new java.util.LinkedHashMap<>();
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
        
        // Calculate summary
        long completed = orders.stream()
                .filter(o -> "COMPLETED".equals(o.getStatus()))
                .count();
        long pending = orders.stream()
                .filter(o -> !o.getStatus().equals("COMPLETED") && !o.getStatus().equals("CANCELLED"))
                .count();
        
        return ResponseEntity.ok(Map.of(
                "appointment_id", appointmentId,
                "total_services", orders.size(),
                "completed_count", completed,
                "pending_count", pending,
                "services", ordersWithResults
        ));
    }
}
