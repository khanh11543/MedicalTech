package com.q2k.meditech.dto;

import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrescriptionFilterDTO {
    
    private Long patientId;
    private Long doctorId;
    private LocalDate from;
    private LocalDate to;
    
    @Builder.Default
    private Integer pageNumber = 0;
    
    @Builder.Default
    private Integer pageSize = 10;
}