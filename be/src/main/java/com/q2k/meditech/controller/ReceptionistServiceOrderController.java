package com.q2k.meditech.controller;

import com.q2k.meditech.dto.PaymentInitDTO;
import com.q2k.meditech.dto.ServiceOrderDTO;
import com.q2k.meditech.service.PaymentService;
import com.q2k.meditech.service.ServiceOrderService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Receptionist Service Order Controller
 * Endpoints for receptionists to manage service order payments
 */
@RestController
@RequestMapping("/receptionist/service-orders")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('RECEPTIONIST')")
@Tag(name = "Receptionist - Service Orders", description = "APIs for receptionists to manage service order payments")
public class ReceptionistServiceOrderController {

    private final ServiceOrderService serviceOrderService;
    private final PaymentService paymentService;

    /**
     * Get all service orders for an appointment
     * GET /api/receptionist/service-orders/appointment/{appointmentId}
     */
    @GetMapping("/appointment/{appointmentId}")
    @Operation(summary = "Get service orders", description = "Get all service orders for an appointment")
    public ResponseEntity<List<ServiceOrderDTO>> getServiceOrders(@PathVariable Long appointmentId) {
        log.info("GET /receptionist/service-orders/appointment/{}", appointmentId);
        List<ServiceOrderDTO> orders = serviceOrderService.getServiceOrdersByAppointment(appointmentId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Get pending-payment service orders for an appointment
     * GET /api/receptionist/service-orders/appointment/{appointmentId}/pending-payment
     */
    @GetMapping("/appointment/{appointmentId}/pending-payment")
    @Operation(summary = "Get pending payment orders", description = "Get service orders awaiting payment for an appointment")
    public ResponseEntity<List<ServiceOrderDTO>> getPendingPaymentOrders(@PathVariable Long appointmentId) {
        log.info("GET /receptionist/service-orders/appointment/{}/pending-payment", appointmentId);
        List<ServiceOrderDTO> orders = serviceOrderService.getPendingPaymentOrders(appointmentId);
        return ResponseEntity.ok(orders);
    }

    /**
     * Collect payment for a service order
     * POST /api/receptionist/service-orders/{id}/collect-payment
     * Body: { "paymentMethod": "CASH" | "MOMO" }
     */
    @PostMapping("/{id}/collect-payment")
    @Operation(summary = "Collect payment", description = "Collect payment for a service order (Cash or MoMo)")
    public ResponseEntity<ServiceOrderDTO> collectPayment(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        String paymentMethod = body.get("paymentMethod");
        log.info("POST /receptionist/service-orders/{}/collect-payment - method: {}", id, paymentMethod);

        Long currentUserId = SecurityUtil.getCurrentUserId();
        ServiceOrderDTO result = serviceOrderService.collectPayment(id, paymentMethod, currentUserId);
        return ResponseEntity.ok(result);
    }

    /**
     * Collect payment for multiple service orders at once
     * POST /api/receptionist/service-orders/collect-payment-batch
     * Body: { "serviceOrderIds": [1,2,3], "paymentMethod": "CASH" | "MOMO" }
     */
    @PostMapping("/collect-payment-batch")
    @Operation(summary = "Batch collect payment", description = "Collect payment for multiple service orders at once")
    public ResponseEntity<List<ServiceOrderDTO>> collectPaymentBatch(
            @RequestBody Map<String, Object> body) {

        @SuppressWarnings("unchecked")
        List<Integer> ids = (List<Integer>) body.get("serviceOrderIds");
        String paymentMethod = (String) body.get("paymentMethod");

        log.info("POST /receptionist/service-orders/collect-payment-batch - ids: {}, method: {}", ids, paymentMethod);

        Long currentUserId = SecurityUtil.getCurrentUserId();
        List<ServiceOrderDTO> results = ids.stream()
                .map(id -> serviceOrderService.collectPayment(id.longValue(), paymentMethod, currentUserId))
                .toList();

        return ResponseEntity.ok(results);
    }

    /**
     * Initialize MoMo payment for service orders (create Payment + get QR code)
     * POST /api/receptionist/service-orders/momo-init
     * Body: { "appointmentId": 123, "serviceOrderIds": [1,2,3] }
     */
    @PostMapping("/momo-init")
    @Operation(summary = "Init MoMo for service orders", description = "Create payment and get MoMo QR code for service orders")
    public ResponseEntity<PaymentInitDTO> initMomoForServiceOrders(@RequestBody Map<String, Object> body) {
        Long appointmentId = ((Number) body.get("appointmentId")).longValue();
        @SuppressWarnings("unchecked")
        List<Integer> ids = (List<Integer>) body.get("serviceOrderIds");
        List<Long> serviceOrderIds = ids.stream().map(Integer::longValue).toList();

        log.info("POST /receptionist/service-orders/momo-init - appointmentId: {}, ids: {}", appointmentId, serviceOrderIds);

        Long currentUserId = SecurityUtil.getCurrentUserId();
        PaymentInitDTO result = paymentService.createAndInitMomoForServiceOrders(appointmentId, serviceOrderIds, currentUserId);
        return ResponseEntity.ok(result);
    }
}
