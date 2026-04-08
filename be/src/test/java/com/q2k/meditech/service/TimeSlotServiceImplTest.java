package com.q2k.meditech.service;

import com.q2k.meditech.dto.BulkActionResultDTO;
import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.timeslot.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.BlockReason;
import com.q2k.meditech.entity.enums.SlotSource;
import com.q2k.meditech.entity.enums.TimeSlotStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TimeSlotServiceImplTest {

    @Mock TimeSlotRepository timeSlotRepository;
    @Mock TimeSlotTemplateRepository templateRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock UserRepository userRepository;
    @Mock AppointmentRepository appointmentRepository;
    @Mock ClinicHolidayRepository holidayRepository;
    @Mock ClinicWorkingHoursRepository workingHoursRepository;
    @Mock JdbcTemplate jdbcTemplate;
    @Mock ActivityLoggingService activityLoggingService;

    @InjectMocks TimeSlotServiceImpl service;

    private Doctor doctor1() {
        Doctor d = Doctor.builder()
                .user(User.builder().email("d@d.d").fullName("D").build())
                .fullName("D")
                .build();
        d.setId(1L);
        return d;
    }

    @Test
    void getAllTimeSlots_empty() {
        var filter = TimeSlotFilterDTO.builder().build();
        when(timeSlotRepository.findAllWithFilters(any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());
        assertThat(service.getAllTimeSlots(filter).getContent()).isEmpty();
    }

    @Test
    void getSlotById_notFound() {
        when(timeSlotRepository.findByIdWithDoctor(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getSlotById(9L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createSingleSlot_rejectsPastDate() {
        var dto = CreateSingleSlotDTO.builder()
                .doctorId(1L)
                .slotDate(LocalDate.now().minusDays(1))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(10, 0))
                .build();
        assertThatThrownBy(() -> service.createSingleSlot(dto, 1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateSlot_notFound() {
        when(timeSlotRepository.findByIdWithDoctor(1L)).thenReturn(Optional.empty());
        var dto = UpdateSlotDTO.builder()
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(11, 0))
                .confirmHighRisk(true)
                .build();
        assertThatThrownBy(() -> service.updateSlot(1L, dto, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteSlot_notFound() {
        when(timeSlotRepository.findByIdWithDoctor(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteSlot(1L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void blockSlot_notFound() {
        when(timeSlotRepository.findByIdWithDoctor(1L)).thenReturn(Optional.empty());
        var dto = BlockSlotRequestDTO.builder().reason("VACATION").build();
        assertThatThrownBy(() -> service.blockSlot(1L, dto, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void unblockSlot_notBlocked() {
        TimeSlot slot = TimeSlot.builder()
                .doctor(doctor1())
                .slotDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(9, 30))
                .status(TimeSlotStatus.AVAILABLE)
                .source(SlotSource.MANUAL)
                .build();
        slot.setId(5L);
        when(timeSlotRepository.findByIdWithDoctor(5L)).thenReturn(Optional.of(slot));
        assertThatThrownBy(() -> service.unblockSlot(5L, 1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void bulkBlockSlots_missingSlot() {
        when(timeSlotRepository.findAllByIds(List.of(99L))).thenReturn(List.of());
        var dto = BulkBlockSlotsDTO.builder()
                .timeSlotIds(List.of(99L))
                .reason("OTHER")
                .build();
        BulkActionResultDTO r = service.bulkBlockSlots(dto, 1L);
        assertThat(r.getFailCount()).isPositive();
    }

    @Test
    void bulkUnblockSlots_missingSlot() {
        when(timeSlotRepository.findAllByIds(List.of(99L))).thenReturn(List.of());
        var dto = BulkUnblockSlotsDTO.builder().timeSlotIds(List.of(99L)).build();
        BulkActionResultDTO r = service.bulkUnblockSlots(dto, 1L);
        assertThat(r.getFailCount()).isPositive();
    }

    @Test
    void previewBulkCreate_delegates() {
        LocalDate d = LocalDate.now();
        var dto = BulkCreateSlotsDTO.builder()
                .doctorIds(List.of(1L))
                .startDate(d)
                .endDate(d)
                .daysOfWeek(List.of(d.getDayOfWeek().name()))
                .timeSlots(List.of(TimeSlotConfigDTO.builder()
                        .startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(10, 0))
                        .build()))
                .breakTimes(List.of())
                .slotDuration(30)
                .build();
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor1()));
        when(holidayRepository.findBlockedDatesInRange(any(), any())).thenReturn(List.of());
        when(timeSlotRepository.findByDoctorIdsAndDateRange(any(), any(), any())).thenReturn(List.of());
        assertThat(service.previewBulkCreate(dto)).isNotNull();
    }

    @Test
    void bulkCreateSlots_previewOnly() {
        LocalDate d = LocalDate.now();
        var dto = BulkCreateSlotsDTO.builder()
                .doctorIds(List.of(1L))
                .startDate(d)
                .endDate(d)
                .daysOfWeek(List.of(d.getDayOfWeek().name()))
                .timeSlots(List.of(TimeSlotConfigDTO.builder()
                        .startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(10, 0))
                        .build()))
                .breakTimes(List.of())
                .slotDuration(30)
                .previewOnly(true)
                .build();
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor1()));
        when(holidayRepository.findBlockedDatesInRange(any(), any())).thenReturn(List.of());
        when(timeSlotRepository.findByDoctorIdsAndDateRange(any(), any(), any())).thenReturn(List.of());
        BulkActionResultDTO r = service.bulkCreateSlots(dto, 1L);
        assertThat(r.getMessage()).containsIgnoringCase("Preview");
    }

    @Test
    void rollbackBatch() {
        when(timeSlotRepository.deleteAvailableByBatchId("b1")).thenReturn(2);
        MessageDTO m = service.rollbackBatch("b1", 1L);
        assertThat(m.getSuccess()).isTrue();
    }

    @Test
    void getAllTemplates_activeOnly() {
        when(templateRepository.findByIsActiveTrueOrderByTemplateNameAsc()).thenReturn(List.of());
        assertThat(service.getAllTemplates(true)).isEmpty();
    }

    @Test
    void getTemplateById_notFound() {
        when(templateRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getTemplateById(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createTemplate_duplicateName() {
        when(templateRepository.existsByTemplateName("T")).thenReturn(true);
        var dto = CreateTemplateDTO.builder()
                .templateName("T")
                .daysOfWeek(List.of("MONDAY"))
                .timeSlots(List.of(TimeSlotConfigDTO.builder()
                        .startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(10, 0))
                        .build()))
                .slotDuration(30)
                .isActive(true)
                .build();
        assertThatThrownBy(() -> service.createTemplate(dto)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateTemplate_notFound() {
        when(templateRepository.findById(1L)).thenReturn(Optional.empty());
        var dto = UpdateTemplateDTO.builder()
                .templateName("X")
                .daysOfWeek(List.of("MONDAY"))
                .timeSlots(List.of(TimeSlotConfigDTO.builder()
                        .startTime(LocalTime.of(9, 0))
                        .endTime(LocalTime.of(10, 0))
                        .build()))
                .slotDuration(30)
                .isActive(true)
                .build();
        assertThatThrownBy(() -> service.updateTemplate(1L, dto)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteTemplate_notFound() {
        when(templateRepository.existsById(1L)).thenReturn(false);
        assertThatThrownBy(() -> service.deleteTemplate(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void previewApplyTemplate_notFound() {
        when(templateRepository.findById(1L)).thenReturn(Optional.empty());
        var dto = ApplyTemplateDTO.builder()
                .doctorIds(List.of(1L))
                .startDate(LocalDate.now())
                .endDate(LocalDate.now())
                .build();
        assertThatThrownBy(() -> service.previewApplyTemplate(1L, dto)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void applyTemplate_previewOnly() {
        TimeSlotTemplate tpl = TimeSlotTemplate.builder()
                .templateName("t")
                .daysOfWeek(List.of(LocalDate.now().getDayOfWeek().name()))
                .timeSlots(List.of(Map.of("startTime", "09:00", "endTime", "10:00")))
                .breakTimes(List.of())
                .slotDuration(30)
                .isActive(true)
                .build();
        tpl.setId(1L);
        when(templateRepository.findById(1L)).thenReturn(Optional.of(tpl));
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor1()));
        when(holidayRepository.findBlockedDatesInRange(any(), any())).thenReturn(List.of());
        when(timeSlotRepository.findByDoctorIdsAndDateRange(any(), any(), any())).thenReturn(List.of());
        var dto = ApplyTemplateDTO.builder()
                .doctorIds(List.of(1L))
                .startDate(LocalDate.now())
                .endDate(LocalDate.now())
                .previewOnly(true)
                .build();
        assertThat(service.applyTemplate(1L, dto, 1L).getMessage()).containsIgnoringCase("Preview");
    }

    @Test
    void getCalendarView() {
        LocalDate from = LocalDate.now();
        when(timeSlotRepository.countByDateAndStatus(from, from, 1L)).thenReturn(List.of());
        assertThat(service.getCalendarView(from, from, 1L)).isNotEmpty();
    }

    @Test
    void getStatistics() {
        when(timeSlotRepository.countByStatusForDate(any(), any())).thenReturn(List.of());
        when(timeSlotRepository.countAvailablePerDoctorForDate(any())).thenReturn(List.of());
        assertThat(service.getStatistics(LocalDate.now(), 1L).getTotalSlots()).isZero();
    }

    @Test
    void getAllHolidays_withYear() {
        when(holidayRepository.findByYearAndIsActiveTrueOrderByHolidayDateAsc(2026)).thenReturn(List.of());
        assertThat(service.getAllHolidays(2026)).isEmpty();
    }

    @Test
    void createHoliday_duplicateDate() {
        when(holidayRepository.existsByHolidayDate(LocalDate.of(2026, 1, 1))).thenReturn(true);
        var dto = ClinicHolidayDTO.builder()
                .holidayDate(LocalDate.of(2026, 1, 1))
                .name("N")
                .autoBlockSlots(false)
                .preventSlotCreation(true)
                .isActive(true)
                .build();
        assertThatThrownBy(() -> service.createHoliday(dto, 1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void updateHoliday_notFound() {
        when(holidayRepository.findById(1L)).thenReturn(Optional.empty());
        var dto = ClinicHolidayDTO.builder()
                .holidayDate(LocalDate.of(2026, 1, 1))
                .name("N")
                .autoBlockSlots(false)
                .preventSlotCreation(false)
                .isActive(true)
                .build();
        assertThatThrownBy(() -> service.updateHoliday(1L, dto, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteHoliday_notFound() {
        when(holidayRepository.existsById(1L)).thenReturn(false);
        assertThatThrownBy(() -> service.deleteHoliday(1L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getAllWorkingHours() {
        when(workingHoursRepository.findAllByOrderByDayOfWeekAsc()).thenReturn(List.of());
        assertThat(service.getAllWorkingHours()).isEmpty();
    }

    @Test
    void upsertWorkingHours() {
        when(workingHoursRepository.findByDayOfWeek(1)).thenReturn(Optional.empty());
        var dto = ClinicWorkingHoursDTO.builder()
                .dayOfWeek(1)
                .openTime(LocalTime.of(8, 0))
                .closeTime(LocalTime.of(17, 0))
                .isOpen(true)
                .build();
        when(workingHoursRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        assertThat(service.upsertWorkingHours(dto, 1L).getDayOfWeek()).isEqualTo(1);
    }

    @Test
    void deleteWorkingHours_notFound() {
        when(workingHoursRepository.existsById(9L)).thenReturn(false);
        assertThatThrownBy(() -> service.deleteWorkingHours(9L, 1L)).isInstanceOf(ResourceNotFoundException.class);
    }
}
