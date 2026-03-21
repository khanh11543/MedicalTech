package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.MedicalRecordDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.MedicalRecord;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.MedicalRecordRepository;
import com.q2k.meditech.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * Implementation of Medical Record Service
 * Handles data access and conversion for medical records
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final DoctorRepository doctorRepository;

    // =========== DOCTOR APIs ===========

    @Override
    public Page<MedicalRecordDTO> getDoctorMedicalRecords(Long doctorId, int pageNumber, int pageSize, LocalDate from, LocalDate to) {
        log.info("Getting medical records for doctor: {}, from: {}, to: {}", doctorId, from, to);

        // Verify doctor exists
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor not found with id: " + doctorId);
        }

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("visitDate").descending());

        Page<MedicalRecord> records;
        if (from != null && to != null) {
            records = medicalRecordRepository.findByDoctorIdAndDateRange(doctorId, from, to, pageable);
        } else {
            records = medicalRecordRepository.findByDoctorId(doctorId, pageable);
        }

        return records.map(this::toDTO);
    }

    @Override
    public Page<MedicalRecordDTO> getDoctorPatientRecords(Long doctorId, Long patientId, int pageNumber, int pageSize) {
        log.info("Getting medical records for doctor: {} regarding patient: {}", doctorId, patientId);

        // Verify doctor exists
        if (!doctorRepository.existsById(doctorId)) {
            throw new ResourceNotFoundException("Doctor not found with id: " + doctorId);
        }

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("visitDate").descending());
        Page<MedicalRecord> records = medicalRecordRepository.findByDoctorIdAndPatientId(doctorId, patientId, pageable);

        return records.map(this::toDTO);
    }

    @Override
    public MedicalRecordDTO getDoctorMedicalRecord(Long recordId, Long doctorId) {
        log.info("Getting medical record: {} for doctor: {}", recordId, doctorId);

        MedicalRecord record = medicalRecordRepository.findByIdAndDoctorId(recordId, doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found or access denied"));

        return toDTO(record);
    }

    // =========== PATIENT APIs ===========

    @Override
    public Page<MedicalRecordDTO> getPatientMedicalRecords(Long patientId, int pageNumber, int pageSize, LocalDate from, LocalDate to) {
        log.info("Getting medical records for patient: {}, from: {}, to: {}", patientId, from, to);

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by("visitDate").descending());

        Page<MedicalRecord> records;
        if (from != null && to != null) {
            records = medicalRecordRepository.findByPatientIdAndDateRange(patientId, from, to, pageable);
        } else {
            records = medicalRecordRepository.findByPatientId(patientId, pageable);
        }

        return records.map(this::toDTO);
    }

    @Override
    public MedicalRecordDTO getPatientMedicalRecord(Long recordId, Long patientId) {
        log.info("Getting medical record: {} for patient: {}", recordId, patientId);

        MedicalRecord record = medicalRecordRepository.findByIdAndPatientId(recordId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical record not found"));

        return toDTO(record);
    }

    @Override
    public boolean patientHasRecords(Long patientId) {
        return medicalRecordRepository.existsByPatientId(patientId);
    }

    @Override
    public Long countPatientRecords(Long patientId) {
        return medicalRecordRepository.countByPatientId(patientId);
    }

    @Override
    public Long countDoctorRecords(Long doctorId) {
        return medicalRecordRepository.countByDoctorId(doctorId);
    }

    @Override
    public MedicalRecordDTO getDoctorMedicalRecordByAppointmentId(Long appointmentId, Long doctorId) {
        return medicalRecordRepository.findByAppointmentId(appointmentId)
                .filter(r -> r.getDoctor().getId().equals(doctorId))
                .map(this::toDTO)
                .orElse(null);
    }

    // =========== HELPER METHODS ===========

    /**
     * Convert MedicalRecord entity to DTO
     */
    private MedicalRecordDTO toDTO(MedicalRecord record) {
        return MedicalRecordDTO.builder()
                .id(record.getId())
                .recordCode(record.getRecordCode())
                .doctorId(record.getDoctor().getId())
                .doctorName(record.getDoctor().getUser().getFullName())
                .doctorSpecialization(record.getDoctor().getSpecialization())
                .appointmentId(record.getAppointment() != null ? record.getAppointment().getId() : null)
                .visitDate(record.getVisitDate())
                .chiefComplaint(record.getChiefComplaint())
                .presentIllness(record.getPresentIllness())
                .vitalSigns(record.getVitalSigns())
                .physicalExam(record.getPhysicalExam())
                .diagnosis(record.getDiagnosis())
                .diagnosisCode(record.getDiagnosisCode())
                .treatmentPlan(record.getTreatmentPlan())
                .prescription(record.getPrescription())
                .labResults(record.getLabResults())
                .followUpDate(record.getFollowUpDate())
                .followUpNotes(record.getFollowUpNotes())
                .attachments(record.getAttachments())
                .isConfidential(record.getIsConfidential())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }
}
