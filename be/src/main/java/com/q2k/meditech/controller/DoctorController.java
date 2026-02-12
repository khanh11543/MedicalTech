package com.q2k.meditech.controller;

import com.q2k.meditech.dto.DoctorDetailDTO;
import com.q2k.meditech.dto.DoctorSearchResponse;
import com.q2k.meditech.dto.TimeSlotDTO;
import com.q2k.meditech.service.DoctorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/public/doctors")
public class DoctorController {

    @Autowired
    private DoctorService doctorService;

    @GetMapping
    public ResponseEntity<DoctorSearchResponse> searchDoctors(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer specialtyId,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) BigDecimal minFee,
            @RequestParam(required = false) BigDecimal maxFee,
            @RequestParam(required = false, defaultValue = "0") Integer pageNumber,
            @RequestParam(required = false, defaultValue = "10") Integer pageSize,
            @RequestParam(required = false, defaultValue = "id") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String sortOrder) {

        DoctorSearchResponse response = doctorService.searchDoctors(
                q, specialtyId, city, minFee, maxFee,
                pageNumber, pageSize, sortBy, sortOrder
        );

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{doctorId}")
    public ResponseEntity<DoctorDetailDTO> getDoctorDetail(@PathVariable Long doctorId) {
        DoctorDetailDTO doctor = doctorService.getDoctorDetail(doctorId);
        return ResponseEntity.ok(doctor);
    }

    @GetMapping("/{doctorId}/slots")
    public ResponseEntity<List<TimeSlotDTO>> getDoctorAvailableSlots(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {

        List<TimeSlotDTO> slots = doctorService.getDoctorAvailableSlots(doctorId, dateFrom, dateTo);
        return ResponseEntity.ok(slots);
    }
}
