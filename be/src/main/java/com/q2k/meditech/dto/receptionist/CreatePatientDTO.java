package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

/**
 * DTO for receptionist to create a new patient.
 * Only demographic/administrative information — no medical data.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatePatientDTO {

    @NotBlank(message = "Patient name is required")
    @Size(min = 2, max = 255, message = "Name must be between 2 and 255 characters")
    private String name;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9+\\-() ]{8,20}$", message = "Phone must contain only digits, +, -, (, ) and spaces (8-20 chars)")
    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @Pattern(regexp = "^(MALE|FEMALE|OTHER)$", message = "Gender must be MALE, FEMALE or OTHER")
    private String gender;

    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;
}
