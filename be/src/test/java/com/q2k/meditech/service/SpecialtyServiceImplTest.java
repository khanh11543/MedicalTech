package com.q2k.meditech.service;

import com.q2k.meditech.dto.SpecialtyDTO;
import com.q2k.meditech.dto.mapper.SpecialtyMapper;
import com.q2k.meditech.entity.Specialty;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.SpecialtyRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SpecialtyServiceImplTest {

    @Mock SpecialtyRepository specialtyRepository;
    @Mock SpecialtyMapper specialtyMapper;

    @InjectMocks SpecialtyServiceImpl specialtyService;

    @Test
    void searchSpecialties_delegatesToRepository() {
        Specialty s = new Specialty();
        when(specialtyRepository.searchSpecialties("c", true)).thenReturn(List.of(s));
        when(specialtyMapper.toDTOList(anyList())).thenReturn(List.of(SpecialtyDTO.builder().id(1L).build()));

        List<SpecialtyDTO> out = specialtyService.searchSpecialties("c", true);

        assertThat(out).hasSize(1);
        verify(specialtyRepository).searchSpecialties("c", true);
    }

    @Test
    void getAllActiveSpecialties_mapsResults() {
        when(specialtyRepository.findByIsActiveTrueOrderByNameAsc()).thenReturn(List.of(new Specialty()));
        when(specialtyMapper.toDTOList(anyList())).thenReturn(List.of());

        assertThat(specialtyService.getAllActiveSpecialties()).isEmpty();
    }

    @Test
    void getSpecialtyById_returnsNullWhenMissing() {
        when(specialtyRepository.findById(9L)).thenReturn(Optional.empty());
        assertThat(specialtyService.getSpecialtyById(9L)).isNull();
    }

    @Test
    void getSpecialtyBySlug_throwsWhenNotFound() {
        when(specialtyRepository.findBySlug("x")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> specialtyService.getSpecialtyBySlug("x"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
