package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentFilterDTO {
    
    private Long doctorId;
    private Long patientId;
    private AppointmentStatus status;
    private List<AppointmentStatus> statuses; // Multiple statuses filter
    private LocalDate from;
    private LocalDate to;
    private LocalDate date; // Specific date for doctor's view
    
    // Search 
    private String search; // Search by patient name, doctor name, or appointment code
    
    // Appointment type filter (e.g., CONSULTATION, FOLLOW_UP, EMERGENCY, CHECKUP)
    private String appointmentType;
    
    // Payment status filter (join with payments table)
    private String paymentStatus;
    
    // Sorting
    @Builder.Default
    private String sortBy = "appointmentDate";
    
    @Builder.Default
    private String sortDir = "DESC";
    
    // Pagination
    @Builder.Default
    private Integer pageNumber = 0;
    
    @Builder.Default
    private Integer pageSize = 10;
}