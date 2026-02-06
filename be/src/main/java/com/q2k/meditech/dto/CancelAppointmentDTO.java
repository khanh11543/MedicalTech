package com.q2k.meditech.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO hủy lịch hẹn
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CancelAppointmentDTO {
    private String cancellationReason;
}
