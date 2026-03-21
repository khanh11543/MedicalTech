package com.q2k.meditech.dto;

import com.q2k.meditech.entity.enums.TimeOffStatus;
import com.q2k.meditech.entity.enums.TimeOffType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeOffRequestDTO {

    private Long id;

    @NotNull(message = "Type is required")
    private TimeOffType type;

    /** YYYY-MM-DD */
    @NotBlank(message = "Date is required")
    private String date;

    /** HH:mm — required for PARTIAL_DAY, BREAK, BLOCKED_TIME */
    private String startTime;

    /** HH:mm — required for PARTIAL_DAY, BREAK, BLOCKED_TIME */
    private String endTime;

    @NotBlank(message = "Reason is required")
    private String reason;

    private String notes;

    // ---- response-only fields ----

    /** Populated in admin/overview views */
    private Long doctorId;
    private String doctorName;

    /** Set when admin rejects a request */
    private String reviewNotes;

    private TimeOffStatus status;
    private int affectedAppointmentsCount;
    private boolean hasHeavyConflict;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Populated for pending / affected detail view */
    private List<AffectedAppointmentDTO> affectedAppointments;
}
