package com.q2k.meditech.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating a new receptionist via admin
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReceptionistDTO {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    private String email;

    private String phone;
    private String employeeId;
    private String department;
    private String shift; // MORNING, AFTERNOON, EVENING, NIGHT

    @NotBlank(message = "Password is required")
    private String password;
}
