package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * Basic patient information returned for receptionist patient search.
 * Privacy-safe: phone is masked unless explicitly provided in search.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PatientBasicDTO {

    private Long id;
    private Long userId;
    private String name;
    private String maskedPhone;
    private String email;
    private String gender;
    private String dateOfBirth;   // formatted string
    private String mrn;           // Medical Record Number if any
}
