package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.DoctorCardDTO;
import com.q2k.meditech.dto.DoctorDetailDTO;
import com.q2k.meditech.dto.SpecialtyDTO;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.DoctorSpecialty;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for Doctor Entity <-> DTO conversions
 */
@Component
public class DoctorMapper {

    private final SpecialtyMapper specialtyMapper;

    public DoctorMapper(SpecialtyMapper specialtyMapper) {
        this.specialtyMapper = specialtyMapper;
    }

    /**
     * Convert Doctor entity to DoctorCardDTO (for search results)
     */
    public DoctorCardDTO toCardDTO(Doctor doctor, List<DoctorSpecialty> doctorSpecialties) {
        if (doctor == null) return null;

        String primarySpecialty = null;
        List<String> specialtyNames = List.of();

        if (doctorSpecialties != null && !doctorSpecialties.isEmpty()) {
            // Find primary specialty
            DoctorSpecialty primary = doctorSpecialties.stream()
                    .filter(ds -> Boolean.TRUE.equals(ds.getIsPrimary()))
                    .findFirst()
                    .orElse(doctorSpecialties.get(0));
            
            primarySpecialty = primary.getSpecialty().getName();
            
            // Get all specialty names
            specialtyNames = doctorSpecialties.stream()
                    .map(ds -> ds.getSpecialty().getName())
                    .collect(Collectors.toList());
        }

        // Extract city from office address (simple extraction)
        String city = extractCity(doctor.getOfficeAddress());

        return DoctorCardDTO.builder()
                .id(doctor.getId())
                .fullName(doctor.getFullName())
                .avatarUrl(doctor.getUser() != null ? doctor.getUser().getAvatarUrl() : null)
                .primarySpecialty(primarySpecialty)
                .specialties(specialtyNames)
                .experienceYears(doctor.getExperienceYears())
                .consultationFee(doctor.getConsultationFee())
                .ratingAvg(doctor.getRatingAvg())
                .ratingCount(doctor.getRatingCount())
                .hospitalAffiliation(doctor.getHospitalAffiliation())
                .city(city)
                .isAvailable(doctor.getIsAvailable())
                .build();
    }

    /**
     * Convert Doctor entity to DoctorDetailDTO (for detail view)
     */
    public DoctorDetailDTO toDetailDTO(Doctor doctor, List<DoctorSpecialty> doctorSpecialties) {
        if (doctor == null) return null;

        String primarySpecialty = null;
        List<SpecialtyDTO> specialties = List.of();

        if (doctorSpecialties != null && !doctorSpecialties.isEmpty()) {
            // Find primary specialty
            DoctorSpecialty primary = doctorSpecialties.stream()
                    .filter(ds -> Boolean.TRUE.equals(ds.getIsPrimary()))
                    .findFirst()
                    .orElse(doctorSpecialties.get(0));
            
            primarySpecialty = primary.getSpecialty().getName();
            
            // Convert all specialties to DTOs
            specialties = doctorSpecialties.stream()
                    .map(ds -> specialtyMapper.toDTO(ds.getSpecialty()))
                    .collect(Collectors.toList());
        }

        return DoctorDetailDTO.builder()
                .id(doctor.getId())
                .fullName(doctor.getFullName())
                .avatarUrl(doctor.getUser() != null ? doctor.getUser().getAvatarUrl() : null)
                .email(doctor.getUser() != null ? doctor.getUser().getEmail() : null)
                .phone(doctor.getUser() != null ? doctor.getUser().getPhone() : null)
                .licenseNumber(doctor.getLicenseNumber())
                .bio(doctor.getBio())
                .education(doctor.getEducation())
                .experienceYears(doctor.getExperienceYears())
                .primarySpecialty(primarySpecialty)
                .specialties(specialties)
                .consultationFee(doctor.getConsultationFee())
                .followUpFee(doctor.getFollowUpFee())
                .ratingAvg(doctor.getRatingAvg())
                .ratingCount(doctor.getRatingCount())
                .hospitalAffiliation(doctor.getHospitalAffiliation())
                .officeAddress(doctor.getOfficeAddress())
                .isAvailable(doctor.getIsAvailable())
                .verificationStatus(doctor.getVerificationStatus().name())
                .build();
    }

    /**
     * Simple city extraction from address
     */
    private String extractCity(String address) {
        if (address == null || address.isBlank()) return null;
        
        // Simple logic: take the last part after comma, or the whole string
        String[] parts = address.split(",");
        if (parts.length > 0) {
            return parts[parts.length - 1].trim();
        }
        return address.trim();
    }
}
