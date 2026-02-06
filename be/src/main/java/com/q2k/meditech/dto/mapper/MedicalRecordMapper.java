package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.MedicalRecordCreateDTO;
import com.q2k.meditech.dto.MedicalRecordDTO;
import com.q2k.meditech.dto.MedicalRecordUpdateDTO;
import com.q2k.meditech.entity.MedicalRecord;
import org.mapstruct.*;

/**
 * MapStruct Mapper for MedicalRecord entity
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface MedicalRecordMapper {

    /**
     * Convert MedicalRecord entity to MedicalRecordDTO
     */
    @Mapping(target = "patientId", source = "patient.id")
    @Mapping(target = "patientName", source = "patient.fullName")
    @Mapping(target = "doctorId", source = "doctor.id")
    @Mapping(target = "doctorName", source = "doctor.fullName")
    @Mapping(target = "appointmentId", source = "appointment.id")
    MedicalRecordDTO toDTO(MedicalRecord entity);

    /**
     * Convert MedicalRecordCreateDTO to MedicalRecord entity
     * Patient, Doctor and Appointment will be set manually in service
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "recordCode", ignore = true)
    @Mapping(target = "patient", ignore = true)
    @Mapping(target = "doctor", ignore = true)
    @Mapping(target = "appointment", ignore = true)
    MedicalRecord toEntity(MedicalRecordCreateDTO dto);

    /**
     * Update MedicalRecord entity from MedicalRecordUpdateDTO
     * Only non-null fields will be updated
     */
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "recordCode", ignore = true)
    @Mapping(target = "patient", ignore = true)
    @Mapping(target = "doctor", ignore = true)
    @Mapping(target = "appointment", ignore = true)
    @Mapping(target = "visitDate", ignore = true)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDTO(MedicalRecordUpdateDTO dto, @MappingTarget MedicalRecord entity);
}
