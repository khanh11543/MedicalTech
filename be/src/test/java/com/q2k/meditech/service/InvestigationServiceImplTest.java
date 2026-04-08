package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.InvestigationStatus;
import com.q2k.meditech.entity.enums.EvidenceType;
import com.q2k.meditech.entity.enums.InvestigationType;
import com.q2k.meditech.entity.enums.SecuritySeverity;
import com.q2k.meditech.repository.InvestigationEvidenceRepository;
import com.q2k.meditech.repository.InvestigationNoteRepository;
import com.q2k.meditech.repository.InvestigationRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InvestigationServiceImplTest {

    @Mock
    private InvestigationRepository investigationRepository;

    @Mock
    private InvestigationNoteRepository investigationNoteRepository;

    @Mock
    private InvestigationEvidenceRepository investigationEvidenceRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private InvestigationServiceImpl service;

    @Test
    void getInvestigations_emptyPage() {
        InvestigationFilterDTO f = InvestigationFilterDTO.builder().build();
        when(investigationRepository.findAll(
                any(org.springframework.data.jpa.domain.Specification.class),
                any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));
        assertThat(service.getInvestigations(f).getContent()).isEmpty();
    }

    @Test
    void getInvestigationById() {
        User u = user(1L);
        Investigation inv = investigation(10L, u);
        when(investigationRepository.findById(10L)).thenReturn(Optional.of(inv));
        assertThat(service.getInvestigationById(10L).getId()).isEqualTo(10L);
    }

    @Test
    void createInvestigation() {
        User u = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        Investigation saved = investigation(20L, u);
        when(investigationRepository.save(any(Investigation.class))).thenReturn(saved);
        CreateInvestigationDTO c = CreateInvestigationDTO.builder()
                .title("T")
                .description("d")
                .severity(SecuritySeverity.MEDIUM)
                .type(InvestigationType.OTHER)
                .build();
        assertThat(service.createInvestigation(c, 1L).getTitle()).isEqualTo("T");
    }

    @Test
    void updateAndDeleteInvestigation() {
        User u = user(1L);
        Investigation inv = investigation(30L, u);
        when(investigationRepository.findById(30L)).thenReturn(Optional.of(inv));
        when(investigationRepository.save(any(Investigation.class))).thenAnswer(i -> i.getArgument(0));
        UpdateInvestigationDTO dto = new UpdateInvestigationDTO();
        dto.setTitle("X");
        assertThat(service.updateInvestigation(30L, dto).getTitle()).isEqualTo("X");

        when(investigationRepository.findById(30L)).thenReturn(Optional.of(inv));
        service.deleteInvestigation(30L);
        verify(investigationRepository).delete(inv);
    }

    @Test
    void notesAndEvidence() {
        User u = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        Investigation inv = investigation(40L, u);
        when(investigationRepository.findById(40L)).thenReturn(Optional.of(inv));
        InvestigationNote note = InvestigationNote.builder().investigation(inv).author(u).content("n").build();
        note.setId(1L);
        when(investigationNoteRepository.save(any(InvestigationNote.class))).thenReturn(note);
        service.addNote(40L, AddInvestigationNoteDTO.builder().content("n").build(), 1L);
        when(investigationNoteRepository.findByInvestigationIdOrderByCreatedAtDesc(40L)).thenReturn(List.of(note));
        assertThat(service.getNotes(40L)).hasSize(1);

        InvestigationEvidence ev = InvestigationEvidence.builder()
                .investigation(inv)
                .evidenceType(EvidenceType.AUDIT_LOG)
                .addedBy(u)
                .build();
        ev.setId(2L);
        when(investigationEvidenceRepository.save(any(InvestigationEvidence.class))).thenReturn(ev);
        service.addEvidence(40L, AddInvestigationEvidenceDTO.builder().evidenceType(EvidenceType.AUDIT_LOG).build(), 1L);
        when(investigationEvidenceRepository.findByInvestigationIdOrderByCreatedAtDesc(40L)).thenReturn(List.of(ev));
        assertThat(service.getEvidence(40L)).hasSize(1);
    }

    @Test
    void getTimeline() {
        User u = user(1L);
        Investigation inv = investigation(50L, u);
        inv.setCreatedAt(java.time.LocalDateTime.now().minusHours(1));
        InvestigationNote note = InvestigationNote.builder().investigation(inv).author(u).content("short").build();
        note.setCreatedAt(java.time.LocalDateTime.now());
        InvestigationEvidence ev = InvestigationEvidence.builder()
                .investigation(inv).addedBy(u).evidenceType(EvidenceType.FILE).build();
        ev.setCreatedAt(java.time.LocalDateTime.now().plusMinutes(1));
        inv.setNotes(new ArrayList<>(List.of(note)));
        inv.setEvidence(new ArrayList<>(List.of(ev)));
        when(investigationRepository.findById(50L)).thenReturn(Optional.of(inv));
        assertThat(service.getTimeline(50L)).isNotEmpty();
    }

    @Test
    void getInvestigationStats() {
        when(investigationRepository.count()).thenReturn(5L);
        when(investigationRepository.countByStatus(any())).thenReturn(1L);
        when(investigationRepository.countOverdue(any())).thenReturn(0L);
        when(investigationRepository.countResolvedBetween(any(), any())).thenReturn(0L);
        assertThat(service.getInvestigationStats().getTotalInvestigations()).isEqualTo(5L);
    }

    private static User user(Long id) {
        User u = User.builder().email("e@e.com").fullName("N").build();
        u.setId(id);
        return u;
    }

    private static Investigation investigation(Long id, User createdBy) {
        Investigation inv = Investigation.builder()
                .title("T")
                .severity(SecuritySeverity.LOW)
                .type(InvestigationType.OTHER)
                .status(InvestigationStatus.OPEN)
                .createdBy(createdBy)
                .build();
        inv.setId(id);
        inv.setNotes(new ArrayList<>());
        inv.setEvidence(new ArrayList<>());
        return inv;
    }
}
