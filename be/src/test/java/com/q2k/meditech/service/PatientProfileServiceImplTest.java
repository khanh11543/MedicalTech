package com.q2k.meditech.service;

import com.q2k.meditech.entity.Patient;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.PatientRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientProfileServiceImplTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PatientProfileServiceImpl service;

    @Test
    void getOrCreatePatientForUser_existing_returnsPatient() {
        Patient p = Patient.builder().fullName("P").build();
        when(patientRepository.findByUserId(1L)).thenReturn(Optional.of(p));
        assertThat(service.getOrCreatePatientForUser(1L)).isSameAs(p);
    }

    @Test
    void getOrCreatePatientForUser_createsFromUser() {
        when(patientRepository.findByUserId(2L)).thenReturn(Optional.empty());
        User u = User.builder().email("e@e.com").fullName("N").build();
        u.setId(2L);
        when(userRepository.findById(2L)).thenReturn(Optional.of(u));
        Patient saved = Patient.builder().fullName("N").user(u).build();
        saved.setId(10L);
        when(patientRepository.save(any(Patient.class))).thenReturn(saved);
        Patient result = service.getOrCreatePatientForUser(2L);
        assertThat(result.getFullName()).isEqualTo("N");
        verify(patientRepository).save(any(Patient.class));
    }

    @Test
    void getOrCreatePatientForUser_userMissing_throws() {
        when(patientRepository.findByUserId(3L)).thenReturn(Optional.empty());
        when(userRepository.findById(3L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getOrCreatePatientForUser(3L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
