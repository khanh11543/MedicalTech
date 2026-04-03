package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.MedicalServiceDTO;
import com.q2k.meditech.entity.MedicalService;
import com.q2k.meditech.entity.enums.ServiceCategory;
import com.q2k.meditech.repository.MedicalServiceRepository;
import com.q2k.meditech.service.MedicalServiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MedicalServiceServiceImpl implements MedicalServiceService {

    private final MedicalServiceRepository medicalServiceRepository;

    @Override
    public List<MedicalServiceDTO> getAllActiveServices() {
        return medicalServiceRepository.findByActiveTrueOrderByServiceNameAsc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<MedicalServiceDTO> getServicesByCategory(String category) {
        ServiceCategory cat = ServiceCategory.valueOf(category);
        return medicalServiceRepository.findByCategoryAndActiveTrueOrderByServiceNameAsc(cat)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private MedicalServiceDTO toDTO(MedicalService entity) {
        return MedicalServiceDTO.builder()
                .id(entity.getId())
                .serviceName(entity.getServiceName())
                .category(entity.getCategory().name())
                .defaultPrice(entity.getDefaultPrice())
                .description(entity.getDescription())
                .active(entity.getActive())
                .build();
    }
}
