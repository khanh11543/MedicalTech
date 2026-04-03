package com.q2k.meditech.service;

import com.q2k.meditech.dto.ServiceOrderCreateDTO;
import com.q2k.meditech.dto.ServiceOrderDTO;

import java.util.List;

public interface ServiceOrderService {

    /**
     * Create a new service order for an appointment
     */
    ServiceOrderDTO createServiceOrder(Long appointmentId, ServiceOrderCreateDTO dto);

    /**
     * Get all service orders for an appointment
     */
    List<ServiceOrderDTO> getServiceOrdersByAppointment(Long appointmentId);

    /**
     * Cancel a service order (only if ORDERED or PENDING_PAYMENT)
     */
    ServiceOrderDTO cancelServiceOrder(Long serviceOrderId);

    /**
     * Check if there are any pending (non-completed, non-cancelled) service orders
     */
    boolean hasPendingServiceOrders(Long appointmentId);

    /**
     * Collect payment for a service order (receptionist)
     * @param serviceOrderId service order ID
     * @param paymentMethod CASH or MOMO
     * @param currentUserId user who collected payment
     */
    ServiceOrderDTO collectPayment(Long serviceOrderId, String paymentMethod, Long currentUserId);

    /**
     * Get pending-payment service orders for an appointment
     */
    List<ServiceOrderDTO> getPendingPaymentOrders(Long appointmentId);
}
