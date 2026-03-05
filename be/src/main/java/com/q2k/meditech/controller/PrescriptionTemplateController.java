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
     * Tạo template mới
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
     * Lấy danh sách template
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
     * Lấy chi tiết template
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
     * Cập nhật template
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
     * Xóa template (soft delete)
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
     * Apply template để tạo đơn thuốc nhanh
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