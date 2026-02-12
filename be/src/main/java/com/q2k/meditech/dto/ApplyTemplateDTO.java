package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyTemplateDTO {
    
    @NotNull(message = "Patient ID is required")
    private Long patientId;
    
    private Long appointmentId; // Optional - liên kết với lần khám
    
    private LocalDate prescriptionDate; // Nếu null sẽ lấy ngày hiện tại
    
    // Có thể override các giá trị mặc định từ template
    private String diagnosis; // Nếu null sẽ dùng diagnosisTemplate
    
    private String notes; // Nếu null sẽ dùng notesTemplate
    
    private LocalDate followUpDate; // Nếu null sẽ tính từ defaultFollowUpDays
}