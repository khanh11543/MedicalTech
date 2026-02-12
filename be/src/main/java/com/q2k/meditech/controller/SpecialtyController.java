package com.q2k.meditech.controller;

import com.q2k.meditech.dto.SpecialtyDTO;
import com.q2k.meditech.service.SpecialtyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/specialties")
public class SpecialtyController {

    @Autowired
    private SpecialtyService specialtyService;

    @GetMapping
    public ResponseEntity<List<SpecialtyDTO>> getAllSpecialties(
            @RequestParam(required = false) Boolean isActive) {
        List<SpecialtyDTO> specialties = specialtyService.searchSpecialties(null, isActive);
        return ResponseEntity.ok(specialties);
    }
}
