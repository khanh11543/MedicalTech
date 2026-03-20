package com.q2k.meditech.dto;

import lombok.*;

import java.util.List;

/**
 * DTO for block slot response when conflicts are detected
 * Used when a doctor tries to block a slot that has booked appointments
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockConflictDTO {
    
    private Long slotId;
    
    private boolean hasConflicts;
    
    private List<ConflictingAppointmentDTO> conflictingAppointments;
    
    private String message;
    
    /**
     * Nested DTO for conflicting appointment details
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ConflictingAppointmentDTO {
        private Long appointmentId;
        private String patientName;
        private String patientPhone;
        private String appointmentDate;
        private String startTime;
        private String endTime;
        private String appointmentType;
        private String reason;
    }
}
