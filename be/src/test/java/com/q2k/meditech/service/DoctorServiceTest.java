package com.q2k.meditech.service;

import com.q2k.meditech.dto.DoctorSearchResponse;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.DoctorScheduleRepository;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock DoctorRepository doctorRepository;
    @Mock DoctorScheduleRepository scheduleRepository;

    @InjectMocks DoctorService doctorService;

    @Test
    void searchDoctors_returnsResponse() {
        when(doctorRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        DoctorSearchResponse r = doctorService.searchDoctors(null, null, null, null, null, 0, 10, "id", "asc");
        assertThat(r.getDoctors()).isEmpty();
    }

    @Test
    void getDoctorDetail_notFound() {
        when(doctorRepository.findByIdForPublic(1L)).thenReturn(java.util.Optional.empty());
        assertThatThrownBy(() -> doctorService.getDoctorDetail(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getDoctorAvailableSlots_nullDates_throws() {
        assertThatThrownBy(() -> doctorService.getDoctorAvailableSlots(1L, null, LocalDate.now()))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
