package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for new patients list (this month).
 * Extends patient list info with badge and quick-action flag.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewPatientDTO {

    private Long id;
    private Long userId;
    private String mrn;
    private String name;
    private Integer age;
    private String gender;
    private String maskedPhone;
    private String insuranceStatus;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime registeredAt;

    /** Whether this patient has any appointment yet */
    private Boolean hasAppointment;

    /** Whether to show NEW badge */
    private Boolean isNew;
}
