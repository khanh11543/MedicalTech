package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.UserMapper;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock UserRoleRepository userRoleRepository;
    @Mock DoctorRepository doctorRepository;
    @Mock SpecialtyRepository specialtyRepository;
    @Mock StaffRegistryRepository staffRegistryRepository;
    @Mock UserMapper userMapper;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailService emailService;
    @Mock JwtService jwtService;

    @InjectMocks UserServiceImpl userService;

    @BeforeEach
    void setFrontendUrl() {
        ReflectionTestUtils.setField(userService, "frontendUrl", "http://localhost:5173");
    }

    @Test
    void listUsers_empty() {
        when(userRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(userService.listUsers(null, null, null, PageRequest.of(0, 5)).getContent()).isEmpty();
    }

    @Test
    void getUserDetail_notFound() {
        when(userRepository.findByIdWithRoles(9L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.getUserDetail(9L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void createUser_duplicateEmail() {
        CreateUserDTO dto = new CreateUserDTO();
        dto.setEmail("dup@test.com");
        when(userRepository.existsByEmail("dup@test.com")).thenReturn(true);
        assertThatThrownBy(() -> userService.createUser(dto, 1L)).isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void assignSpecialtiesToDoctor_noSpecialtiesFound() {
        Doctor d = Doctor.builder()
                .user(User.builder().email("d@d.d").fullName("Doc").build())
                .fullName("Doc")
                .build();
        d.setId(10L);
        when(specialtyRepository.findAllById(Set.of(99L))).thenReturn(List.of());
        assertThatThrownBy(() -> userService.assignSpecialtiesToDoctor(d, Set.of(99L), null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void assignSpecialtiesToDoctor_primaryNotInSet() {
        Doctor d = Doctor.builder()
                .user(User.builder().email("d@d.d").fullName("Doc").build())
                .fullName("Doc")
                .build();
        d.setId(10L);
        var sp = new com.q2k.meditech.entity.Specialty();
        sp.setId(1L);
        sp.setName("S1");
        when(specialtyRepository.findAllById(Set.of(1L))).thenReturn(List.of(sp));
        assertThatThrownBy(() -> userService.assignSpecialtiesToDoctor(d, Set.of(1L), 2L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateUser_notFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.updateUser(1L, new UpdateUserDTO())).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateUserStatus_notFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.updateUserStatus(1L, new StatusDTO())).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void assignRoles_userNotExists() {
        when(userRepository.existsById(1L)).thenReturn(false);
        assertThatThrownBy(() -> userService.assignRoles(1L, AssignRolesDTO.builder().roleIds(Set.of(1L)).build(), 1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void resetPassword_notFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.resetPassword(1L)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void adminChangePassword_passwordsMismatch() {
        var dto = AdminChangePasswordDTO.builder().newPassword("a").confirmPassword("b").build();
        assertThatThrownBy(() -> userService.adminChangePassword(1L, dto)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void adminChangePassword_userNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        var dto = AdminChangePasswordDTO.builder().newPassword("x").confirmPassword("x").build();
        assertThatThrownBy(() -> userService.adminChangePassword(1L, dto)).isInstanceOf(ResourceNotFoundException.class);
    }
}
