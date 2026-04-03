package com.q2k.meditech.service;

import com.q2k.meditech.dto.MedicalServiceDTO;

import java.util.List;

public interface MedicalServiceService {

    List<MedicalServiceDTO> getAllActiveServices();

    List<MedicalServiceDTO> getServicesByCategory(String category);
}
