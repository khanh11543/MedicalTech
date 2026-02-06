package com.q2k.meditech.service;

import com.q2k.meditech.dto.SpecialtyDTO;
import com.q2k.meditech.entity.Specialty;
import com.q2k.meditech.repository.SpecialtyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SpecialtyService {

    @Autowired
    private SpecialtyRepository specialtyRepository;

    public List<SpecialtyDTO> getAllSpecialties(Boolean isActive) {
        List<Specialty> specialties;

        if (isActive != null) {
            specialties = specialtyRepository.findByIsActive(isActive);
        } else {
            specialties = specialtyRepository.findAll();
        }

        return specialties.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private SpecialtyDTO convertToDTO(Specialty specialty) {
        SpecialtyDTO dto = new SpecialtyDTO();
        dto.setId(specialty.getId());
        dto.setName(specialty.getName());
        dto.setDescription(specialty.getDescription());
        dto.setIconUrl(specialty.getIconUrl());
        dto.setIsActive(specialty.getIsActive());
        dto.setCreatedAt(specialty.getCreatedAt());
        dto.setUpdatedAt(specialty.getUpdatedAt());
        return dto;
    }
}
