package com.q2k.meditech.dto.receptionist;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.*;

/**
 * DTO for receptionist to update patient demographic info.
 * RESTRICTED: fullName, DOB, gender, MRN are NOT editable (admin only).
 * Only phone, email, address, insurance, emergency contact allowed.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePatientDemographicDTO {

    @Size(min = 8, max = 20, message = "Phone must be 8-20 characters")
    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    @Size(max = 500, message = "Address max 500 characters")
    private String address;

    @Size(max = 50, message = "Insurance number max 50 characters")
    private String insuranceNumber;

    @Size(max = 100, message = "Insurance provider max 100 characters")
    private String insuranceProvider;

    @Size(max = 20, message = "Emergency contact max 20 characters")
    private String emergencyContact;
}
