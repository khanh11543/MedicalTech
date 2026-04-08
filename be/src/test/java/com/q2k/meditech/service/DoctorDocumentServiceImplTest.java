package com.q2k.meditech.service;

import com.q2k.meditech.dto.DoctorDocumentCreateDTO;
import com.q2k.meditech.dto.DoctorDocumentDTO;
import com.q2k.meditech.dto.ReviewDocDTO;
import com.q2k.meditech.dto.mapper.DoctorDocumentMapper;
import com.q2k.meditech.entity.Doctor;
import com.q2k.meditech.entity.DoctorDocument;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.DoctorDocumentType;
import com.q2k.meditech.entity.enums.ReviewStatus;
import com.q2k.meditech.entity.enums.VerificationStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DoctorDocumentRepository;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorDocumentServiceImplTest {

    @Mock
    private DoctorDocumentRepository documentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private DoctorDocumentMapper documentMapper;

    @InjectMocks
    private DoctorDocumentServiceImpl service;

    @Test
    void uploadDocument_rejectedDoctor_refreshesStatus() {
        Doctor doctor = Doctor.builder().verificationStatus(VerificationStatus.REJECTED).build();
        doctor.setId(1L);
        when(doctorRepository.findById(1L)).thenReturn(Optional.of(doctor));
        DoctorDocument entity = DoctorDocument.builder().docType(DoctorDocumentType.LICENSE).build();
        when(documentMapper.toEntity(any())).thenReturn(entity);
        when(documentRepository.save(any(DoctorDocument.class))).thenAnswer(i -> i.getArgument(0));
        when(documentMapper.toDTO(any())).thenReturn(DoctorDocumentDTO.builder().id(9L).build());
        DoctorDocumentCreateDTO dto = new DoctorDocumentCreateDTO();
        assertThat(service.uploadDocument(1L, dto).getId()).isEqualTo(9L);
        verify(doctorRepository).save(doctor);
        assertThat(doctor.getVerificationStatus()).isEqualTo(VerificationStatus.AWAITING_DOCUMENTS);
    }

    @Test
    void listMyDocuments_branches() {
        when(documentRepository.findByDoctorIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        assertThat(service.listMyDocuments(1L, null, null)).isEmpty();
        when(documentRepository.findByDoctorIdAndStatusOrderByCreatedAtDesc(eq(1L), eq(ReviewStatus.PENDING)))
                .thenReturn(List.of());
        service.listMyDocuments(1L, "pending", null);
        when(documentRepository.findByDoctorIdAndDocTypeOrderByCreatedAtDesc(eq(1L), eq(DoctorDocumentType.LICENSE)))
                .thenReturn(List.of());
        service.listMyDocuments(1L, null, "license");
    }

    @Test
    void deleteDocument() {
        Doctor d = Doctor.builder().build();
        d.setId(1L);
        DoctorDocument doc = DoctorDocument.builder().doctor(d).status(ReviewStatus.PENDING).build();
        doc.setId(5L);
        when(documentRepository.findByIdWithDoctor(5L)).thenReturn(Optional.of(doc));
        service.deleteDocument(1L, 5L);
        verify(documentRepository).delete(doc);
    }

    @Test
    void deleteDocument_wrongOwner_throws() {
        Doctor d = Doctor.builder().build();
        d.setId(2L);
        DoctorDocument doc = DoctorDocument.builder().doctor(d).status(ReviewStatus.PENDING).build();
        doc.setId(5L);
        when(documentRepository.findByIdWithDoctor(5L)).thenReturn(Optional.of(doc));
        assertThatThrownBy(() -> service.deleteDocument(1L, 5L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void listAllDocuments_and_pending() {
        Pageable p = PageRequest.of(0, 10);
        when(documentRepository.findAllWithFilters(isNull(), isNull())).thenReturn(List.of());
        assertThat(service.listAllDocuments(null, null, p).getContent()).isEmpty();
        when(documentRepository.findPendingDocuments(p)).thenReturn(new PageImpl<>(List.of()));
        assertThat(service.listPendingDocuments(p).getContent()).isEmpty();
    }

    @Test
    void getDocumentDetail() {
        DoctorDocument doc = DoctorDocument.builder().build();
        doc.setId(3L);
        when(documentRepository.findByIdWithDoctor(3L)).thenReturn(Optional.of(doc));
        when(documentMapper.toDTO(doc)).thenReturn(DoctorDocumentDTO.builder().id(3L).build());
        assertThat(service.getDocumentDetail(3L).getId()).isEqualTo(3L);
    }

    @Test
    void approveDocument_autoApprovesDoctor() {
        Doctor doctor = Doctor.builder().build();
        doctor.setId(7L);
        DoctorDocument doc = DoctorDocument.builder()
                .doctor(doctor)
                .docType(DoctorDocumentType.LICENSE)
                .status(ReviewStatus.PENDING)
                .build();
        doc.setId(20L);
        User reviewer = User.builder().build();
        reviewer.setId(99L);
        when(documentRepository.findByIdWithDoctor(20L)).thenReturn(Optional.of(doc));
        when(userRepository.findById(99L)).thenReturn(Optional.of(reviewer));
        when(documentRepository.save(any(DoctorDocument.class))).thenAnswer(i -> i.getArgument(0));
        when(documentRepository.hasApprovedDocument(7L, DoctorDocumentType.LICENSE)).thenReturn(true);
        when(documentRepository.hasApprovedDocument(7L, DoctorDocumentType.ID)).thenReturn(true);
        when(documentRepository.hasApprovedDocument(7L, DoctorDocumentType.DEGREE)).thenReturn(true);
        when(documentMapper.toDTO(any())).thenReturn(DoctorDocumentDTO.builder().build());
        service.approveDocument(20L, ReviewDocDTO.builder().reviewNote("ok").build(), 99L);
        verify(doctorRepository).save(doctor);
    }

    @Test
    void rejectDocument_requiredType_setsDoctorRejected() {
        Doctor doctor = Doctor.builder().build();
        doctor.setId(8L);
        DoctorDocument doc = DoctorDocument.builder()
                .doctor(doctor)
                .docType(DoctorDocumentType.LICENSE)
                .status(ReviewStatus.PENDING)
                .build();
        doc.setId(21L);
        User reviewer = User.builder().build();
        reviewer.setId(99L);
        when(documentRepository.findByIdWithDoctor(21L)).thenReturn(Optional.of(doc));
        when(userRepository.findById(99L)).thenReturn(Optional.of(reviewer));
        when(documentRepository.save(any(DoctorDocument.class))).thenAnswer(i -> i.getArgument(0));
        when(documentMapper.toDTO(any())).thenReturn(DoctorDocumentDTO.builder().build());
        service.rejectDocument(21L, ReviewDocDTO.builder().reviewNote("bad").build(), 99L);
        assertThat(doctor.getVerificationStatus()).isEqualTo(VerificationStatus.REJECTED);
    }

    @Test
    void hasAllRequiredDocumentsApproved() {
        when(documentRepository.hasApprovedDocument(1L, DoctorDocumentType.LICENSE)).thenReturn(true);
        when(documentRepository.hasApprovedDocument(1L, DoctorDocumentType.ID)).thenReturn(false);
        assertThat(service.hasAllRequiredDocumentsApproved(1L)).isFalse();
    }

    @Test
    void getVerificationSummary() {
        DoctorDocument d1 = DoctorDocument.builder().status(ReviewStatus.APPROVED).docType(DoctorDocumentType.LICENSE).build();
        DoctorDocument d2 = DoctorDocument.builder().status(ReviewStatus.PENDING).docType(DoctorDocumentType.ID).build();
        when(documentRepository.findLatestByDoctorId(1L)).thenReturn(List.of(d1, d2));
        DoctorDocumentService.DocumentVerificationSummary s = service.getVerificationSummary(1L);
        assertThat(s.approvedCount()).isEqualTo(1);
    }
}
