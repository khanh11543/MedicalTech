package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.AppointmentStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentHistoryDTO {
    
    private Long id;
    private Long appointmentId;
    private String action;
    
    private AppointmentStatus oldStatus;
    private AppointmentStatus newStatus;
    
    private LocalDate oldDate;
    private LocalDate newDate;
    
    private LocalTime oldStartTime;
    private LocalTime newStartTime;
    
    private LocalTime oldEndTime;
    private LocalTime newEndTime;
    
    private Long changedByUserId;
    private String changedByUserName;
    private String changedByRole;
    
    private String reason;
    private LocalDateTime changedAt;
}