package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.DoctorDocumentCreateDTO;
import com.q2k.meditech.dto.DoctorDocumentDTO;
import com.q2k.meditech.entity.DoctorDocument;
import com.q2k.meditech.entity.enums.DoctorDocumentType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for DoctorDocument Entity <-> DTO conversions
 */
@Component
public class DoctorDocumentMapper {

    /**
     * Convert DoctorDocument entity to DoctorDocumentDTO
     */
    public DoctorDocumentDTO toDTO(DoctorDocument entity) {
        if (entity == null) return null;

        String docTypeStr = entity.getDocType() != null ? entity.getDocType().name() : null;

        return DoctorDocumentDTO.builder()
                .id(entity.getId())
                .doctorId(entity.getDoctor() != null ? entity.getDoctor().getId() : null)
                .doctorName(entity.getDoctor() != null ? entity.getDoctor().getFullName() : null)
                .doctorEmail(entity.getDoctor() != null && entity.getDoctor().getUser() != null 
                        ? entity.getDoctor().getUser().getEmail() : null)
                .docType(docTypeStr)
                .docTypeDescription(DoctorDocumentDTO.getDocTypeDescription(docTypeStr))
                .fileUrl(entity.getFileUrl())
                .fileHash(entity.getFileHash())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .reviewedById(entity.getReviewedBy() != null ? entity.getReviewedBy().getId() : null)
                .reviewedByEmail(entity.getReviewedBy() != null ? entity.getReviewedBy().getEmail() : null)
                .reviewedAt(entity.getReviewedAt())
                .reviewNote(entity.getReviewNote())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    /**
     * Convert list of DoctorDocument entities to list of DTOs
     */
    public List<DoctorDocumentDTO> toDTOList(List<DoctorDocument> entities) {
        if (entities == null) return List.of();
        return entities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Convert DoctorDocumentCreateDTO to DoctorDocument entity
     * Note: doctor must be set separately
     */
    public DoctorDocument toEntity(DoctorDocumentCreateDTO dto) {
        if (dto == null) return null;

        return DoctorDocument.builder()
                .docType(DoctorDocumentType.valueOf(dto.getDocType()))
                .fileUrl(dto.getFileUrl())
                .fileHash(dto.getFileHash())
                .build();
    }
}