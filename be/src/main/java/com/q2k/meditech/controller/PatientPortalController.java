package com.q2k.meditech.controller;

import com.q2k.meditech.dto.AppointmentDTO;
import com.q2k.meditech.dto.mapper.AppointmentMapper;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.service.PatientProfileService;
import com.q2k.meditech.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller for patient portal — upcoming appointments.
 * Dashboard stats → PatientDashboardController
 * Medical records → PatientMedicalRecordController
 * Prescriptions  → PatientPrescriptionController
 */
@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
public class PatientPortalController {

    private final PatientProfileService patientProfileService;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentMapper appointmentMapper;

    /**
     * GET /api/patient/appointments/upcoming
     * Returns upcoming (confirmed/scheduled) appointments for the patient
     */
    @GetMapping("/appointments/upcoming")
    public ResponseEntity<List<AppointmentDTO>> getUpcomingAppointments() {
        Long patientId = getCurrentPatientId();

        Page<Appointment> page = appointmentRepository.findByPatientId(patientId,
                PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "appointmentDate", "startTime")));

        List<AppointmentDTO> upcoming = page.getContent().stream()
                .filter(a -> a.getStatus() == AppointmentStatus.CONFIRMED
                        || a.getStatus() == AppointmentStatus.SCHEDULED
                        || a.getStatus() == AppointmentStatus.PENDING)
                .filter(a -> !a.getAppointmentDate().isBefore(LocalDate.now()))
                .map(appointmentMapper::toDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(upcoming);
    }

    private Long getCurrentPatientId() {
        return patientProfileService.getOrCreatePatientForUser(SecurityUtil.getCurrentUserId()).getId();
    }
}
