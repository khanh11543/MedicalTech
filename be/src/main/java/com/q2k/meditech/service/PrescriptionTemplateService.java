package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.PrescriptionMapper;

import java.util.List;

public interface PrescriptionTemplateService {
    
    /**
     * Tạo template mới
     * @param dto thông tin template
     * @param doctorUserId ID user của doctor
     */
    TemplateDTO createTemplate(TemplateCreateDTO dto, Long doctorUserId);
    
    /**
     * Lấy danh sách template của doctor
     * @param doctorUserId ID user của doctor
     * @param activeOnly chỉ lấy template active
     */
    List<TemplateDTO> getDoctorTemplates(Long doctorUserId, boolean activeOnly);
    
    /**
     * Lấy template theo ID
     */
    TemplateDTO getTemplateById(Long id, Long doctorUserId);
    
    /**
     * Cập nhật template
     */
    TemplateDTO updateTemplate(Long id, TemplateUpdateDTO dto, Long doctorUserId);
    
    /**
     * Xóa template (soft delete - set isActive = false)
     */
    void deleteTemplate(Long id, Long doctorUserId);
    
    /**
     * Apply template để tạo đơn thuốc nhanh
     */
    PrescriptionDTO applyTemplate(Long templateId, ApplyTemplateDTO dto, Long doctorUserId);
}