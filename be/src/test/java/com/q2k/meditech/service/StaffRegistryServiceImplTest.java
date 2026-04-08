package com.q2k.meditech.service;

import com.q2k.meditech.dto.NoteDTO;
import com.q2k.meditech.dto.StaffInviteDTO;
import com.q2k.meditech.dto.StaffRegistryDTO;
import com.q2k.meditech.dto.mapper.StaffRegistryMapper;
import com.q2k.meditech.entity.StaffRegistry;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.StaffRegistryRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StaffRegistryServiceImplTest {

    @Mock private StaffRegistryRepository staffRegistryRepository;
    @Mock private UserRepository userRepository;
    @Mock private StaffRegistryMapper staffRegistryMapper;

    @InjectMocks
    private StaffRegistryServiceImpl service;

    @Test
    void createStaffInvite_duplicateEmail_throws() {
        when(staffRegistryRepository.existsByEmail("a@a.a")).thenReturn(true);
        StaffInviteDTO dto = StaffInviteDTO.builder().email("a@a.a").fullName("X").expectedRole("DOCTOR").build();
        assertThatThrownBy(() -> service.createStaffInvite(dto, 1L)).isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void createStaffInvite_success() {
        StaffInviteDTO dto = StaffInviteDTO.builder().email("new@a.a").fullName("N").expectedRole("DOCTOR").build();
        StaffRegistry entity = StaffRegistry.builder().email("new@a.a").build();
        when(staffRegistryRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        User inviter = User.builder().build();
        inviter.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(inviter));
        when(staffRegistryMapper.toEntity(dto)).thenReturn(entity);
        when(staffRegistryRepository.save(any())).thenAnswer(i -> {
            StaffRegistry s = i.getArgument(0);
            s.setId(5L);
            return s;
        });
        when(staffRegistryMapper.toDTO(any())).thenReturn(StaffRegistryDTO.builder().id(5L).build());

        assertThat(service.createStaffInvite(dto, 1L).getId()).isEqualTo(5L);
    }

    @Test
    void listStaffRegistry_noSpec() {
        StaffRegistry sr = StaffRegistry.builder().status("PENDING").build();
        sr.setId(1L);
        when(staffRegistryRepository.findAll(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sr)));
        when(staffRegistryMapper.toDTO(sr)).thenReturn(StaffRegistryDTO.builder().id(1L).build());

        Page<StaffRegistryDTO> p = service.listStaffRegistry(null, null, PageRequest.of(0, 10));
        assertThat(p.getContent()).hasSize(1);
    }

    @Test
    void getStaffDetail() {
        StaffRegistry sr = StaffRegistry.builder().status("PENDING").build();
        sr.setId(1L);
        when(staffRegistryRepository.findByIdWithDetails(1L)).thenReturn(Optional.of(sr));
        when(staffRegistryMapper.toDTO(any())).thenReturn(StaffRegistryDTO.builder().id(1L).build());

        assertThat(service.getStaffDetail(1L).getId()).isEqualTo(1L);
    }

    @Test
    void disableStaff_registered_throws() {
        StaffRegistry sr = StaffRegistry.builder().status("REGISTERED").build();
        sr.setId(1L);
        when(staffRegistryRepository.findById(1L)).thenReturn(Optional.of(sr));
        assertThatThrownBy(() -> service.disableStaff(1L, new NoteDTO(), 1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void enableStaff_notDisabled_throws() {
        StaffRegistry sr = StaffRegistry.builder().status("PENDING").build();
        sr.setId(1L);
        when(staffRegistryRepository.findById(1L)).thenReturn(Optional.of(sr));
        assertThatThrownBy(() -> service.enableStaff(1L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void findValidInvite_null() {
        when(staffRegistryRepository.findByEmail("a@a.a")).thenReturn(Optional.empty());
        assertThat(service.findValidInvite("a@a.a", null)).isNull();
    }

    @Test
    void markAsRegistered() {
        StaffRegistry sr = StaffRegistry.builder().email("e@e.e").build();
        sr.setId(1L);
        User u = User.builder().build();
        u.setId(2L);
        when(staffRegistryRepository.findByEmail("e@e.e")).thenReturn(Optional.of(sr));
        when(staffRegistryRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        service.markAsRegistered("e@e.e", u);
        verify(staffRegistryRepository).save(argThat(x -> "REGISTERED".equals(x.getStatus())));
    }
}
