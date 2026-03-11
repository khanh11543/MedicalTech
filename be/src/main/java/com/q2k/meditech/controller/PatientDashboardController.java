package com.q2k.meditech.controller;

import com.q2k.meditech.dto.AppointmentDTO;
import com.q2k.meditech.dto.PatientDashboardDTO;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Patient Dashboard Controller
 * Provides dashboard statistics and overview data for authenticated patients.
 */
@RestController
@RequestMapping("/patient/dashboard")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Patient - Dashboard", description = "Dashboard overview APIs for patients")
public class PatientDashboardController {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PaymentRepository paymentRepository;

    /**
     * GET /api/patient/dashboard/stats
     * Get dashboard statistics for the authenticated patient
     */
    @GetMapping("/stats")
    @Operation(summary = "Get dashboard statistics", description = "Returns appointment counts, prescriptions, records and payment stats")
    public ResponseEntity<PatientDashboardDTO> getDashboardStats() {
        Long patientId = getAuthenticatedPatientId();
        log.info("GET /patient/dashboard/stats for patientId: {}", patientId);

        List<Appointment> allAppointments = appointmentRepository.findByPatientId(patientId);

        long total = allAppointments.size();
        long upcoming = allAppointments.stream()
                .filter(a -> (a.getStatus() == AppointmentStatus.PENDING || a.getStatus() == AppointmentStatus.CONFIRMED)
                        && !a.getAppointmentDate().isBefore(LocalDate.now()))
                .count();
        long completed = allAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
                .count();
        long cancelled = allAppointments.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CANCELLED)
                .count();

        // Next appointment
        AppointmentDTO nextAppt = allAppointments.stream()
                .filter(a -> (a.getStatus() == AppointmentStatus.PENDING || a.getStatus() == AppointmentStatus.CONFIRMED)
                        && !a.getAppointmentDate().isBefore(LocalDate.now()))
                .sorted((a1, a2) -> {
                    int dateCompare = a1.getAppointmentDate().compareTo(a2.getAppointmentDate());
                    return dateCompare != 0 ? dateCompare : a1.getStartTime().compareTo(a2.getStartTime());
                })
                .findFirst()
                .map(this::toAppointmentDTO)
                .orElse(null);

        long totalPrescriptions = prescriptionRepository.countByPatientId(patientId);
        long activePrescriptions = prescriptionRepository.countByPatientIdAndIsActiveTrue(patientId);
        long totalRecords = medicalRecordRepository.countByPatientId(patientId);

        // Payment stats
        var payments = paymentRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
        long totalPayments = payments.size();
        long pendingPayments = payments.stream()
                .filter(p -> "PENDING".equals(p.getPaymentStatus()) || "INITIATED".equals(p.getPaymentStatus()))
                .count();

        PatientDashboardDTO dashboard = PatientDashboardDTO.builder()
                .totalAppointments(total)
                .upcomingAppointments(upcoming)
                .completedAppointments(completed)
                .cancelledAppointments(cancelled)
                .totalPrescriptions(totalPrescriptions)
                .activePrescriptions(activePrescriptions)
                .totalMedicalRecords(totalRecords)
                .totalPayments(totalPayments)
                .pendingPayments(pendingPayments)
                .nextAppointment(nextAppt)
                .generatedAt(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(dashboard);
    }

    /**
     * GET /api/patient/dashboard/upcoming-appointments
     * Get upcoming appointments for dashboard display (limited to 5)
     */
    @GetMapping("/upcoming-appointments")
    @Operation(summary = "Get upcoming appointments", description = "Returns up to 5 upcoming appointments")
    public ResponseEntity<List<AppointmentDTO>> getUpcomingAppointments() {
        Long patientId = getAuthenticatedPatientId();

        List<AppointmentDTO> upcoming = appointmentRepository.findByPatientId(patientId).stream()
                .filter(a -> (a.getStatus() == AppointmentStatus.PENDING || a.getStatus() == AppointmentStatus.CONFIRMED)
                        && !a.getAppointmentDate().isBefore(LocalDate.now()))
                .sorted((a1, a2) -> {
                    int dateCompare = a1.getAppointmentDate().compareTo(a2.getAppointmentDate());
                    return dateCompare != 0 ? dateCompare : a1.getStartTime().compareTo(a2.getStartTime());
                })
                .limit(5)
                .map(this::toAppointmentDTO)
                .toList();

        return ResponseEntity.ok(upcoming);
    }

    // ==================== HELPER METHODS ====================

    private Long getAuthenticatedPatientId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Patient patient = patientRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found. Please complete your registration."));
        return patient.getId();
    }

    private AppointmentDTO toAppointmentDTO(Appointment a) {
        return AppointmentDTO.builder()
                .id(a.getId())
                .appointmentCode(a.getAppointmentCode())
                .patientId(a.getPatient().getId())
                .patientName(a.getPatient().getUser().getFullName())
                .doctorId(a.getDoctor().getId())
                .doctorName(a.getDoctor().getFullName())
                .doctorSpecialization(a.getDoctor().getSpecialization())
                .appointmentDate(a.getAppointmentDate())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .status(a.getStatus())
                .bookedBy(a.getBookedBy())
                .queueNumber(a.getQueueNumber())
                .reasonForVisit(a.getReasonForVisit())
                .symptoms(a.getSymptoms())
                .notes(a.getNotes())
                .cancellationReason(a.getCancellationReason())
                .checkedInAt(a.getCheckedInAt())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
