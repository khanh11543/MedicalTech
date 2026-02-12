package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentFilterDTO {
    
    private Long doctorId;
    private Long patientId;
    private AppointmentStatus status;
    private LocalDate from;
    private LocalDate to;
    private LocalDate date; // Specific date for doctor's view
    
    @Builder.Default
    private Integer pageNumber = 0;
    
    @Builder.Default
    private Integer pageSize = 10;
}