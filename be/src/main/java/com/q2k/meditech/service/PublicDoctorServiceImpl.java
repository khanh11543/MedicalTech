package com.q2k.meditech.service;

import com.q2k.meditech.dto.DoctorCardDTO;
import com.q2k.meditech.dto.DoctorDetailDTO;
import com.q2k.meditech.dto.TimeSlotDTO;
import com.q2k.meditech.dto.mapper.DoctorMapper;
import com.q2k.meditech.dto.mapper.TimeSlotMapper;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.DoctorSpecialty;
import com.q2k.meditech.entity.TimeSlot;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.DoctorSpecialtyRepository;
import com.q2k.meditech.repository.TimeSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Implementation of PublicDoctorService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PublicDoctorServiceImpl implements PublicDoctorService {

    private final DoctorRepository doctorRepository;
    private final DoctorSpecialtyRepository doctorSpecialtyRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final DoctorMapper doctorMapper;
    private final TimeSlotMapper timeSlotMapper;

    @Override
    public Page<DoctorCardDTO> searchDoctors(
            String query,
            Integer specialtyId,
            String city,
            BigDecimal minFee,
            BigDecimal maxFee,
            int pageNumber,
            int pageSize,
            String sortBy,
            String sortOrder
    ) {
        log.debug("Searching doctors with query: {}, specialtyId: {}, city: {}, minFee: {}, maxFee: {}",
                query, specialtyId, city, minFee, maxFee);

        // Build sort
        Sort sort = buildSort(sortBy, sortOrder);
        Pageable pageable = PageRequest.of(pageNumber, pageSize, sort);

        // Search doctors
        Page<Doctor> doctors = doctorRepository.searchDoctors(
                query, specialtyId, city, minFee, maxFee, pageable
        );

        // Convert to DTOs with specialties
        return doctors.map(doctor -> {
            List<DoctorSpecialty> specialties = doctorSpecialtyRepository.findByDoctorIdWithSpecialty(doctor.getId());
            return doctorMapper.toCardDTO(doctor, specialties);
        });
    }

    @Override
    public DoctorDetailDTO getDoctorDetail(Long doctorId) {
        log.debug("Getting doctor detail for id: {}", doctorId);

        Doctor doctor = doctorRepository.findByIdForPublic(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        List<DoctorSpecialty> specialties = doctorSpecialtyRepository.findByDoctorIdWithSpecialty(doctorId);
        
        return doctorMapper.toDetailDTO(doctor, specialties);
    }

    @Override
    public List<TimeSlotDTO> getAvailableSlots(Long doctorId, LocalDate dateFrom, LocalDate dateTo) {
        log.debug("Getting available slots for doctor: {}, from: {}, to: {}", doctorId, dateFrom, dateTo);

        // Validate doctor exists and is available
        doctorRepository.findByIdForPublic(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        // Default date range: today to 7 days from now
        if (dateFrom == null) {
            dateFrom = LocalDate.now();
        }
        if (dateTo == null) {
            dateTo = dateFrom.plusDays(7);
        }

        // Get available slots
        List<TimeSlot> slots = timeSlotRepository.findAvailableSlots(doctorId, dateFrom, dateTo);
        
        return timeSlotMapper.toDTOList(slots);
    }

    /**
     * Build Sort object from sortBy and sortOrder parameters
     */
    private Sort buildSort(String sortBy, String sortOrder) {
        // Default sort
        if (sortBy == null || sortBy.isBlank()) {
            sortBy = "ratingAvg";
        }

        // Map frontend field names to entity field names
        String entityField = switch (sortBy) {
            case "rating" -> "ratingAvg";
            case "fee", "price" -> "consultationFee";
            case "experience" -> "experienceYears";
            case "name" -> "fullName";
            default -> sortBy;
        };

        // Default order is descending for rating, ascending for others
        Sort.Direction direction;
        if (sortOrder != null && sortOrder.equalsIgnoreCase("asc")) {
            direction = Sort.Direction.ASC;
        } else if (sortOrder != null && sortOrder.equalsIgnoreCase("desc")) {
            direction = Sort.Direction.DESC;
        } else {
            // Default based on field
            direction = entityField.equals("ratingAvg") ? Sort.Direction.DESC : Sort.Direction.ASC;
        }

        return Sort.by(direction, entityField);
    }
}
