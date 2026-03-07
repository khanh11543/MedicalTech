package com.q2k.meditech.service;

import com.q2k.meditech.dto.SpecialtyDTO;
import com.q2k.meditech.dto.mapper.SpecialtyMapper;
import com.q2k.meditech.entity.Specialty;
import com.q2k.meditech.repository.SpecialtyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Implementation of SpecialtyService
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class SpecialtyServiceImpl implements SpecialtyService {

    private final SpecialtyRepository specialtyRepository;
    private final SpecialtyMapper specialtyMapper;

    @Override
    public List<SpecialtyDTO> searchSpecialties(String query, Boolean isActive) {
        log.debug("Searching specialties with query: {}, isActive: {}", query, isActive);
        
        List<Specialty> specialties = specialtyRepository.searchSpecialties(query, isActive);
        return specialtyMapper.toDTOList(specialties);
    }

    @Override
    @Cacheable(value = "activeSpecialties")
    public List<SpecialtyDTO> getAllActiveSpecialties() {
        log.debug("Getting all active specialties");
        
        List<Specialty> specialties = specialtyRepository.findByIsActiveTrueOrderByNameAsc();
        return specialtyMapper.toDTOList(specialties);
    }

    @Override
    @Cacheable(value = "specialty", key = "#id")
    public SpecialtyDTO getSpecialtyById(Integer id) {
        log.debug("Getting specialty by id: {}", id);
        
        return specialtyRepository.findById(id)
                .map(specialtyMapper::toDTO)
                .orElse(null);
    }
}
