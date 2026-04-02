package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.DoctorSchedule;
import com.q2k.meditech.entity.Specialty;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.DoctorScheduleRepository;
import com.q2k.meditech.specification.DoctorSpecification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private DoctorScheduleRepository scheduleRepository;

    public DoctorSearchResponse searchDoctors(
            String query,
            Integer specialtyId,
            String city,
            BigDecimal minFee,
            BigDecimal maxFee,
            Integer pageNumber,
            Integer pageSize,
            String sortBy,
            String sortOrder) {

        // Build specification
        Specification<Doctor> spec = Specification.where(DoctorSpecification.isApproved())
                .and(DoctorSpecification.isPublicVisible())
                .and(DoctorSpecification.hasQuery(query))
                .and(DoctorSpecification.hasSpecialty(specialtyId))
                .and(DoctorSpecification.hasCity(city))
                .and(DoctorSpecification.hasFeeInRange(minFee, maxFee));

        // Build pagination and sorting
        String safeSortBy = com.q2k.meditech.util.SortFieldValidator.validate(
                sortBy, java.util.Set.of("id", "consultationFee", "createdAt", "averageRating"), "id");
        Sort sort = Sort.by(
                sortOrder != null && sortOrder.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC,
                safeSortBy
        );

        Pageable pageable = PageRequest.of(
                pageNumber != null && pageNumber >= 0 ? pageNumber : 0,
                pageSize != null && pageSize > 0 ? pageSize : 10,
                sort
        );

        // Execute search
        Page<Doctor> page = doctorRepository.findAll(spec, pageable);

        // Convert to DTOs
        List<DoctorCardDTO> doctorCards = page.getContent().stream()
                .map(this::convertToDoctorCardDTO)
                .collect(Collectors.toList());

        // Build response
        DoctorSearchResponse response = new DoctorSearchResponse();
        response.setDoctors(doctorCards);
        response.setTotalPages(page.getTotalPages());
        response.setTotalElements(page.getTotalElements());
        response.setCurrentPage(page.getNumber());
        response.setPageSize(page.getSize());

        return response;
    }

    public DoctorDetailDTO getDoctorDetail(Long doctorId) {
        Doctor doctor = doctorRepository.findByIdForPublic(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        return convertToDoctorDetailDTO(doctor);
    }

    public List<TimeSlotDTO> getDoctorAvailableSlots(Long doctorId, LocalDate dateFrom, LocalDate dateTo) {
        // Validate date range
        if (dateFrom == null || dateTo == null) {
            throw new IllegalArgumentException("dateFrom and dateTo are required");
        }
        if (dateTo.isBefore(dateFrom)) {
            throw new IllegalArgumentException("dateTo must be after or equal to dateFrom");
        }

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        if (doctor.getIsAvailable() == null || !doctor.getIsAvailable()) {
            return new ArrayList<>();
        }

        List<DoctorSchedule> schedules = scheduleRepository.findByDoctorIdAndIsActive(doctorId, true);
        
        if (schedules == null || schedules.isEmpty()) {
            return new ArrayList<>();
        }

        List<TimeSlotDTO> timeSlots = new ArrayList<>();

        LocalDate currentDate = dateFrom;
        while (!currentDate.isAfter(dateTo)) {
            int dayOfWeek = currentDate.getDayOfWeek().getValue();

            for (DoctorSchedule schedule : schedules) {
                if (schedule.getDayOfWeek().equals(dayOfWeek)) {
                    List<TimeSlotDTO> dailySlots = generateTimeSlots(
                            currentDate,
                            schedule.getStartTime(),
                            schedule.getEndTime(),
                            schedule.getSlotDuration()
                    );
                    timeSlots.addAll(dailySlots);
                }
            }

            currentDate = currentDate.plusDays(1);
        }

        return timeSlots;
    }

    private List<TimeSlotDTO> generateTimeSlots(LocalDate date, LocalTime startTime, LocalTime endTime, Integer durationMinutes) {
        List<TimeSlotDTO> slots = new ArrayList<>();
        
        // Validate inputs
        if (startTime == null || endTime == null || durationMinutes == null || durationMinutes <= 0) {
            return slots;
        }
        
        if (endTime.isBefore(startTime) || endTime.equals(startTime)) {
            return slots;
        }
        
        LocalTime currentTime = startTime;

        while (currentTime.plusMinutes(durationMinutes).isBefore(endTime) ||
               currentTime.plusMinutes(durationMinutes).equals(endTime)) {

            LocalTime slotStart = currentTime;
            LocalTime slotEnd = currentTime.plusMinutes(durationMinutes);

            TimeSlotDTO slot = new TimeSlotDTO();
            slot.setStartTime(slotStart);
            slot.setEndTime(slotEnd);
            slot.setIsAvailable(true); // TODO: Check against existing appointments

            slots.add(slot);

            currentTime = currentTime.plusMinutes(durationMinutes);
        }

        return slots;
    }

    private DoctorCardDTO convertToDoctorCardDTO(Doctor doctor) {
        DoctorCardDTO dto = new DoctorCardDTO();
        dto.setId(doctor.getId());
        dto.setFullName(doctor.getFullName());
        dto.setAvatarUrl(doctor.getUser() != null ? doctor.getUser().getAvatarUrl() : null);
        dto.setSpecialties(doctor.getSpecialties().stream()
                .map(Specialty::getName)
                .collect(Collectors.toList()));
        dto.setExperienceYears(doctor.getExperienceYears());
        dto.setConsultationFee(doctor.getConsultationFee());
        dto.setRatingAvg(doctor.getRatingAvg());
        dto.setRatingCount(doctor.getRatingCount());
        dto.setHospitalAffiliation(doctor.getHospitalAffiliation());
        dto.setOfficeAddress(doctor.getOfficeAddress());
        dto.setIsAvailable(doctor.getIsAvailable());
        return dto;
    }

    private DoctorDetailDTO convertToDoctorDetailDTO(Doctor doctor) {
        DoctorDetailDTO dto = new DoctorDetailDTO();
        dto.setId(doctor.getId());
        dto.setFullName(doctor.getFullName());
        dto.setEmail(doctor.getUser() != null ? doctor.getUser().getEmail() : null);
        dto.setPhone(doctor.getUser() != null ? doctor.getUser().getPhone() : null);
        dto.setAvatarUrl(doctor.getUser() != null ? doctor.getUser().getAvatarUrl() : null);
        dto.setLicenseNumber(doctor.getLicenseNumber());
        dto.setBio(doctor.getBio());
        dto.setEducation(doctor.getEducation());
        dto.setExperienceYears(doctor.getExperienceYears());
        dto.setConsultationFee(doctor.getConsultationFee());
        dto.setFollowUpFee(doctor.getFollowUpFee());
        dto.setRatingAvg(doctor.getRatingAvg());
        dto.setRatingCount(doctor.getRatingCount());
        dto.setHospitalAffiliation(doctor.getHospitalAffiliation());
        dto.setOfficeAddress(doctor.getOfficeAddress());
        dto.setIsAvailable(doctor.getIsAvailable());
        dto.setSpecialties(doctor.getSpecialties().stream()
                .map(this::convertToSpecialtyDTO)
                .collect(Collectors.toList()));
        return dto;
    }

    private SpecialtyDTO convertToSpecialtyDTO(Specialty specialty) {
        SpecialtyDTO dto = new SpecialtyDTO();
        dto.setId(specialty.getId());
        dto.setName(specialty.getName());
        dto.setDescription(specialty.getDescription());
        dto.setIconUrl(specialty.getIconUrl());
        dto.setIsActive(specialty.getIsActive());
        dto.setCreatedAt(specialty.getCreatedAt());
        dto.setUpdatedAt(specialty.getUpdatedAt());
        return dto;
    }
}
