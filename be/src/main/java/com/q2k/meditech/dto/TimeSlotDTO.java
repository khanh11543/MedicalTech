package com.q2k.meditech.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO for Time slot information (used in list / calendar views)
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlotDTO {
    private Long id;
    private Long doctorId;
    private String doctorName;
    private String specialization;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate slotDate;
    
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;
    
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;
    
    private String status;       // AVAILABLE, BOOKED, BLOCKED, COMPLETED, RESERVED
    private Boolean isAvailable;

    // Source info
    private String source;       // MANUAL, BULK, TEMPLATE
    private String batchId;
    private String note;

    // Block info
    private String blockReason;  // enum name
    private String blockNote;
    private LocalDateTime blockUntil;
    private Long blockedBy;
    private String blockedByName;
    private LocalDateTime blockedAt;

    // Appointment info (if booked)
    private String appointmentCode;
    private Long appointmentId;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
