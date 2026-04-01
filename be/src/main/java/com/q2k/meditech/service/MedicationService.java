package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface MedicationService {

    Page<MedicationDTO> getAllMedications(String search, String category,
            Boolean requiresPrescription, Boolean isActive,
            String sortBy, String sortDir, int page, int size);

    MedicationDTO getMedicationById(Long id);

    MedicationDTO createMedication(MedicationCreateDTO dto);

    MedicationDTO updateMedication(Long id, MedicationUpdateDTO dto);

    MedicationDTO updateInventory(Long id, InventoryUpdateDTO dto);

    MedicationDTO toggleStatus(Long id);

    Page<MedicationDTO> searchForDoctor(String search, int page, int size);

    Page<InventoryLogDTO> getInventoryLogs(Long medicationId, int page, int size);

    InventorySummaryDTO getInventorySummary();

    MedicationImportResultDTO importMedications(MultipartFile file);

    String getNextMedicationCode();
}
