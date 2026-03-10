package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Service interface for Investigation Tools (10.6).
 */
public interface InvestigationService {

    /**
     * Get paginated & filtered investigations (summary view).
     */
    Page<InvestigationSummaryDTO> getInvestigations(InvestigationFilterDTO filter);

    /**
     * Get full investigation detail by ID (includes notes, evidence, related data).
     */
    InvestigationDTO getInvestigationById(Long id);

    /**
     * Create a new investigation.
     */
    InvestigationDTO createInvestigation(CreateInvestigationDTO dto, Long createdByUserId);

    /**
     * Update an existing investigation.
     */
    InvestigationDTO updateInvestigation(Long id, UpdateInvestigationDTO dto);

    /**
     * Delete an investigation.
     */
    void deleteInvestigation(Long id);

    // ===== Notes =====

    /**
     * Add a note to an investigation.
     */
    InvestigationNoteDTO addNote(Long investigationId, AddInvestigationNoteDTO dto, Long authorId);

    /**
     * Get all notes for an investigation.
     */
    List<InvestigationNoteDTO> getNotes(Long investigationId);

    // ===== Evidence =====

    /**
     * Add evidence to an investigation.
     */
    InvestigationEvidenceDTO addEvidence(Long investigationId, AddInvestigationEvidenceDTO dto, Long addedByUserId);

    /**
     * Get all evidence for an investigation.
     */
    List<InvestigationEvidenceDTO> getEvidence(Long investigationId);

    // ===== Timeline =====

    /**
     * Get chronological timeline of an investigation.
     */
    List<InvestigationTimelineDTO> getTimeline(Long investigationId);

    // ===== Statistics =====

    /**
     * Get investigation statistics.
     */
    InvestigationStatsDTO getInvestigationStats();
}
