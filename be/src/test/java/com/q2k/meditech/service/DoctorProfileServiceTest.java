package com.q2k.meditech.service;

import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.SecurityUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorProfileServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private DoctorProfileService service;

    @Test
    void requireUserId_null_throws() {
        try (var sec = mockStatic(SecurityUtil.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(null);
            assertThatThrownBy(() -> service.requireUserId()).isInstanceOf(BadRequestException.class);
        }
    }

    @Test
    void requireUserId_returnsId() {
        try (var sec = mockStatic(SecurityUtil.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(5L);
            assertThat(service.requireUserId()).isEqualTo(5L);
        }
    }

    @Test
    void getOrCreateDoctor_existing() {
        Doctor d = Doctor.builder().fullName("D").build();
        when(doctorRepository.findByUserId(1L)).thenReturn(Optional.of(d));
        assertThat(service.getOrCreateDoctor(1L)).isSameAs(d);
    }

    @Test
    void getOrCreateDoctor_creates() {
        when(doctorRepository.findByUserId(2L)).thenReturn(Optional.empty());
        User u = User.builder().fullName("Dr X").build();
        u.setId(2L);
        when(userRepository.findById(2L)).thenReturn(Optional.of(u));
        Doctor saved = Doctor.builder().user(u).fullName("Dr X").build();
        saved.setId(20L);
        when(doctorRepository.save(any(Doctor.class))).thenReturn(saved);
        Doctor out = service.getOrCreateDoctor(2L);
        assertThat(out.getId()).isEqualTo(20L);
    }

    @Test
    void getOrCreateDoctor_userMissing_throws() {
        when(doctorRepository.findByUserId(3L)).thenReturn(Optional.empty());
        when(userRepository.findById(3L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getOrCreateDoctor(3L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void requireDoctor_chains() {
        try (var sec = mockStatic(SecurityUtil.class)) {
            sec.when(SecurityUtil::getCurrentUserId).thenReturn(4L);
            Doctor d = Doctor.builder().build();
            when(doctorRepository.findByUserId(4L)).thenReturn(Optional.of(d));
            assertThat(service.requireDoctor()).isSameAs(d);
        }
    }
}
