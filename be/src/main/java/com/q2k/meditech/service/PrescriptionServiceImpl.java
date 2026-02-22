package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.exception.AppException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.dto.mapper.PrescriptionMapper;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionMapper prescriptionMapper;

    @Override
    public PrescriptionDTO createPrescription(PrescriptionCreateDTO dto, Long doctorUserId) {
        log.info("Creating prescription for patient {} by doctor user {}", dto.getPatientId(), doctorUserId);

        // Validate doctor
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));

        // Validate patient
        Patient patient = patientRepository.findByIdWithUser(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", dto.getPatientId()));

        // Validate appointment nếu có
        Appointment appointment = null;
        if (dto.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(dto.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", dto.getAppointmentId()));

            // Kiểm tra appointment có thuộc về doctor và patient không
            if (!appointment.getDoctor().getId().equals(doctor.getId())) {
                throw new AppException("Appointment does not belong to this doctor", HttpStatus.FORBIDDEN);
            }
            if (!appointment.getPatient().getId().equals(patient.getId())) {
                throw new AppException("Appointment does not belong to this patient", HttpStatus.BAD_REQUEST);
            }
        }

        // Tạo prescription
        Prescription prescription = Prescription.builder()
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .prescriptionDate(dto.getPrescriptionDate() != null ? dto.getPrescriptionDate() : LocalDate.now())
                .diagnosis(dto.getDiagnosis())
                .notes(dto.getNotes())
                .followUpDate(dto.getFollowUpDate())
                .isActive(true)
                .build();

        // Thêm items
        AtomicInteger order = new AtomicInteger(1);
        dto.getItems().forEach(itemDto -> {
            PrescriptionItem item = prescriptionMapper.toItemEntity(itemDto);
            if (item.getItemOrder() == null) {
                item.setItemOrder(order.getAndIncrement());
            }
            prescription.addItem(item);
        });

        Prescription savedPrescription = prescriptionRepository.save(prescription);
        log.info("Prescription created with ID: {}", savedPrescription.getId());

        return prescriptionMapper.toDTO(savedPrescription);
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDTO getPrescriptionById(Long id) {
        Prescription prescription = prescriptionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));
        return prescriptionMapper.toDTO(prescription);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PrescriptionDTO> getPatientPrescriptions(Long patientId, LocalDate from, LocalDate to, int pageNumber, int pageSize) {
        log.info("Getting prescriptions for patient {}", patientId);

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "prescriptionDate"));

        Page<Prescription> prescriptions;
        if (from != null && to != null) {
            prescriptions = prescriptionRepository.findByPatientIdAndDateRange(patientId, from, to, pageable);
        } else {
            prescriptions = prescriptionRepository.findByPatientIdOrderByPrescriptionDateDesc(patientId, pageable);
        }

        return prescriptions.map(prescriptionMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PrescriptionDTO> getDoctorPrescriptions(Long doctorId, LocalDate from, LocalDate to, int pageNumber, int pageSize) {
        log.info("Getting prescriptions for doctor {}", doctorId);

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "prescriptionDate"));

        // TODO: Add date range filter if needed
        List<Prescription> prescriptions = prescriptionRepository.findByDoctorId(doctorId);

        // Convert to Page manually for now
        int start = pageNumber * pageSize;
        int end = Math.min(start + pageSize, prescriptions.size());

        List<PrescriptionDTO> content = prescriptions.subList(start, end).stream()
                .map(prescriptionMapper::toDTO)
                .toList();

        return new org.springframework.data.domain.PageImpl<>(content, pageable, prescriptions.size());
    }
    
    @Override
    @Transactional(readOnly = true)
    public Page<PrescriptionDTO> getAllPrescriptions(Long doctorId, Long patientId, LocalDate from, LocalDate to, int pageNumber, int pageSize) {
        log.info("Getting all prescriptions with filters - doctorId: {}, patientId: {}, from: {}, to: {}", 
                doctorId, patientId, from, to);

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "prescriptionDate"));
        
        Page<Prescription> prescriptions = prescriptionRepository.findAllWithFilters(
                doctorId, patientId, from, to, pageable);

        return prescriptions.map(prescriptionMapper::toDTO);
    }
}