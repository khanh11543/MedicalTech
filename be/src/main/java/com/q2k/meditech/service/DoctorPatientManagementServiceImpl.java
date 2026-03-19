package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.entity.enums.PrescriptionStatus;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of Doctor Patient Management Service
 * Provides APIs for doctors to query their patient cohort
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DoctorPatientManagementServiceImpl implements DoctorPatientManagementService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final PrescriptionRepository prescriptionRepository;

    // ==================== MY PATIENTS TAB ====================

    @Override
    public PageResponse<DoctorPatientDTO> getMyPatients(Long doctorId, String search, Pageable pageable) {
        log.info("Fetching my patients for doctor ID: {}, search: {}", doctorId, search);

        // Validate doctor exists
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        // Get patients with search if provided
        Page<Patient> patientPage;
        if (search != null && !search.isBlank()) {
            patientPage = appointmentRepository.searchPatientsByDoctorId(doctorId, search, pageable);
        } else {
            patientPage = appointmentRepository.findDistinctPatientsByDoctorId(doctorId, pageable);
        }

        // Convert to DTOs with additional data
        List<DoctorPatientDTO> dtos = patientPage.getContent().stream()
                .map(patient -> convertToPatientDTO(patient, doctorId))
                .collect(Collectors.toList());

        return PageResponse.<DoctorPatientDTO>builder()
                .content(dtos)
                .pageNumber(pageable.getPageNumber())
                .pageSize(pageable.getPageSize())
                .totalElements(patientPage.getTotalElements())
                .totalPages(patientPage.getTotalPages())
                .hasNext(patientPage.hasNext())
                .hasPrevious(patientPage.hasPrevious())
                .build();
    }

    @Override
    public DoctorPatientDetailDTO getPatientDetail(Long doctorId, Long patientId) {
        log.info("Fetching patient detail for doctor ID: {}, patient ID: {}", doctorId, patientId);

        // Validate doctor has seen this patient
        Boolean hasAppointment = appointmentRepository.hasAppointmentWithPatient(doctorId, patientId);
        if (!hasAppointment) {
            throw new ResourceNotFoundException("Doctor has no history with this patient");
        }

        // Get patient
        Patient patient = patientRepository.findByIdWithUser(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));

        // Build detail DTO
        DoctorPatientDetailDTO result = DoctorPatientDetailDTO.builder()
                .id(patient.getId())
                .fullName(patient.getFullName())
                .email(patient.getUser().getEmail())
                .phone(patient.getUser().getPhone())
                .dateOfBirth(patient.getDateOfBirth())
                .age(calculateAge(patient.getDateOfBirth()))
                .gender(patient.getGender())
                .address(patient.getAddress())
                .bloodGroup(patient.getBloodGroup())
                .allergies(patient.getAllergies())
                .medicalHistory(patient.getMedicalHistory())
                .insuranceNumber(patient.getInsuranceNumber())
                .emergencyContact(patient.getEmergencyContact())
                .createdAt(patient.getCreatedAt())
                .updatedAt(patient.getUpdatedAt())
                .build();

        // Get visit history
        result.setTotalVisitsWithThisDoctor(
                appointmentRepository.countVisitsByDoctorAndPatient(doctorId, patientId));

        Optional<Appointment> lastAppt = appointmentRepository
                .findLastAppointmentByDoctorAndPatient(doctorId, patientId);
        if (lastAppt.isPresent()) {
            Appointment appt = lastAppt.get();
            result.setLastVisitDate(LocalDateTime.of(appt.getAppointmentDate(), appt.getAppointmentTime()));
            result.setLastVisitReason(appt.getReasonForVisit());
            result.setLastVisitNotes(appt.getNotes());
            result.setFirstVisitDate(LocalDateTime.of(appt.getAppointmentDate(), appt.getAppointmentTime()));
        }

        // Get medical records (last 5)
        List<MedicalRecord> medicalRecords = medicalRecordRepository
                .findMedicalRecordsByDoctorIdAndPatientId(doctorId, patientId);
        result.setTotalMedicalRecords(medicalRecords.size());
        result.setRecentMedicalRecords(
                medicalRecords.stream()
                        .limit(5)
                        .map(this::convertToMedicalRecordSummary)
                        .collect(Collectors.toList())
        );

        // Get prescriptions (last 5)
        List<Prescription> prescriptions = prescriptionRepository.findByPatientId(patientId);
        result.setTotalPrescriptions(prescriptions.size());
        result.setActivePrescriptions(
                (int) prescriptions.stream()
                        .filter(p -> p.getIsActive() && PrescriptionStatus.ACTIVE.equals(p.getStatus()))
                        .count()
        );
        result.setRecentPrescriptions(
                prescriptions.stream()
                        .limit(5)
                        .map(this::convertToPrescriptionSummary)
                        .collect(Collectors.toList())
        );

        // Get upcoming appointments (next 3)
        List<Appointment> upcomingAppts = appointmentRepository
                .findUpcomingAppointmentsByDoctorAndPatient(doctorId, patientId);
        result.setUpcomingAppointments(
                upcomingAppts.stream()
                        .limit(3)
                        .map(this::convertToAppointmentSummary)
                        .collect(Collectors.toList())
        );

        // Parse allergies and chronic conditions
        result.setAllergyList(parseAllergyList(patient.getAllergies()));
        result.setChronicConditionsList(parseChronicConditionsList(patient.getMedicalHistory()));

        return result;
    }

    // ==================== RECENT TAB ====================

    @Override
    public PageResponse<DoctorPatientRecentDTO> getRecentPatients(Long doctorId, Pageable pageable) {
        log.info("Fetching recent patients for doctor ID: {}", doctorId);

        // Validate doctor exists
        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        Page<Patient> patientPage = appointmentRepository
                .findRecentPatientsByDoctorId(doctorId, thirtyDaysAgo, pageable);

        List<DoctorPatientRecentDTO> dtos = patientPage.getContent().stream()
                .map(patient -> convertToRecentPatientDTO(patient, doctorId))
                .collect(Collectors.toList());

        return PageResponse.<DoctorPatientRecentDTO>builder()
                .content(dtos)
                .pageNumber(pageable.getPageNumber())
                .pageSize(pageable.getPageSize())
                .totalElements(patientPage.getTotalElements())
                .totalPages(patientPage.getTotalPages())
                .hasNext(patientPage.hasNext())
                .hasPrevious(patientPage.hasPrevious())
                .build();
    }

    // ==================== FLAGS TAB ====================

    @Override
    public PageResponse<DoctorPatientFlagsDTO> getPatientsWithFlags(Long doctorId, Pageable pageable) {
        log.info("Fetching patients with flags for doctor ID: {}", doctorId);

        // Get all patients
        Page<Patient> allPatients = appointmentRepository.findDistinctPatientsByDoctorId(doctorId, pageable);

        // Filter patients with flags (allergies or chronic conditions)
        List<DoctorPatientFlagsDTO> flaggedPatients = allPatients.getContent().stream()
                .filter(patient -> hasClinicialFlags(patient))
                .map(patient -> convertToFlagsDTO(patient, doctorId))
                .collect(Collectors.toList());

        // Note: This is simplified pagination - in production, use a dedicated query for better performance
        return buildFlaggedPageResponse(flaggedPatients, pageable, flaggedPatients.size());
    }

    @Override
    public PageResponse<DoctorPatientFlagsDTO> getPatientsWithAllergies(Long doctorId, Pageable pageable) {
        log.info("Fetching patients with allergies for doctor ID: {}", doctorId);

        Page<Patient> allPatients = appointmentRepository.findDistinctPatientsByDoctorId(doctorId, pageable);

        List<DoctorPatientFlagsDTO> allergyPatients = allPatients.getContent().stream()
                .filter(patient -> patient.getAllergies() != null && !patient.getAllergies().isBlank())
                .map(patient -> convertToFlagsDTO(patient, doctorId))
                .collect(Collectors.toList());

        return buildFlaggedPageResponse(allergyPatients, pageable, allergyPatients.size());
    }

    @Override
    public PageResponse<DoctorPatientFlagsDTO> getPatientsWithChronicConditions(Long doctorId, Pageable pageable) {
        log.info("Fetching patients with chronic conditions for doctor ID: {}", doctorId);

        Page<Patient> allPatients = appointmentRepository.findDistinctPatientsByDoctorId(doctorId, pageable);

        List<DoctorPatientFlagsDTO> chronicPatients = allPatients.getContent().stream()
                .filter(patient -> patient.getMedicalHistory() != null && !patient.getMedicalHistory().isBlank())
                .map(patient -> convertToFlagsDTO(patient, doctorId))
                .collect(Collectors.toList());

        return buildFlaggedPageResponse(chronicPatients, pageable, chronicPatients.size());
    }

    @Override
    public PageResponse<DoctorPatientFlagsDTO> getHighRiskPatients(Long doctorId, Pageable pageable) {
        log.info("Fetching high-risk patients for doctor ID: {}", doctorId);

        Page<Patient> allPatients = appointmentRepository.findDistinctPatientsByDoctorId(doctorId, pageable);

        List<DoctorPatientFlagsDTO> highRiskPatients = allPatients.getContent().stream()
                .map(patient -> convertToFlagsDTO(patient, doctorId))
                .filter(dto -> "HIGH".equals(dto.getRiskLevel()))
                .collect(Collectors.toList());

        return buildFlaggedPageResponse(highRiskPatients, pageable, highRiskPatients.size());
    }

    @Override
    public DoctorPatientCohortStatsDTO getPatientCohortStats(Long doctorId) {
        log.info("Fetching cohort stats for doctor ID: {}", doctorId);

        // Validate doctor exists
        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));

        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        LocalDate ninetyDaysAgo = LocalDate.now().minusDays(90);

        // TODO: Implement aggregation queries in repository for these metrics
        // For now, using simpler approach

        return DoctorPatientCohortStatsDTO.builder()
                .totalPatients(0L)
                .patientsInLast30Days(0L)
                .patientsInLast90Days(0L)
                .patientsWithAllergies(0L)
                .patientsWithChronicConditions(0L)
                .highRiskPatients(0L)
                .totalPrescriptions(0L)
                .activePrescriptions(0L)
                .patientsWithActivePrescriptions(0L)
                .totalAppointments(0L)
                .completedAppointments(0L)
                .pendingAppointments(0L)
                .upcomingAppointments(0L)
                .averageVisitsPerPatient(0.0)
                .patientsWithFollowUp(0L)
                .build();
    }

    // ==================== HELPER METHODS ====================

    private DoctorPatientDTO convertToPatientDTO(Patient patient, Long doctorId) {
        Integer totalVisits = appointmentRepository.countVisitsByDoctorAndPatient(doctorId, patient.getId());
        LocalDate lastVisitDate = appointmentRepository.findLastAppointmentDateByDoctorAndPatient(doctorId, patient.getId());

        DoctorPatientDTO dto = DoctorPatientDTO.builder()
                .id(patient.getId())
                .fullName(patient.getFullName())
                .email(patient.getUser().getEmail())
                .phone(patient.getUser().getPhone())
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup())
                .allergies(patient.getAllergies())
                .medicalHistory(patient.getMedicalHistory())
                .totalVisits(totalVisits)
                .allergyList(parseAllergyList(patient.getAllergies()))
                .chronicConditions(parseChronicConditionsList(patient.getMedicalHistory()))
                .createdAt(patient.getCreatedAt())
                .updatedAt(patient.getUpdatedAt())
                .build();

        if (lastVisitDate != null) {
            dto.setLastVisitDate(LocalDateTime.of(lastVisitDate, java.time.LocalTime.NOON));
        }

        // Get last visit reason from last appointment
        Optional<Appointment> lastAppt = appointmentRepository
                .findLastAppointmentByDoctorAndPatient(doctorId, patient.getId());
        if (lastAppt.isPresent()) {
            dto.setLastVisitReason(lastAppt.get().getReasonForVisit());
        }

        // Get prescription stats
        List<Prescription> prescriptions = prescriptionRepository.findByPatientId(patient.getId());
        dto.setTotalPrescriptionsCount(prescriptions.size());
        dto.setActivePrescriptionsCount(
                (int) prescriptions.stream()
                        .filter(p -> p.getIsActive() && PrescriptionStatus.ACTIVE.equals(p.getStatus()))
                        .count()
        );
        if (!prescriptions.isEmpty()) {
            dto.setMostRecentPrescriptionDate(
                    prescriptions.stream()
                            .map(Prescription::getPrescriptionDate)
                            .max(LocalDate::compareTo)
                            .orElse(null)
            );
        }

        // Check for upcoming appointments
        List<Appointment> upcomingAppts = appointmentRepository
                .findUpcomingAppointmentsByDoctorAndPatient(doctorId, patient.getId());
        dto.setHasUpcomingAppointment(!upcomingAppts.isEmpty());

        return dto;
    }

    private DoctorPatientRecentDTO convertToRecentPatientDTO(Patient patient, Long doctorId) {
        Optional<Appointment> lastAppt = appointmentRepository
                .findLastAppointmentByDoctorAndPatient(doctorId, patient.getId());

        DoctorPatientRecentDTO dto = DoctorPatientRecentDTO.builder()
                .id(patient.getId())
                .fullName(patient.getFullName())
                .email(patient.getUser().getEmail())
                .phone(patient.getUser().getPhone())
                .allergies(patient.getAllergies())
                .medicalHistory(patient.getMedicalHistory())
                .build();

        if (lastAppt.isPresent()) {
            Appointment appt = lastAppt.get();
            LocalDateTime visitDateTime = LocalDateTime.of(appt.getAppointmentDate(), appt.getAppointmentTime());
            dto.setLastVisitDate(visitDateTime);
            dto.setDaysSinceLastVisit((int) ChronoUnit.DAYS.between(visitDateTime, LocalDateTime.now()));
            dto.setLastVisitReason(appt.getReasonForVisit());
            dto.setLastVisitNotes(appt.getNotes());
            dto.setLastAppointmentId(appt.getId());
        }

        // Check for upcoming appointment
        List<Appointment> upcomingAppts = appointmentRepository
                .findUpcomingAppointmentsByDoctorAndPatient(doctorId, patient.getId());
        if (!upcomingAppts.isEmpty()) {
            Appointment nextAppt = upcomingAppts.get(0);
            dto.setHasUpcomingAppointment(true);
            dto.setNextAppointmentDate(nextAppt.getAppointmentDate());
        }

        // Get last medical record
        List<MedicalRecord> records = medicalRecordRepository.findMedicalRecordsByDoctorIdAndPatientId(doctorId, patient.getId());
        if (!records.isEmpty()) {
            dto.setLastMedicalRecordId(records.get(0).getId());
        }

        return dto;
    }

    private DoctorPatientFlagsDTO convertToFlagsDTO(Patient patient, Long doctorId) {
        List<String> allergies = parseAllergyList(patient.getAllergies());
        List<String> chronicConditions = parseChronicConditionsList(patient.getMedicalHistory());

        // Determine risk level based on severity
        String riskLevel = determineRiskLevel(allergies, chronicConditions);

        Optional<Appointment> lastAppt = appointmentRepository
                .findLastAppointmentByDoctorAndPatient(doctorId, patient.getId());

        DoctorPatientFlagsDTO dto = DoctorPatientFlagsDTO.builder()
                .id(patient.getId())
                .fullName(patient.getFullName())
                .email(patient.getUser().getEmail())
                .phone(patient.getUser().getPhone())
                .bloodGroup(patient.getBloodGroup())
                .allergies(allergies)
                .chronicConditions(chronicConditions)
                .riskLevel(riskLevel)
                .updatedAt(patient.getUpdatedAt())
                .build();

        if (lastAppt.isPresent()) {
            Appointment appt = lastAppt.get();
            dto.setLastVisitDate(LocalDateTime.of(appt.getAppointmentDate(), appt.getAppointmentTime()));
            dto.setLastVisitNotes(appt.getNotes());
        }

        // Get active prescriptions
        List<Prescription> prescriptions = prescriptionRepository.findByPatientId(patient.getId());
        long activePres = prescriptions.stream()
                .filter(p -> p.getIsActive() && PrescriptionStatus.ACTIVE.equals(p.getStatus()))
                .count();
        dto.setHasActivePrescriptions(activePres > 0);
        dto.setActivePrescriptionsCount((int) activePres);

        return dto;
    }

    private DoctorPatientDetailDTO.MedicalRecordSummaryDTO convertToMedicalRecordSummary(MedicalRecord record) {
        return DoctorPatientDetailDTO.MedicalRecordSummaryDTO.builder()
                .id(record.getId())
                .visitDate(record.getVisitDate())
                .chiefComplaint(record.getChiefComplaint())
                .diagnosis(record.getDiagnosis())
                .treatmentPlan(record.getTreatmentPlan())
                .build();
    }

    private DoctorPatientDetailDTO.PrescriptionSummaryDTO convertToPrescriptionSummary(Prescription prescription) {
        return DoctorPatientDetailDTO.PrescriptionSummaryDTO.builder()
                .id(prescription.getId())
                .prescriptionCode(prescription.getPrescriptionCode())
                .prescriptionDate(prescription.getPrescriptionDate())
                .diagnosis(prescription.getDiagnosis())
                .status(prescription.getStatus() != null ? prescription.getStatus().toString() : "UNKNOWN")
                .build();
    }

    private DoctorPatientDetailDTO.AppointmentSummaryDTO convertToAppointmentSummary(Appointment appointment) {
        return DoctorPatientDetailDTO.AppointmentSummaryDTO.builder()
                .id(appointment.getId())
                .appointmentCode(appointment.getAppointmentCode())
                .appointmentDate(appointment.getAppointmentDate())
                .appointmentType(appointment.getAppointmentType())
                .status(appointment.getStatus() != null ? appointment.getStatus().toString() : "UNKNOWN")
                .reasonForVisit(appointment.getReasonForVisit())
                .build();
    }

    private List<String> parseAllergyList(String allergies) {
        if (allergies == null || allergies.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(allergies.split("[,;\\n]"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }

    private List<String> parseChronicConditionsList(String medicalHistory) {
        if (medicalHistory == null || medicalHistory.isBlank()) {
            return new ArrayList<>();
        }
        // Simple parsing - can be improved based on actual format
        return Arrays.stream(medicalHistory.split("[,;\\n]"))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
    }

    private boolean hasClinicialFlags(Patient patient) {
        return (patient.getAllergies() != null && !patient.getAllergies().isBlank()) ||
                (patient.getMedicalHistory() != null && !patient.getMedicalHistory().isBlank());
    }

    private String determineRiskLevel(List<String> allergies, List<String> chronicConditions) {
        // HIGH: Multiple severe flags
        if ((allergies.size() >= 3) || (chronicConditions.size() >= 3)) {
            return "HIGH";
        }
        // MEDIUM: Some flags
        if ((allergies.size() + chronicConditions.size()) >= 2) {
            return "MEDIUM";
        }
        // LOW: One flag or none
        return "LOW";
    }

    private PageResponse<DoctorPatientFlagsDTO> buildFlaggedPageResponse(
            List<DoctorPatientFlagsDTO> content,
            Pageable pageable,
            long totalElements) {
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), content.size());
        List<DoctorPatientFlagsDTO> pageContent = content.subList(start, Math.max(start, end));

        int totalPages = (int) Math.ceil((double) totalElements / pageable.getPageSize());
        return PageResponse.<DoctorPatientFlagsDTO>builder()
                .content(pageContent)
                .pageNumber(pageable.getPageNumber())
                .pageSize(pageable.getPageSize())
                .totalElements(totalElements)
                .totalPages(totalPages)
                .hasNext(pageable.getPageNumber() < totalPages - 1)
                .hasPrevious(pageable.getPageNumber() > 0)
                .build();
    }

    private int calculateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return 0;
        }
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }
}
