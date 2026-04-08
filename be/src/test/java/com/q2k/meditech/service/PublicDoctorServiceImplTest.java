package com.q2k.meditech.service;

import com.q2k.meditech.dto.mapper.DoctorMapper;
import com.q2k.meditech.dto.mapper.TimeSlotMapper;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.DoctorSpecialtyRepository;
import com.q2k.meditech.repository.TimeSlotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicDoctorServiceImplTest {

    @Mock DoctorRepository doctorRepository;
    @Mock DoctorSpecialtyRepository doctorSpecialtyRepository;
    @Mock TimeSlotRepository timeSlotRepository;
    @Mock DoctorMapper doctorMapper;
    @Mock TimeSlotMapper timeSlotMapper;

    @InjectMocks PublicDoctorServiceImpl publicDoctorService;

    @Test
    void searchDoctors_emptyPage() {
        when(doctorRepository.searchDoctors(isNull(), isNull(), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        var page = publicDoctorService.searchDoctors(null, null, null, null, null, 0, 10, "id", "asc");
        assertThat(page.getContent()).isEmpty();
    }

    @Test
    void getDoctorDetail_notFound() {
        when(doctorRepository.findByIdForPublic(9L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> publicDoctorService.getDoctorDetail(9L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getAvailableSlots_mapsSlots() {
        when(doctorRepository.findByIdForPublic(1L)).thenReturn(java.util.Optional.of(Doctor.builder().id(1L).build()));
        when(timeSlotRepository.findAvailableSlots(eq(1L), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(List.of());
        when(timeSlotMapper.toDTOList(anyList())).thenReturn(List.of());
        assertThat(publicDoctorService.getAvailableSlots(1L, LocalDate.now(), LocalDate.now().plusDays(1))).isEmpty();
    }
}
