package com.q2k.meditech.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionCreateDTO {
    
    @NotNull(message = "Patient ID is required")
    private Long patientId;
    
    private Long appointmentId; // Optional - liên kết với lần khám
    
    private LocalDate prescriptionDate; // Nếu null sẽ lấy ngày hiện tại
    
    private String diagnosis; // Chẩn đoán
    
    private String notes; // Ghi chú
    
    private LocalDate followUpDate; // Ngày tái khám
    
    @NotEmpty(message = "Prescription must have at least one item")
    @Valid
    private List<PrescriptionItemDTO> items; // Danh sách thuốc
}