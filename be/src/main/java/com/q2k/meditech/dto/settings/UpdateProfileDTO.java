package com.q2k.meditech.dto.settings;

import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileDTO {

    @Size(max = 255, message = "Full name must not exceed 255 characters")
    private String fullName;

    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;

    /**
     * Doctor DOB (stored into Doctor.dateOfBirth).
     * Can be null for non-doctors / unset cases.
     */
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;
}
