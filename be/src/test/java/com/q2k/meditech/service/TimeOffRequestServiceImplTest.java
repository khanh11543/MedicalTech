package com.q2k.meditech.service;

import com.q2k.meditech.dto.TimeOffRequestDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.TimeOffRequest;
import com.q2k.meditech.entity.enums.TimeOffStatus;
import com.q2k.meditech.entity.enums.TimeOffType;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.AppointmentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.TimeOffRequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TimeOffRequestServiceImplTest {

    @Mock private TimeOffRequestRepository timeOffRepo;
    @Mock private AppointmentRepository appointmentRepo;
    @Mock private DoctorRepository doctorRepo;

    @InjectMocks
    private TimeOffRequestServiceImpl service;

    private Doctor doctor() {
        return Doctor.builder().id(1L).fullName("D").build();
    }

    private TimeOffRequestDTO fullDayDto() {
        return TimeOffRequestDTO.builder()
                .type(TimeOffType.FULL_DAY)
                .date(LocalDate.now().plusDays(1).toString())
                .reason("vacation")
                .build();
    }

    @Test
    void create_autoApprove_noConflict() {
        when(doctorRepo.findById(1L)).thenReturn(Optional.of(doctor()));
        when(appointmentRepo.findActiveAppointmentsByDoctorOnDate(eq(1L), any())).thenReturn(List.of());
        when(timeOffRepo.save(any())).thenAnswer(i -> {
            TimeOffRequest r = i.getArgument(0);
            r.setId(10L);
            return r;
        });

        TimeOffRequestDTO out = service.create(1L, fullDayDto());
        assertThat(out.getStatus()).isEqualTo(TimeOffStatus.APPROVED);
    }

    @Test
    void list() {
        TimeOffRequest r = TimeOffRequest.builder().id(1L).doctor(doctor()).type(TimeOffType.FULL_DAY)
                .date(LocalDate.now()).reason("r").status(TimeOffStatus.APPROVED)
                .affectedAppointmentsCount(0).hasHeavyConflict(false).build();
        when(timeOffRepo.findByDoctorId(1L)).thenReturn(List.of(r));

        assertThat(service.list(1L)).hasSize(1);
    }

    @Test
    void getById() {
        TimeOffRequest r = TimeOffRequest.builder().id(2L).doctor(doctor()).type(TimeOffType.FULL_DAY)
                .date(LocalDate.now().plusDays(1)).reason("r").status(TimeOffStatus.APPROVED)
                .affectedAppointmentsCount(0).hasHeavyConflict(false).build();
        when(timeOffRepo.findByIdAndDoctorId(2L, 1L)).thenReturn(Optional.of(r));

        assertThat(service.getById(1L, 2L).getId()).isEqualTo(2L);
    }

    @Test
    void cancel_invalid_throws() {
        TimeOffRequest r = TimeOffRequest.builder().id(1L).doctor(doctor()).status(TimeOffStatus.CANCELLED).build();
        when(timeOffRepo.findByIdAndDoctorId(1L, 1L)).thenReturn(Optional.of(r));
        assertThatThrownBy(() -> service.cancel(1L, 1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void getAffectedAppointments() {
        TimeOffRequest r = TimeOffRequest.builder().id(1L).doctor(doctor()).type(TimeOffType.FULL_DAY)
                .date(LocalDate.now()).reason("r").status(TimeOffStatus.PENDING_REVIEW)
                .startTime(null).endTime(null)
                .affectedAppointmentsCount(0).hasHeavyConflict(false).build();
        when(timeOffRepo.findByIdAndDoctorId(1L, 1L)).thenReturn(Optional.of(r));
        when(appointmentRepo.findActiveAppointmentsByDoctorOnDate(1L, r.getDate())).thenReturn(List.of());

        assertThat(service.getAffectedAppointments(1L, 1L)).isEmpty();
    }

    @Test
    void adminList() {
        when(timeOffRepo.findAllForAdmin(isNull(), isNull(), isNull(), isNull(), isNull())).thenReturn(List.of());
        assertThat(service.adminList(null, null, null, null, null)).isEmpty();
    }

    @Test
    void adminApprove() {
        TimeOffRequest r = TimeOffRequest.builder().id(1L).doctor(doctor()).status(TimeOffStatus.PENDING_REVIEW)
                .type(TimeOffType.FULL_DAY).date(LocalDate.now()).reason("r")
                .affectedAppointmentsCount(0).hasHeavyConflict(false).build();
        when(timeOffRepo.findById(1L)).thenReturn(Optional.of(r));
        when(timeOffRepo.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.adminApprove(1L).getStatus()).isEqualTo(TimeOffStatus.APPROVED);
    }

    @Test
    void adminReject_blankReason_throws() {
        assertThatThrownBy(() -> service.adminReject(1L, "  ")).isInstanceOf(BadRequestException.class);
    }

    @Test
    void adminGetAffectedAppointments() {
        TimeOffRequest r = TimeOffRequest.builder().id(1L).doctor(doctor()).type(TimeOffType.FULL_DAY)
                .date(LocalDate.now()).reason("r").status(TimeOffStatus.APPROVED)
                .affectedAppointmentsCount(0).hasHeavyConflict(false).build();
        when(timeOffRepo.findById(1L)).thenReturn(Optional.of(r));
        when(appointmentRepo.findActiveAppointmentsByDoctorOnDate(1L, r.getDate())).thenReturn(List.of());

        assertThat(service.adminGetAffectedAppointments(1L)).isEmpty();
    }
}
