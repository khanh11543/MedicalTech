package com.q2k.meditech.service;

import com.q2k.meditech.dto.FinalInvoiceDTO;
import com.q2k.meditech.dto.SendInvoiceDTO;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceDeliveryServiceImplTest {

    @Mock PaymentRepository paymentRepository;
    @Mock InvoiceRepository invoiceRepository;
    @Mock InvoiceService invoiceService;
    @Mock DeliveryLogRepository deliveryLogRepository;
    @Mock UserRepository userRepository;
    @Mock EmailService emailService;
    @Mock SmsService smsService;
    @Mock AppointmentRepository appointmentRepository;
    @Mock ServiceOrderRepository serviceOrderRepository;
    @Mock PrescriptionRepository prescriptionRepository;

    @InjectMocks InvoiceDeliveryServiceImpl service;

    @Test
    void sendInvoice_paymentNotFound() {
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.sendInvoice(1L, SendInvoiceDTO.builder().build(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getDeliveryLogs_paymentMissing() {
        when(paymentRepository.existsById(1L)).thenReturn(false);
        assertThatThrownBy(() -> service.getDeliveryLogs(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void generateInvoicePdf_nullId() {
        assertThatThrownBy(() -> service.generateInvoicePdf(null)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void autoSendInvoiceOnPaymentSuccess_paymentMissing() {
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThat(service.autoSendInvoiceOnPaymentSuccess(1L).getSuccess()).isFalse();
    }

    @Test
    void autoSendRefundNotification_paymentMissing() {
        when(paymentRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThat(service.autoSendRefundNotification(1L).getSuccess()).isFalse();
    }

    @Test
    void generateFinalInvoicePdf_delegatesToInvoiceService() {
        when(invoiceService.getFinalInvoice(1L, 2L)).thenReturn(FinalInvoiceDTO.builder()
                .invoiceNumber("FIN-1")
                .invoiceDate(LocalDate.now())
                .appointmentCode("A1")
                .patientName("P")
                .consultationItems(List.of())
                .serviceItems(List.of())
                .medicationItems(List.of())
                .subtotal(java.math.BigDecimal.ZERO)
                .discount(java.math.BigDecimal.ZERO)
                .tax(java.math.BigDecimal.ZERO)
                .grandTotal(java.math.BigDecimal.ZERO)
                .consultationTotal(java.math.BigDecimal.ZERO)
                .servicesTotal(java.math.BigDecimal.ZERO)
                .medicationsTotal(java.math.BigDecimal.ZERO)
                .paymentStatus("ALL_PAID")
                .build());
        byte[] pdf = service.generateFinalInvoicePdf(1L, 2L);
        assertThat(pdf).isNotEmpty();
    }

    @Test
    void generateServiceOrderReceiptPdf_appointmentNotFound() {
        when(appointmentRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.generateServiceOrderReceiptPdf(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void generatePrescriptionReceiptPdf_appointmentNotFound() {
        when(appointmentRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.generatePrescriptionReceiptPdf(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void sendServiceOrderReceipt_appointmentNotFound() {
        when(appointmentRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.sendServiceOrderReceipt(1L, SendInvoiceDTO.builder().build(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void sendPrescriptionReceipt_appointmentNotFound() {
        when(appointmentRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.sendPrescriptionReceipt(1L, SendInvoiceDTO.builder().build(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
