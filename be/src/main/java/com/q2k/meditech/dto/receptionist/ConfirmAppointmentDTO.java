package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * DTO for receptionist to confirm a PENDING appointment.
 * Unlike doctor confirm, receptionist can add an admin note.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfirmAppointmentDTO {
    
    /** Optional administrative note from receptionist */
    private String adminNote;
}
