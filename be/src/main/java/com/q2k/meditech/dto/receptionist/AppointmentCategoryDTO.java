package com.q2k.meditech.dto.receptionist;

import lombok.*;

/**
 * DTO for appointment category (reason for visit).
 * Receptionist selects from a dropdown instead of free text.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentCategoryDTO {

    private Long id;
    private String name;
    private String description;
    private boolean active;
}
