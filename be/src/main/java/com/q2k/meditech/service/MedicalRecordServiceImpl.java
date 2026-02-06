package com.q2k.meditech.service;

import com.q2k.meditech.dto.MedicalRecordCreateDTO;
import com.q2k.meditech.dto.MedicalRecordDTO;
import com.q2k.meditech.dto.MedicalRecordUpdateDTO;
import com.q2k.meditech.dto.mapper.MedicalRecordMapper;
import com.q2k.meditech.entity.Appointment;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.MedicalRecord;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.MedicalRecordRepository;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Medical Record Service Implementation
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MedicalRecordServiceImpl implements MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final MedicalRecordMapper medicalRecordMapper;
    private final EntityManager entityManager;

    @Override
    public MedicalRecordDTO createMedicalRecord(Long doctorId, MedicalRecordCreateDTO createDTO) {
        log.info("Creating medical record - doctorId: {}, patientId: {}", doctorId, createDTO.getPatientId());

        // Validate doctor exists
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with ID: " + doctorId));

        // Validate patient exists
        Patient patient = patientRepository.findById(createDTO.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found with ID: " + createDTO.getPatientId()));

        // Map DTO to entity
        MedicalRecord record = medicalRecordMapper.toEntity(createDTO);
        record.setDoctor(doctor);
        record.setPatient(patient);

        // Set appointment if provided
        if (createDTO.getAppointmentId() != null) {
            Appointment appointment = entityManager.find(Appointment.class, createDTO.getAppointmentId());
            if (appointment == null) {
                throw new ResourceNotFoundException("Appointment not found with ID: " + createDTO.getAppointmentId());
            }
            record.setAppointment(appointment);
        }

        // Generate unique record code
        record.setRecordCode(generateRecordCode());

        // Set default for isConfidential
        if (record.getIsConfidential() == null) {
            record.setIsConfidential(false);
        }

        // Save
        record = medicalRecordRepository.save(record);
        log.info("Medical record created successfully - id: {}, recordCode: {}", record.getId(), record.getRecordCode());

        return medicalRecordMapper.toDTO(record);
    }

    @Override
    public MedicalRecordDTO updateMedicalRecord(Long doctorId, Long recordId, MedicalRecordUpdateDTO updateDTO) {
        log.info("Updating medical record - doctorId: {}, recordId: {}", doctorId, recordId);

        // Find record that belongs to this doctor
        MedicalRecord record = medicalRecordRepository.findByIdAndDoctorId(recordId, doctorId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Medical record not found with ID: " + recordId + " for doctor: " + doctorId));

        // Update only non-null fields
        medicalRecordMapper.updateEntityFromDTO(updateDTO, record);

        // Save
        record = medicalRecordRepository.save(record);
        log.info("Medical record updated successfully - id: {}", record.getId());

        return medicalRecordMapper.toDTO(record);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MedicalRecordDTO> getPatientMedicalRecords(Long patientId, LocalDate from, LocalDate to,
                                                            int pageNumber, int pageSize) {
        log.info("Getting medical records for patient: {}, from: {}, to: {}", patientId, from, to);

        // Validate patient exists
        if (!patientRepository.existsById(patientId)) {
            throw new ResourceNotFoundException("Patient not found with ID: " + patientId);
        }

        // Validate pagination
        if (pageNumber < 0) pageNumber = 0;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        Pageable pageable = PageRequest.of(pageNumber, pageSize);

        Page<MedicalRecord> records = medicalRecordRepository.findByPatientIdWithDateRange(
                patientId, from, to, pageable);

        return records.map(medicalRecordMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public MedicalRecordDTO getPatientRecordDetail(Long patientId, Long recordId) {
        log.info("Getting medical record detail - patientId: {}, recordId: {}", patientId, recordId);

        MedicalRecord record = medicalRecordRepository.findByIdAndPatientId(recordId, patientId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Medical record not found with ID: " + recordId + " for patient: " + patientId));

        return medicalRecordMapper.toDTO(record);
    }

    /**
     * Generate unique record code: MR-YYYYMMDD-XXXXX
     */
    private String generateRecordCode() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart;
        String code;
        
        do {
            randomPart = String.format("%05d", ThreadLocalRandom.current().nextInt(100000));
            code = "MR-" + datePart + "-" + randomPart;
        } while (medicalRecordRepository.existsByRecordCode(code));

        return code;
    }
}
