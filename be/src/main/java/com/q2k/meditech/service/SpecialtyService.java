package com.q2k.meditech.service;

import com.q2k.meditech.dto.SpecialtyDTO;

import java.util.List;

/**
 * Service interface for Specialty operations
 */
public interface SpecialtyService {

    /**
     * Search specialties with optional filters
     * @param query Search keyword for specialty name
     * @param isActive Filter by active status
     * @return List of matching specialties
     */
    List<SpecialtyDTO> searchSpecialties(String query, Boolean isActive);

    /**
     * Get all active specialties
     * @return List of active specialties
     */
    List<SpecialtyDTO> getAllActiveSpecialties();

    /**
     * Get specialty by ID
     * @param id Specialty ID
     * @return Specialty DTO or null if not found
     */
    SpecialtyDTO getSpecialtyById(Long id);

    /**
     * Get specialty by slug
     * @param slug Specialty slug
     * @return Specialty DTO
     * @throws ResourceNotFoundException if not found
     */
    SpecialtyDTO getSpecialtyBySlug(String slug);
}
