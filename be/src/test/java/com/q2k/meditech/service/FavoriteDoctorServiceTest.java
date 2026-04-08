package com.q2k.meditech.service;

import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.FavoriteDoctor;
import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.FavoriteDoctorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FavoriteDoctorServiceTest {

    @Mock FavoriteDoctorRepository favoriteDoctorRepository;

    @InjectMocks FavoriteDoctorService favoriteDoctorService;

    @Test
    void getFavorites_nullPatientId_throws() {
        assertThatThrownBy(() -> favoriteDoctorService.getFavorites(null, 0, 10))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void getFavorites_returnsPage() {
        when(favoriteDoctorRepository.findByPatientIdOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        var res = favoriteDoctorService.getFavorites(1L, 0, 10);
        assertThat(res.getFavorites()).isEmpty();
    }

    @Test
    void removeFavorite_wrongPatient_throws() {
        Patient pat = Patient.builder().build();
        pat.setId(2L);
        FavoriteDoctor fav = FavoriteDoctor.builder().id(9L).patient(pat).build();
        when(favoriteDoctorRepository.findById(9L)).thenReturn(java.util.Optional.of(fav));

        assertThatThrownBy(() -> favoriteDoctorService.removeFavorite(9L, 1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void removeFavorite_deletes() {
        Patient pat = Patient.builder().build();
        pat.setId(1L);
        FavoriteDoctor fav = FavoriteDoctor.builder().id(9L).patient(pat).doctor(Doctor.builder().id(3L).build()).build();
        when(favoriteDoctorRepository.findById(9L)).thenReturn(java.util.Optional.of(fav));

        favoriteDoctorService.removeFavorite(9L, 1L);

        verify(favoriteDoctorRepository).delete(fav);
    }
}
