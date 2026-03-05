package com.q2k.meditech.repository;

import com.q2k.meditech.entity.InvestigationNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestigationNoteRepository extends JpaRepository<InvestigationNote, Long> {

    List<InvestigationNote> findByInvestigationIdOrderByCreatedAtDesc(Long investigationId);

    List<InvestigationNote> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    long countByInvestigationId(Long investigationId);
}
