package com.q2k.meditech.dto;

import lombok.*;

import java.util.List;

/**
 * DTO for block slot response
 * Can indicate either successful block or conflicts that need to be resolved
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockSlotResponseDTO {
    
    /**
     * Whether the slot was successfully blocked
     */
    private boolean success;
    
    /**
     * Blocked slot details (set only if success=true)
     */
    private TimeSlotDTO blockedSlot;
    
    /**
     * Whether there are conflicting appointments
     */
    private boolean hasConflicts;
    
    /**
     * List of conflicting appointments that need to be rescheduled (set if hasConflicts=true)
     */
    private List<ConflictingAppointmentDTO> conflictingAppointments;
    
    /**
     * Message describing the result
     */
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
        private String status;
    }
}
