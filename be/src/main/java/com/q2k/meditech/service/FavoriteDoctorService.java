package com.q2k.meditech.service;

import com.q2k.meditech.dto.FavoriteDoctorDTO;
import com.q2k.meditech.dto.FavoriteListResponse;
import com.q2k.meditech.entity.FavoriteDoctor;
import com.q2k.meditech.entity.Specialty;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.FavoriteDoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FavoriteDoctorService {

    @Autowired
    private FavoriteDoctorRepository favoriteDoctorRepository;

    public FavoriteListResponse getFavorites(Long patientId, Integer pageNumber, Integer pageSize) {
        if (patientId == null) {
            throw new IllegalArgumentException("patientId is required");
        }

        Pageable pageable = PageRequest.of(
                pageNumber != null && pageNumber >= 0 ? pageNumber : 0,
                pageSize != null && pageSize > 0 ? pageSize : 20
        );

        Page<FavoriteDoctor> page = favoriteDoctorRepository.findByPatientIdOrderByCreatedAtDesc(patientId, pageable);

        List<FavoriteDoctorDTO> favorites = page.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        FavoriteListResponse response = new FavoriteListResponse();
        response.setFavorites(favorites);
        response.setTotalPages(page.getTotalPages());
        response.setTotalElements(page.getTotalElements());
        response.setCurrentPage(page.getNumber());
        response.setPageSize(page.getSize());

        return response;
    }

    @Transactional
    public void removeFavorite(Long favoriteId, Long patientId) {
        if (favoriteId == null) {
            throw new IllegalArgumentException("favoriteId is required");
        }
        if (patientId == null) {
            throw new IllegalArgumentException("patientId is required");
        }

        FavoriteDoctor favorite = favoriteDoctorRepository.findById(favoriteId)
                .orElseThrow(() -> new ResourceNotFoundException("FavoriteDoctor", "id", favoriteId));

        // Verify the favorite belongs to the patient
        if (!favorite.getPatient().getId().equals(patientId)) {
            throw new IllegalArgumentException("Favorite does not belong to this patient");
        }

        favoriteDoctorRepository.delete(favorite);
    }

    private FavoriteDoctorDTO convertToDTO(FavoriteDoctor favorite) {
        FavoriteDoctorDTO dto = new FavoriteDoctorDTO();
        dto.setId(favorite.getId());
        dto.setDoctorId(favorite.getDoctor() != null ? favorite.getDoctor().getId() : null);
        dto.setDoctorName(favorite.getDoctor() != null ? favorite.getDoctor().getFullName() : null);
        dto.setAvatarUrl(favorite.getDoctor() != null && favorite.getDoctor().getUser() != null 
                ? favorite.getDoctor().getUser().getAvatarUrl() : null);
        dto.setSpecialties(favorite.getDoctor() != null && favorite.getDoctor().getSpecialties() != null
                ? favorite.getDoctor().getSpecialties().stream()
                    .map(Specialty::getName)
                    .collect(Collectors.toList())
                : null);
        dto.setExperienceYears(favorite.getDoctor() != null ? favorite.getDoctor().getExperienceYears() : null);
        dto.setConsultationFee(favorite.getDoctor() != null ? favorite.getDoctor().getConsultationFee() : null);
        dto.setRatingAvg(favorite.getDoctor() != null ? favorite.getDoctor().getRatingAvg() : null);
        dto.setRatingCount(favorite.getDoctor() != null ? favorite.getDoctor().getRatingCount() : null);
        dto.setHospitalAffiliation(favorite.getDoctor() != null ? favorite.getDoctor().getHospitalAffiliation() : null);
        dto.setIsAvailable(favorite.getDoctor() != null ? favorite.getDoctor().getIsAvailable() : null);
        dto.setCreatedAt(favorite.getCreatedAt());
        return dto;
    }
}
