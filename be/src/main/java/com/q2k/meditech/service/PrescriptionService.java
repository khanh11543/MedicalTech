package com.q2k.meditech.service;

import com.q2k.meditech.dto.PrescriptionCreateDTO;
import com.q2k.meditech.dto.PrescriptionDTO;
import com.q2k.meditech.dto.mapper.PrescriptionMapper;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

public interface PrescriptionService {
    
    // ==================== PRESCRIPTION ====================
    
    /**
     * Tạo đơn thuốc mới
     * @param dto thông tin đơn thuốc
     * @param doctorUserId ID user của doctor đang đăng nhập
     */
    PrescriptionDTO createPrescription(PrescriptionCreateDTO dto, Long doctorUserId);
    
    /**
     * Lấy đơn thuốc theo ID
     */
    PrescriptionDTO getPrescriptionById(Long id);
    
    /**
     * Lấy danh sách đơn thuốc của patient
     */
    Page<PrescriptionDTO> getPatientPrescriptions(Long patientId, LocalDate from, LocalDate to, int pageNumber, int pageSize);
    
    /**
     * Lấy danh sách đơn thuốc của doctor
     */
    Page<PrescriptionDTO> getDoctorPrescriptions(Long doctorId, LocalDate from, LocalDate to, int pageNumber, int pageSize);
}