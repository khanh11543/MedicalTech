package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.DoctorScheduleMapper;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorScheduleServiceImplTest {

    @Mock DoctorRepository doctorRepository;
    @Mock DoctorScheduleRepository scheduleRepository;
    @Mock ScheduleExceptionRepository exceptionRepository;
    @Mock TimeSlotRepository timeSlotRepository;
    @Mock DoctorScheduleMapper mapper;
    @Mock ActivityLoggingService activityLoggingService;

    @InjectMocks DoctorScheduleServiceImpl service;

    @Test
    void createSchedule_doctorNotFound() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.empty());
        var dto = DoctorScheduleDTO.builder()
                .dayOfWeek(1)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(12, 0))
                .build();
        assertThatThrownBy(() -> service.createSchedule(1L, dto)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void listMySchedules_empty() {
        when(scheduleRepository.findByDoctorIdOrderByDayOfWeekAscStartTimeAsc(1L)).thenReturn(List.of());
        assertThat(service.listMySchedules(1L, null)).isEmpty();
    }

    @Test
    void updateSchedule_notFound() {
        when(scheduleRepository.findByIdWithDoctor(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateSchedule(1L, 1L, DoctorScheduleDTO.builder().build()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteSchedule_notFound() {
        when(scheduleRepository.findByIdWithDoctor(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteSchedule(1L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void addScheduleException_doctorNotFound() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.addScheduleException(1L, ScheduleExceptionDTO.builder().build()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void listMyExceptions_empty() {
        when(exceptionRepository.findByDoctorIdOrderByExceptionDateAsc(1L)).thenReturn(List.of());
        when(mapper.toExceptionDTOList(anyList())).thenReturn(List.of());
        assertThat(service.listMyExceptions(1L)).isEmpty();
    }

    @Test
    void deleteScheduleException_notFound() {
        when(exceptionRepository.findByIdWithDoctor(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteScheduleException(1L, 9L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void generateTimeSlots_invalidRange() {
        var dto = GenerateSlotsDTO.builder()
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now())
                .build();
        assertThatThrownBy(() -> service.generateTimeSlots(1L, dto)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void blockSlot_slotNotFound() {
        when(timeSlotRepository.findByIdWithDoctor(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.blockSlot(1L, 1L, BlockSlotDTO.builder().reason("VACATION").build()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void unblockSlot_notFound() {
        when(timeSlotRepository.findByIdWithDoctor(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.unblockSlot(1L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void listTimeSlots() {
        when(timeSlotRepository.findByDoctorIdAndDateRange(anyLong(), any(), any())).thenReturn(List.of());
        when(mapper.toTimeSlotDTOList(anyList())).thenReturn(List.of());
        assertThat(service.listTimeSlots(1L, "2026-01-01", "2026-01-02")).isEmpty();
    }

    @Test
    void createTimeSlot_doctorNotFound() {
        when(doctorRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.createTimeSlot(1L, TimeSlotDTO.builder().build()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateTimeSlot_notFound() {
        when(timeSlotRepository.findByIdWithDoctor(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateTimeSlot(1L, 1L, TimeSlotDTO.builder().build()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteTimeSlot_notFound() {
        when(timeSlotRepository.findByIdWithDoctor(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteTimeSlot(1L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void listMyTimeSlots() {
        when(timeSlotRepository.findByDoctorIdAndDateRange(eq(1L), any(), any())).thenReturn(List.of());
        when(mapper.toTimeSlotDTOList(anyList())).thenReturn(List.of());
        var dto = GenerateSlotsDTO.builder()
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(1))
                .build();
        assertThat(service.listMyTimeSlots(1L, dto)).isEmpty();
    }
}
