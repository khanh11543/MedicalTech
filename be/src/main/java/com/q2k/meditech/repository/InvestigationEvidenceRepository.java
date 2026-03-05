package com.q2k.meditech.repository;

import com.q2k.meditech.entity.InvestigationEvidence;
import com.q2k.meditech.entity.enums.EvidenceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestigationEvidenceRepository extends JpaRepository<InvestigationEvidence, Long> {

    List<InvestigationEvidence> findByInvestigationIdOrderByCreatedAtDesc(Long investigationId);

    List<InvestigationEvidence> findByEvidenceTypeAndReferenceId(EvidenceType evidenceType, Long referenceId);

    List<InvestigationEvidence> findByReferenceTypeAndReferenceId(String referenceType, Long referenceId);

    long countByInvestigationId(Long investigationId);
}
