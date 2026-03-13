package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.*;
import com.q2k.meditech.service.PrescriptionTemplateService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for Doctor to manage prescription templates
 */
@RestController
@RequestMapping("/doctor/prescription-templates")
@RequiredArgsConstructor
public class PrescriptionTemplateController {
    
    private final PrescriptionTemplateService templateService;
    
    /**
     * Create a new template
     * POST /api/doctor/prescription-templates
     */
    @PostMapping
    public ResponseEntity<TemplateDTO> createTemplate(
            @Valid @RequestBody TemplateCreateDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long doctorUserId = getCurrentUserId(userDetails);
        TemplateDTO result = templateService.createTemplate(dto, doctorUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    /**
     * Get template list
     * GET /api/doctor/prescription-templates
     */
    @GetMapping
    public ResponseEntity<List<TemplateDTO>> getTemplates(
            @RequestParam(defaultValue = "false") Boolean activeOnly,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long doctorUserId = getCurrentUserId(userDetails);
        List<TemplateDTO> result = templateService.getDoctorTemplates(doctorUserId, activeOnly);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get template details
     * GET /api/doctor/prescription-templates/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<TemplateDTO> getTemplate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long doctorUserId = getCurrentUserId(userDetails);
        TemplateDTO result = templateService.getTemplateById(id, doctorUserId);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Update template
     * PUT /api/doctor/prescription-templates/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<TemplateDTO> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody TemplateUpdateDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long doctorUserId = getCurrentUserId(userDetails);
        TemplateDTO result = templateService.updateTemplate(id, dto, doctorUserId);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Delete template (soft delete)
     * DELETE /api/doctor/prescription-templates/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<MessageDTO> deleteTemplate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long doctorUserId = getCurrentUserId(userDetails);
        templateService.deleteTemplate(id, doctorUserId);
        return ResponseEntity.ok(MessageDTO.success("Template deleted successfully"));
    }
    
    /**
     * Apply template to quickly create a prescription
     * POST /api/doctor/prescription-templates/{id}/apply
     */
    @PostMapping("/{id}/apply")
    public ResponseEntity<PrescriptionDTO> applyTemplate(
            @PathVariable Long id,
            @Valid @RequestBody ApplyTemplateDTO dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long doctorUserId = getCurrentUserId(userDetails);
        PrescriptionDTO result = templateService.applyTemplate(id, dto, doctorUserId);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
    
    // Helper method
    private Long getCurrentUserId(UserDetails userDetails) {
        return SecurityUtil.getCurrentUserId();
    }
}