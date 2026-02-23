package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating receptionist info via admin
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateReceptionistDTO {
    private String fullName;
    private String phone;
    private String employeeId;
    private String department;
    private String shift;
    private Boolean isActive;
}
