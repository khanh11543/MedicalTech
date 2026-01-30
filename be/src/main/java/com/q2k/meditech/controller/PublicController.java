package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DoctorCardDTO;
import com.q2k.meditech.dto.DoctorDetailDTO;
import com.q2k.meditech.dto.SpecialtyDTO;
import com.q2k.meditech.dto.TimeSlotDTO;
import com.q2k.meditech.service.PublicDoctorService;
import com.q2k.meditech.service.SpecialtyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Public API Controller for Specialties and Doctors Search
 * All endpoints are publicly accessible (no authentication required)
 */
@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Public API", description = "Public endpoints for specialties and doctor search")
public class PublicController {

    private final SpecialtyService specialtyService;
    private final PublicDoctorService publicDoctorService;

    // ==================== SPECIALTIES ====================

    /**
     * GET /api/public/specialties
     * List all specialties with optional search and filter
     */
    @GetMapping("/specialties")
    @Operation(
            summary = "List Specialties",
            description = "Get list of medical specialties with optional search and active filter"
    )
    public ResponseEntity<List<SpecialtyDTO>> listSpecialties(
            @Parameter(description = "Search keyword for specialty name")
            @RequestParam(required = false) String q,
            
            @Parameter(description = "Filter by active status")
            @RequestParam(required = false) Boolean isActive
    ) {
        log.info("GET /public/specialties - q: {}, isActive: {}", q, isActive);
        
        List<SpecialtyDTO> specialties = specialtyService.searchSpecialties(q, isActive);
        return ResponseEntity.ok(specialties);
    }

    // ==================== DOCTORS SEARCH ====================

    /**
     * GET /api/public/doctors
     * Search doctors with filters and pagination
     */
    @GetMapping("/doctors")
    @Operation(
            summary = "Search Doctors",
            description = "Search doctors with various filters, pagination and sorting"
    )
    public ResponseEntity<Page<DoctorCardDTO>> searchDoctors(
            @Parameter(description = "Search keyword (name, hospital)")
            @RequestParam(required = false) String q,
            
            @Parameter(description = "Filter by specialty ID")
            @RequestParam(required = false) Integer specialtyId,
            
            @Parameter(description = "Filter by city")
            @RequestParam(required = false) String city,
            
            @Parameter(description = "Minimum consultation fee")
            @RequestParam(required = false) BigDecimal minFee,
            
            @Parameter(description = "Maximum consultation fee")
            @RequestParam(required = false) BigDecimal maxFee,
            
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int pageNumber,
            
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int pageSize,
            
            @Parameter(description = "Sort field (rating, fee, experience, name)")
            @RequestParam(defaultValue = "ratingAvg") String sortBy,
            
            @Parameter(description = "Sort direction (asc, desc)")
            @RequestParam(defaultValue = "desc") String sortOrder
    ) {
        log.info("GET /public/doctors - q: {}, specialtyId: {}, city: {}", q, specialtyId, city);
        
        Page<DoctorCardDTO> doctors = publicDoctorService.searchDoctors(
                q, specialtyId, city, minFee, maxFee,
                pageNumber, pageSize, sortBy, sortOrder
        );
        
        return ResponseEntity.ok(doctors);
    }

    /**
     * GET /api/public/doctors/{doctorId}
     * Get doctor detail/profile
     */
    @GetMapping("/doctors/{doctorId}")
    @Operation(
            summary = "Doctor Detail",
            description = "Get detailed information about a specific doctor"
    )
    public ResponseEntity<DoctorDetailDTO> getDoctorDetail(
            @Parameter(description = "Doctor ID", required = true)
            @PathVariable Long doctorId
    ) {
        log.info("GET /public/doctors/{}", doctorId);
        
        DoctorDetailDTO doctor = publicDoctorService.getDoctorDetail(doctorId);
        return ResponseEntity.ok(doctor);
    }

    /**
     * GET /api/public/doctors/{doctorId}/slots
     * Get available time slots for a doctor
     */
    @GetMapping("/doctors/{doctorId}/slots")
    @Operation(
            summary = "Doctor Available Slots",
            description = "Get available time slots for booking with a doctor"
    )
    public ResponseEntity<List<TimeSlotDTO>> getDoctorAvailableSlots(
            @Parameter(description = "Doctor ID", required = true)
            @PathVariable Long doctorId,
            
            @Parameter(description = "Start date (yyyy-MM-dd)")
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            
            @Parameter(description = "End date (yyyy-MM-dd)")
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo
    ) {
        log.info("GET /public/doctors/{}/slots - dateFrom: {}, dateTo: {}", doctorId, dateFrom, dateTo);
        
        List<TimeSlotDTO> slots = publicDoctorService.getAvailableSlots(doctorId, dateFrom, dateTo);
        return ResponseEntity.ok(slots);
    }
}
