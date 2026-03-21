package com.q2k.meditech.service;

import com.q2k.meditech.dto.AffectedAppointmentDTO;
import com.q2k.meditech.dto.TimeOffRequestDTO;
import com.q2k.meditech.entity.enums.TimeOffStatus;
import com.q2k.meditech.entity.enums.TimeOffType;

import java.time.LocalDate;
import java.util.List;

public interface TimeOffRequestService {

    /** Create a new time-off request. Runs conflict check and auto-approves if no conflict. */
    TimeOffRequestDTO create(Long doctorId, TimeOffRequestDTO dto);

    /** List all time-off requests for a doctor, newest date first. */
    List<TimeOffRequestDTO> list(Long doctorId);

    /** Get a single request by ID (must belong to the doctor). */
    TimeOffRequestDTO getById(Long doctorId, Long requestId);

    /**
     * Update a PENDING_REVIEW request.
     * Triggers a fresh conflict check after update.
     */
    TimeOffRequestDTO update(Long doctorId, Long requestId, TimeOffRequestDTO dto);

    /** Cancel a request (doctor self-cancel). Allowed when not yet APPROVED or already effective. */
    TimeOffRequestDTO cancel(Long doctorId, Long requestId);

    /** Return the list of appointments that are in conflict with the request. */
    List<AffectedAppointmentDTO> getAffectedAppointments(Long doctorId, Long requestId);

    // ---- Admin operations ----

    /** Admin: list requests with optional filters. Null values are ignored (match all). */
    List<TimeOffRequestDTO> adminList(TimeOffStatus status, Long doctorId,
                                      TimeOffType type, LocalDate dateFrom, LocalDate dateTo);

    /** Admin: get a single request (any doctor). */
    TimeOffRequestDTO adminGetById(Long requestId);

    /** Admin: approve a PENDING_REVIEW request. */
    TimeOffRequestDTO adminApprove(Long requestId);

    /** Admin: reject a request with a required reason. */
    TimeOffRequestDTO adminReject(Long requestId, String reviewNotes);

    /** Admin: get all appointments conflicting with a request (any doctor). */
    List<AffectedAppointmentDTO> adminGetAffectedAppointments(Long requestId);
}
