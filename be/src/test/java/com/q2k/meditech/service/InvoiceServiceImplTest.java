package com.q2k.meditech.service;

import com.q2k.meditech.dto.InvoiceUpdateDTO;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.InvoiceRepository;
import com.q2k.meditech.repository.PaymentRepository;
import com.q2k.meditech.repository.PrescriptionRepository;
import com.q2k.meditech.repository.ServiceOrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceImplTest {

    @Mock InvoiceRepository invoiceRepository;
    @Mock PaymentRepository paymentRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock ServiceOrderRepository serviceOrderRepository;
    @Mock PrescriptionRepository prescriptionRepository;

    @InjectMocks InvoiceServiceImpl service;

    @Test
    void createInvoiceForPayment_nullPaymentId() {
        assertThatThrownBy(() -> service.createInvoiceForPayment(null)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getInvoiceByPaymentId_null() {
        assertThatThrownBy(() -> service.getInvoiceByPaymentId(null)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getInvoiceById_null() {
        assertThatThrownBy(() -> service.getInvoiceById(null)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getInvoiceByPaymentIdForPatient_nullPatient() {
        assertThatThrownBy(() -> service.getInvoiceByPaymentIdForPatient(1L, null)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void getInvoiceByIdForPatient_notFound() {
        when(invoiceRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> service.getInvoiceByIdForPatient(1L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateInvoice_invalidStatus() {
        when(invoiceRepository.findByIdWithDetails(1L)).thenReturn(java.util.Optional.of(
                com.q2k.meditech.entity.Invoice.builder().build()));
        var dto = InvoiceUpdateDTO.builder().status("INVALID").build();
        assertThatThrownBy(() -> service.updateInvoice(1L, dto, 1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void getFinalInvoice_requiresAppointmentId() {
        assertThatThrownBy(() -> service.getFinalInvoice(null, 1L)).isInstanceOf(BadRequestException.class);
    }
}
