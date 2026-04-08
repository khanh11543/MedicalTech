package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.SupportTicket;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.SupportTicketRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupportTicketServiceTest {

    @Mock private SupportTicketRepository supportTicketRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private SupportTicketService service;

    private User user() {
        User u = User.builder().email("a@a.a").fullName("A").build();
        u.setId(1L);
        return u;
    }

    private SupportTicket ticket() {
        SupportTicket t = SupportTicket.builder().user(user()).subject("S").message("M").category("C")
                .priority("MEDIUM").status("OPEN").build();
        t.setId(10L);
        return t;
    }

    @Test
    void createTicket() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user()));
        when(supportTicketRepository.save(any())).thenAnswer(i -> {
            SupportTicket t = i.getArgument(0);
            t.setId(10L);
            return t;
        });

        SupportTicketDTO dto = service.createTicket(1L, CreateSupportTicketDTO.builder()
                .subject("S").message("M").category("C").build());
        assertThat(dto.getId()).isEqualTo(10L);
    }

    @Test
    void createTicket_userMissing_throws() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.createTicket(1L, CreateSupportTicketDTO.builder().subject("s").message("m").category("c").build()))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getUserTickets() {
        Pageable p = PageRequest.of(0, 5);
        Page<SupportTicket> page = new PageImpl<>(List.of(ticket()));
        when(supportTicketRepository.findByUserIdOrderByCreatedAtDesc(1L, p)).thenReturn(page);

        assertThat(service.getUserTickets(1L, p).getContent()).hasSize(1);
    }

    @Test
    void getTicket_ownershipFails() {
        when(supportTicketRepository.findById(10L)).thenReturn(Optional.of(ticket()));
        assertThatThrownBy(() -> service.getTicket(10L, 99L)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void listAllTickets() {
        when(supportTicketRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(ticket())));

        Page<SupportTicketDTO> page = service.listAllTickets(null, null, null, null, PageRequest.of(0, 5));
        assertThat(page.getContent()).hasSize(1);
    }

    @Test
    void respondToTicket() {
        when(supportTicketRepository.findById(10L)).thenReturn(Optional.of(ticket()));
        when(supportTicketRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        SupportTicketDTO dto = service.respondToTicket(10L, 2L, RespondTicketDTO.builder().adminResponse("ok").build());
        assertThat(dto.getAdminResponse()).isEqualTo("ok");
    }

    @Test
    void closeTicket() {
        when(supportTicketRepository.findById(10L)).thenReturn(Optional.of(ticket()));
        when(supportTicketRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.closeTicket(10L).getStatus()).isEqualTo("CLOSED");
    }

    @Test
    void getTicketStats() {
        when(supportTicketRepository.count()).thenReturn(10L);
        when(supportTicketRepository.countByStatus("OPEN")).thenReturn(2L);
        when(supportTicketRepository.countByStatus("IN_PROGRESS")).thenReturn(1L);
        when(supportTicketRepository.countByStatus("RESOLVED")).thenReturn(3L);
        when(supportTicketRepository.countByStatus("CLOSED")).thenReturn(4L);

        SupportTicketStatsDTO s = service.getTicketStats();
        assertThat(s.getTotalTickets()).isEqualTo(10L);
    }
}
