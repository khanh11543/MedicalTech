package com.q2k.meditech.dto;

import lombok.*;

/**
 * DTO for completing an appointment/consultation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompleteAppointmentDTO {

    /**
     * Doctor's notes from the consultation
     */
    private String doctorNotes;

    /**
     * Diagnosis made during consultation
     */
    private String diagnosis;

    /**
     * Prescription information (summary or ID reference)
     */
    private String prescription;

    /**
     * Follow-up recommendations
     */
    private String followUpRecommendations;

    /**
     * Whether to create a follow-up appointment
     */
    @Builder.Default
    private Boolean createFollowUp = false;

    /**
     * Follow-up date if createFollowUp is true
     */
    private String followUpDate;
}
