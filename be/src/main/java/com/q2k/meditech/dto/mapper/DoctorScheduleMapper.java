package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.DoctorScheduleDTO;
import com.q2k.meditech.dto.ScheduleExceptionDTO;
import com.q2k.meditech.dto.TimeSlotDTO;
import com.q2k.meditech.entity.DoctorSchedule;
import com.q2k.meditech.entity.ScheduleException;
import com.q2k.meditech.entity.TimeSlot;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface DoctorScheduleMapper {

    // ========== DoctorSchedule Mappings ==========
    
    @Mapping(target = "doctorId", source = "doctor.id")
    DoctorScheduleDTO toDTO(DoctorSchedule entity);

    List<DoctorScheduleDTO> toDTOList(List<DoctorSchedule> entities);

    @Mapping(target = "doctor", ignore = true)
    @Mapping(target = "id", ignore = true)
    DoctorSchedule toEntity(DoctorScheduleDTO dto);

    @Mapping(target = "doctor", ignore = true)
    @Mapping(target = "id", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDTO(DoctorScheduleDTO dto, @MappingTarget DoctorSchedule entity);

    // ========== ScheduleException Mappings ==========
    
    @Mapping(target = "doctorId", source = "doctor.id")
    ScheduleExceptionDTO toExceptionDTO(ScheduleException entity);

    List<ScheduleExceptionDTO> toExceptionDTOList(List<ScheduleException> entities);

    @Mapping(target = "doctor", ignore = true)
    @Mapping(target = "id", ignore = true)
    ScheduleException toExceptionEntity(ScheduleExceptionDTO dto);

    // ========== TimeSlot Mappings ==========
    
    @Mapping(target = "doctorId", source = "doctor.id")
    TimeSlotDTO toTimeSlotDTO(TimeSlot entity);

    List<TimeSlotDTO> toTimeSlotDTOList(List<TimeSlot> entities);
}
