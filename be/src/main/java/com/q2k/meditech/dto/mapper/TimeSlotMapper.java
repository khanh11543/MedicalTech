package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.TimeSlotDTO;
import com.q2k.meditech.entity.TimeSlot;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for TimeSlot Entity <-> DTO conversions
 */
@Component
public class TimeSlotMapper {

    public TimeSlotDTO toDTO(TimeSlot entity) {
        if (entity == null) return null;

        return TimeSlotDTO.builder()
                .id(entity.getId())
                .doctorId(entity.getDoctor() != null ? entity.getDoctor().getId() : null)
                .slotDate(entity.getSlotDate())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .status(entity.getStatus())
                .build();
    }

    public List<TimeSlotDTO> toDTOList(List<TimeSlot> entities) {
        if (entities == null) return List.of();

        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}
