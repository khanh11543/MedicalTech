package com.q2k.meditech.service;

import com.q2k.meditech.dto.PaymentInitDTO;
import com.q2k.meditech.dto.settings.GeneralSettingsDTO;
import com.q2k.meditech.dto.MomoInitDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Post-booking work that must not block the HTTP response (MoMo API, settings, email payload).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AppointmentBookingFollowUpService {

    private final AppointmentRepository appointmentRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentService paymentService;
    private final EmailService emailService;
    private final SystemSettingService systemSettingService;

    @Async
    public void runFollowUp(Long appointmentId, Long bookedByUserId, Long paymentId) {
        try {
            Appointment appointment = appointmentRepository.findByIdWithDetails(appointmentId).orElse(null);
            if (appointment == null) {
                log.warn("Follow-up: appointment {} not found", appointmentId);
                return;
            }

            Patient patient = appointment.getPatient();
            Doctor doctor = appointment.getDoctor();

            PaymentInitDTO momoInit = null;
            BigDecimal paymentTotal = null;
            if (paymentId != null) {
                paymentTotal = paymentRepository.findById(paymentId).map(Payment::getTotalAmount).orElse(null);
                if (paymentTotal != null && paymentTotal.compareTo(BigDecimal.ZERO) > 0) {
                    try {
                        momoInit = paymentService.initMomoPayment(paymentId, new MomoInitDTO(), bookedByUserId);
                        log.debug("MoMo initialized post-booking: paymentId={}, orderId={}",
                                paymentId, momoInit != null ? momoInit.getOrderId() : null);
                    } catch (Exception e) {
                        log.warn("Follow-up: MoMo init failed for appointment {}: {}", appointmentId, e.getMessage());
                    }
                }
            }

            User patientUser = patient != null ? patient.getUser() : null;
            if (patientUser != null && patientUser.getEmail() != null && !patientUser.getEmail().isBlank()) {
                String patientName = patient.getFullName() != null ? patient.getFullName() : patientUser.getFullName();
                if (patientName == null || patientName.isBlank()) {
                    patientName = patientUser.getEmail();
                }
                String dateStr = appointment.getAppointmentDate()
                        .format(DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH));
                String timeStr = appointment.getStartTime().format(DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH));
                String department = doctor != null && doctor.getSpecialization() != null ? doctor.getSpecialization() : "";
                String doctorName = "";
                if (doctor != null) {
                    doctorName = doctor.getFullName() != null ? doctor.getFullName()
                            : (doctor.getUser() != null ? doctor.getUser().getFullName() : "");
                }

                GeneralSettingsDTO settings = systemSettingService.getGeneralSettings();
                String clinicName = settings != null && settings.getClinicName() != null
                        ? settings.getClinicName()
                        : "MedicalTech Clinic";
                String hotline = settings != null ? settings.getPhone() : null;
                String address = null;
                if (settings != null) {
                    address = Stream.of(
                            settings.getStreet(),
                            settings.getCity(),
                            settings.getState(),
                            settings.getZipCode(),
                            settings.getCountry()
                    ).filter(Objects::nonNull).filter(s -> !s.isBlank()).collect(Collectors.joining(", "));
                    if (address.isBlank()) {
                        address = null;
                    }
                }

                String paymentAmount = null;
                String paymentQrUrl = null;
                String paymentPageUrl = null;
                if (paymentTotal != null && paymentTotal.compareTo(BigDecimal.ZERO) > 0) {
                    paymentAmount = String.format("%,.0f", paymentTotal);
                    if (momoInit != null && Boolean.TRUE.equals(momoInit.getSuccess())) {
                        paymentQrUrl = momoInit.getQrCodeUrl();
                        paymentPageUrl = momoInit.getPayUrl();
                    }
                }

                emailService.sendAppointmentConfirmationEmail(
                        patientUser.getEmail(),
                        patientName,
                        appointment.getAppointmentCode(),
                        department,
                        doctorName,
                        dateStr,
                        timeStr,
                        appointment.getReasonForVisit(),
                        clinicName,
                        hotline,
                        address,
                        paymentAmount,
                        paymentQrUrl,
                        paymentPageUrl
                );
            } else {
                log.debug("Follow-up: no patient email for appointment {}", appointmentId);
            }
        } catch (Exception e) {
            log.warn("Follow-up failed for appointment {}: {}", appointmentId, e.getMessage());
        }
    }
}
