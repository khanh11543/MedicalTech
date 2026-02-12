package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.SpecialtyDTO;
import com.q2k.meditech.entity.Specialty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for Specialty Entity <-> DTO conversions
 */
@Component
public class SpecialtyMapper {

    public SpecialtyDTO toDTO(Specialty entity) {
        if (entity == null) return null;
        
        return SpecialtyDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .iconUrl(entity.getIconUrl())
                .isActive(entity.getIsActive())
                .build();
    }

    public List<SpecialtyDTO> toDTOList(List<Specialty> entities) {
        if (entities == null) return List.of();
        
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Specialty toEntity(SpecialtyDTO dto) {
        if (dto == null) return null;
        
        return Specialty.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .iconUrl(dto.getIconUrl())
                .isActive(dto.getIsActive())
                .build();
    }
}
