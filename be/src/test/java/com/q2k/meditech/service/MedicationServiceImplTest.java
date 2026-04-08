package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.MedicationInventoryLogRepository;
import com.q2k.meditech.repository.MedicationInventoryRepository;
import com.q2k.meditech.repository.MedicationRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedicationServiceImplTest {

    @Mock MedicationRepository medicationRepository;
    @Mock MedicationInventoryRepository inventoryRepository;
    @Mock MedicationInventoryLogRepository inventoryLogRepository;
    @Mock UserRepository userRepository;

    @InjectMocks MedicationServiceImpl service;

    @Test
    void getAllMedications_empty() {
        when(medicationRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(service.getAllMedications(null, null, null, null, null, "ASC", 0, 10).getContent()).isEmpty();
    }

    @Test
    void getMedicationById_notFound() {
        when(medicationRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getMedicationById(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createMedication_duplicateCode() {
        when(medicationRepository.existsByCode("C1")).thenReturn(true);
        var dto = MedicationCreateDTO.builder().code("C1").name("N").category("X").unitPrice(java.math.BigDecimal.ONE).build();
        assertThatThrownBy(() -> service.createMedication(dto)).isInstanceOf(com.q2k.meditech.exception.AppException.class);
    }

    @Test
    void updateMedication_notFound() {
        when(medicationRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.updateMedication(1L, MedicationUpdateDTO.builder().build()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateInventory_notFound() {
        when(medicationRepository.findById(1L)).thenReturn(Optional.empty());
        var inv = InventoryUpdateDTO.builder().type("ADJUST").quantity(0).build();
        assertThatThrownBy(() -> service.updateInventory(1L, inv)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void toggleStatus_notFound() {
        when(medicationRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.toggleStatus(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getInventoryLogs() {
        var med = com.q2k.meditech.entity.Medication.builder()
                .code("C").name("N").unitPrice(java.math.BigDecimal.ONE).build();
        med.setId(1L);
        when(medicationRepository.findById(1L)).thenReturn(Optional.of(med));
        when(inventoryLogRepository.findByMedicationIdOrderByChangedAtDesc(eq(1L), any()))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(service.getInventoryLogs(1L, 0, 10).getContent()).isEmpty();
    }

    @Test
    void getInventorySummary() {
        when(medicationRepository.findAll()).thenReturn(List.of());
        when(inventoryRepository.findAll()).thenReturn(List.of());
        assertThat(service.getInventorySummary().getTotalMedications()).isZero();
    }

    @Test
    void importMedications_emptyFile() {
        MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(true);
        assertThatThrownBy(() -> service.importMedications(file)).isInstanceOf(com.q2k.meditech.exception.AppException.class);
    }

    @Test
    void searchForDoctor() {
        when(medicationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.searchForDoctor("asp", 0, 10).getContent()).isEmpty();
    }

    @Test
    void getNextMedicationCode() {
        when(medicationRepository.findMaxMedicationCodeNumber()).thenReturn(5L);
        assertThat(service.getNextMedicationCode()).isEqualTo("MED0006");
    }
}
