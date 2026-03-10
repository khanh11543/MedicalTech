package com.q2k.meditech.dto.receptionist;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for listing patients in receptionist's "All Patients" table.
 * Privacy-first: phone is masked, address NOT included (detail only).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientListDTO {

    private Long id;
    private Long userId;
    private String mrn;
    private String name;
    private Integer age;
    private String gender;
    private String maskedPhone;
    private String maskedEmail;
    private String cityDistrict;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate lastVisit;

    private Long totalAppointments;
    private String insuranceStatus;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    private Boolean isActive;
}
