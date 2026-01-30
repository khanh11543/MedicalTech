package com.q2k.meditech.service;

import com.q2k.meditech.dto.DoctorCardDTO;
import com.q2k.meditech.dto.DoctorDetailDTO;
import com.q2k.meditech.dto.TimeSlotDTO;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Service interface for public Doctor operations
 */
public interface PublicDoctorService {

    /**
     * Search doctors with filters and pagination
     * @param query Search keyword (name, hospital)
     * @param specialtyId Filter by specialty
     * @param city Filter by city
     * @param minFee Minimum consultation fee
     * @param maxFee Maximum consultation fee
     * @param pageNumber Page number (0-based)
     * @param pageSize Number of items per page
     * @param sortBy Sort field
     * @param sortOrder Sort direction (asc/desc)
     * @return Page of doctor cards
     */
    Page<DoctorCardDTO> searchDoctors(
            String query,
            Integer specialtyId,
            String city,
            BigDecimal minFee,
            BigDecimal maxFee,
            int pageNumber,
            int pageSize,
            String sortBy,
            String sortOrder
    );

    /**
     * Get doctor detail by ID (public view)
     * @param doctorId Doctor ID
     * @return Doctor detail or null if not found
     */
    DoctorDetailDTO getDoctorDetail(Long doctorId);

    /**
     * Get available time slots for a doctor
     * @param doctorId Doctor ID
     * @param dateFrom Start date
     * @param dateTo End date
     * @return List of available time slots
     */
    List<TimeSlotDTO> getAvailableSlots(Long doctorId, LocalDate dateFrom, LocalDate dateTo);
}
