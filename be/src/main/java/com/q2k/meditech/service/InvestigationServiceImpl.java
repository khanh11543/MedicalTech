package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.InvestigationStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of InvestigationService (10.6 Investigation Tools).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InvestigationServiceImpl implements InvestigationService {

    private final InvestigationRepository investigationRepository;
    private final InvestigationNoteRepository investigationNoteRepository;
    private final InvestigationEvidenceRepository investigationEvidenceRepository;
    private final UserRepository userRepository;

    // ===== CRUD =====

    @Override
    @Transactional(readOnly = true)
    public Page<InvestigationSummaryDTO> getInvestigations(InvestigationFilterDTO filter) {
        log.debug("Fetching investigations with filter: {}", filter);
        Pageable pageable = createPageable(filter);

        // Build dynamic specification
        Specification<Investigation> spec = buildSpecification(filter);
        return investigationRepository.findAll(spec, pageable).map(this::toSummaryDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public InvestigationDTO getInvestigationById(Long id) {
        log.debug("Fetching investigation detail for id: {}", id);
        Investigation investigation = investigationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investigation not found with id: " + id));
        return toFullDTO(investigation);
    }

    @Override
    public InvestigationDTO createInvestigation(CreateInvestigationDTO dto, Long createdByUserId) {
        log.info("Creating investigation: {} by user: {}", dto.getTitle(), createdByUserId);

        User createdBy = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + createdByUserId));

        Investigation investigation = Investigation.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .severity(dto.getSeverity())
                .type(dto.getType())
                .status(InvestigationStatus.OPEN)
                .createdBy(createdBy)
                .dueDate(dto.getDueDate())
                .build();

        // Assign to user if provided
        if (dto.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + dto.getAssignedToId()));
            investigation.setAssignedTo(assignedTo);
        }

        // Related users
        if (dto.getRelatedUserIds() != null && !dto.getRelatedUserIds().isEmpty()) {
            Set<User> relatedUsers = new HashSet<>(userRepository.findAllById(dto.getRelatedUserIds()));
            investigation.setRelatedUsers(relatedUsers);
        }

        // Related IPs
        if (dto.getRelatedIps() != null) {
            investigation.setRelatedIps(new ArrayList<>(dto.getRelatedIps()));
        }

        // Related event IDs
        if (dto.getRelatedEventIds() != null) {
            investigation.setRelatedEventIds(new ArrayList<>(dto.getRelatedEventIds()));
        }

        Investigation saved = investigationRepository.save(investigation);
        log.info("Investigation created: id={}", saved.getId());
        return toFullDTO(saved);
    }

    @Override
    public InvestigationDTO updateInvestigation(Long id, UpdateInvestigationDTO dto) {
        log.info("Updating investigation id: {}", id);
        Investigation investigation = investigationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investigation not found with id: " + id));

        if (dto.getTitle() != null) investigation.setTitle(dto.getTitle());
        if (dto.getDescription() != null) investigation.setDescription(dto.getDescription());
        if (dto.getSeverity() != null) investigation.setSeverity(dto.getSeverity());
        if (dto.getType() != null) investigation.setType(dto.getType());

        if (dto.getStatus() != null) {
            InvestigationStatus newStatus = dto.getStatus();
            // Set resolvedAt timestamp when resolving
            if ((newStatus == InvestigationStatus.RESOLVED || newStatus == InvestigationStatus.CLOSED)
                    && investigation.getResolvedAt() == null) {
                investigation.setResolvedAt(LocalDateTime.now());
            }
            investigation.setStatus(newStatus);
        }

        if (dto.getAssignedToId() != null) {
            User assignedTo = userRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned user not found with id: " + dto.getAssignedToId()));
            investigation.setAssignedTo(assignedTo);
        }

        if (dto.getDueDate() != null) investigation.setDueDate(dto.getDueDate());
        if (dto.getResolutionSummary() != null) investigation.setResolutionSummary(dto.getResolutionSummary());
        if (dto.getPreventiveMeasures() != null) investigation.setPreventiveMeasures(dto.getPreventiveMeasures());

        // Replace related data if provided
        if (dto.getRelatedUserIds() != null) {
            Set<User> relatedUsers = new HashSet<>(userRepository.findAllById(dto.getRelatedUserIds()));
            investigation.getRelatedUsers().clear();
            investigation.getRelatedUsers().addAll(relatedUsers);
        }

        if (dto.getRelatedIps() != null) {
            investigation.getRelatedIps().clear();
            investigation.getRelatedIps().addAll(dto.getRelatedIps());
        }

        if (dto.getRelatedEventIds() != null) {
            investigation.getRelatedEventIds().clear();
            investigation.getRelatedEventIds().addAll(dto.getRelatedEventIds());
        }

        Investigation saved = investigationRepository.save(investigation);
        return toFullDTO(saved);
    }

    @Override
    public void deleteInvestigation(Long id) {
        log.info("Deleting investigation id: {}", id);
        Investigation investigation = investigationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investigation not found with id: " + id));
        investigationRepository.delete(investigation);
    }

    // ===== Notes =====

    @Override
    public InvestigationNoteDTO addNote(Long investigationId, AddInvestigationNoteDTO dto, Long authorId) {
        log.info("Adding note to investigation: {} by user: {}", investigationId, authorId);
        Investigation investigation = investigationRepository.findById(investigationId)
                .orElseThrow(() -> new ResourceNotFoundException("Investigation not found with id: " + investigationId));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + authorId));

        InvestigationNote note = InvestigationNote.builder()
                .investigation(investigation)
                .author(author)
                .content(dto.getContent())
                .build();

        InvestigationNote saved = investigationNoteRepository.save(note);
        return toNoteDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvestigationNoteDTO> getNotes(Long investigationId) {
        log.debug("Fetching notes for investigation: {}", investigationId);
        return investigationNoteRepository.findByInvestigationIdOrderByCreatedAtDesc(investigationId)
                .stream().map(this::toNoteDTO).collect(Collectors.toList());
    }

    // ===== Evidence =====

    @Override
    public InvestigationEvidenceDTO addEvidence(Long investigationId, AddInvestigationEvidenceDTO dto, Long addedByUserId) {
        log.info("Adding evidence to investigation: {} by user: {}", investigationId, addedByUserId);
        Investigation investigation = investigationRepository.findById(investigationId)
                .orElseThrow(() -> new ResourceNotFoundException("Investigation not found with id: " + investigationId));
        User addedBy = userRepository.findById(addedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + addedByUserId));

        InvestigationEvidence evidence = InvestigationEvidence.builder()
                .investigation(investigation)
                .evidenceType(dto.getEvidenceType())
                .referenceId(dto.getReferenceId())
                .referenceType(dto.getReferenceType())
                .description(dto.getDescription())
                .filePath(dto.getFilePath())
                .addedBy(addedBy)
                .build();

        InvestigationEvidence saved = investigationEvidenceRepository.save(evidence);
        return toEvidenceDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvestigationEvidenceDTO> getEvidence(Long investigationId) {
        log.debug("Fetching evidence for investigation: {}", investigationId);
        return investigationEvidenceRepository.findByInvestigationIdOrderByCreatedAtDesc(investigationId)
                .stream().map(this::toEvidenceDTO).collect(Collectors.toList());
    }

    // ===== Timeline =====

    @Override
    @Transactional(readOnly = true)
    public List<InvestigationTimelineDTO> getTimeline(Long investigationId) {
        log.debug("Building timeline for investigation: {}", investigationId);
        Investigation investigation = investigationRepository.findById(investigationId)
                .orElseThrow(() -> new ResourceNotFoundException("Investigation not found with id: " + investigationId));

        List<InvestigationTimelineDTO> timeline = new ArrayList<>();

        // Created event
        timeline.add(InvestigationTimelineDTO.builder()
                .type("CREATED")
                .description("Investigation created: " + investigation.getTitle())
                .actor(toUserSummary(investigation.getCreatedBy()))
                .timestamp(investigation.getCreatedAt())
                .build());

        // Notes as timeline entries
        investigation.getNotes().forEach(note ->
                timeline.add(InvestigationTimelineDTO.builder()
                        .type("NOTE")
                        .description(note.getContent().length() > 100
                                ? note.getContent().substring(0, 100) + "..."
                                : note.getContent())
                        .actor(toUserSummary(note.getAuthor()))
                        .timestamp(note.getCreatedAt())
                        .build())
        );

        // Evidence as timeline entries
        investigation.getEvidence().forEach(evidence ->
                timeline.add(InvestigationTimelineDTO.builder()
                        .type("EVIDENCE_ADDED")
                        .description("Evidence added: " + evidence.getEvidenceType()
                                + (evidence.getDescription() != null ? " - " + evidence.getDescription() : ""))
                        .actor(toUserSummary(evidence.getAddedBy()))
                        .timestamp(evidence.getCreatedAt())
                        .build())
        );

        // Resolved event
        if (investigation.getResolvedAt() != null) {
            timeline.add(InvestigationTimelineDTO.builder()
                    .type("STATUS_CHANGE")
                    .description("Investigation resolved")
                    .actor(toUserSummary(investigation.getAssignedTo()))
                    .timestamp(investigation.getResolvedAt())
                    .build());
        }

        // Sort by timestamp
        timeline.sort(Comparator.comparing(InvestigationTimelineDTO::getTimestamp));
        return timeline;
    }

    // ===== Statistics =====

    @Override
    @Transactional(readOnly = true)
    public InvestigationStatsDTO getInvestigationStats() {
        log.debug("Fetching investigation stats");
        LocalDate today = LocalDate.now();
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime now = LocalDateTime.now();

        long total = investigationRepository.count();
        long openCount = investigationRepository.countByStatus(InvestigationStatus.OPEN);
        long inProgressCount = investigationRepository.countByStatus(InvestigationStatus.IN_PROGRESS);
        long resolvedCount = investigationRepository.countByStatus(InvestigationStatus.RESOLVED);
        long closedCount = investigationRepository.countByStatus(InvestigationStatus.CLOSED);
        long overdueCount = investigationRepository.countOverdue(today);
        long resolvedThisMonth = investigationRepository.countResolvedBetween(monthStart, now);

        // Average resolution days — simplified approach
        double avgResolutionDays = 0.0;
        // Could query resolved investigations and compute avg(resolvedAt - createdAt)
        // For now, left at 0 or could be populated via a custom query

        return InvestigationStatsDTO.builder()
                .totalInvestigations(total)
                .openCount(openCount)
                .inProgressCount(inProgressCount)
                .resolvedCount(resolvedCount)
                .closedCount(closedCount)
                .overdueCount(overdueCount)
                .byType(List.of())      // can be populated with a custom group-by query
                .bySeverity(List.of())   // can be populated with a custom group-by query
                .byAssignee(List.of())   // can be populated with a custom group-by query
                .avgResolutionDays(avgResolutionDays)
                .resolvedThisMonth(resolvedThisMonth)
                .build();
    }

    // ===== Specification builder =====

    private Specification<Investigation> buildSpecification(InvestigationFilterDTO filter) {
        return (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();

            if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }

            if (filter.getStatuses() != null && !filter.getStatuses().isEmpty()) {
                predicates.add(root.get("status").in(filter.getStatuses()));
            }

            if (filter.getTypes() != null && !filter.getTypes().isEmpty()) {
                predicates.add(root.get("type").in(filter.getTypes()));
            }

            if (filter.getSeverities() != null && !filter.getSeverities().isEmpty()) {
                predicates.add(root.get("severity").in(filter.getSeverities()));
            }

            if (filter.getAssignedToId() != null) {
                predicates.add(cb.equal(root.get("assignedTo").get("id"), filter.getAssignedToId()));
            }

            if (filter.getCreatedById() != null) {
                predicates.add(cb.equal(root.get("createdBy").get("id"), filter.getCreatedById()));
            }

            if (Boolean.TRUE.equals(filter.getOverdue())) {
                predicates.add(cb.lessThan(root.get("dueDate"), LocalDate.now()));
                predicates.add(root.get("status").in(
                        InvestigationStatus.OPEN, InvestigationStatus.IN_PROGRESS));
            }

            if (filter.getFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFrom()));
            }

            if (filter.getTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getTo()));
            }

            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
    }

    // ===== Mapping helpers =====

    private InvestigationDTO toFullDTO(Investigation entity) {
        return InvestigationDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .severity(entity.getSeverity())
                .type(entity.getType())
                .status(entity.getStatus())
                .assignedTo(toUserSummary(entity.getAssignedTo()))
                .createdBy(toUserSummary(entity.getCreatedBy()))
                .dueDate(entity.getDueDate())
                .resolutionSummary(entity.getResolutionSummary())
                .preventiveMeasures(entity.getPreventiveMeasures())
                .relatedUsers(entity.getRelatedUsers() != null
                        ? entity.getRelatedUsers().stream().map(this::toUserSummary).collect(Collectors.toSet())
                        : Set.of())
                .relatedIps(entity.getRelatedIps() != null ? entity.getRelatedIps() : List.of())
                .relatedEventIds(entity.getRelatedEventIds() != null ? entity.getRelatedEventIds() : List.of())
                .notes(entity.getNotes() != null
                        ? entity.getNotes().stream().map(this::toNoteDTO).collect(Collectors.toList())
                        : List.of())
                .evidence(entity.getEvidence() != null
                        ? entity.getEvidence().stream().map(this::toEvidenceDTO).collect(Collectors.toList())
                        : List.of())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .resolvedAt(entity.getResolvedAt())
                .build();
    }

    private InvestigationSummaryDTO toSummaryDTO(Investigation entity) {
        LocalDate today = LocalDate.now();
        boolean overdue = entity.getDueDate() != null
                && entity.getDueDate().isBefore(today)
                && (entity.getStatus() == InvestigationStatus.OPEN
                || entity.getStatus() == InvestigationStatus.IN_PROGRESS);

        return InvestigationSummaryDTO.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .severity(entity.getSeverity())
                .type(entity.getType())
                .status(entity.getStatus())
                .assignedTo(toUserSummary(entity.getAssignedTo()))
                .createdBy(toUserSummary(entity.getCreatedBy()))
                .dueDate(entity.getDueDate())
                .notesCount(entity.getNotes() != null ? entity.getNotes().size() : 0)
                .evidenceCount(entity.getEvidence() != null ? entity.getEvidence().size() : 0)
                .relatedUsersCount(entity.getRelatedUsers() != null ? entity.getRelatedUsers().size() : 0)
                .overdue(overdue)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private InvestigationNoteDTO toNoteDTO(InvestigationNote note) {
        return InvestigationNoteDTO.builder()
                .id(note.getId())
                .investigationId(note.getInvestigation() != null ? note.getInvestigation().getId() : null)
                .author(toUserSummary(note.getAuthor()))
                .content(note.getContent())
                .createdAt(note.getCreatedAt())
                .build();
    }

    private InvestigationEvidenceDTO toEvidenceDTO(InvestigationEvidence evidence) {
        return InvestigationEvidenceDTO.builder()
                .id(evidence.getId())
                .investigationId(evidence.getInvestigation() != null ? evidence.getInvestigation().getId() : null)
                .evidenceType(evidence.getEvidenceType())
                .referenceId(evidence.getReferenceId())
                .referenceType(evidence.getReferenceType())
                .description(evidence.getDescription())
                .filePath(evidence.getFilePath())
                .addedBy(toUserSummary(evidence.getAddedBy()))
                .createdAt(evidence.getCreatedAt())
                .build();
    }

    private UserSummaryDTO toUserSummary(User user) {
        if (user == null) return null;
        return UserSummaryDTO.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .build();
    }

    private static final java.util.Set<String> ALLOWED_INVESTIGATION_SORT_FIELDS = java.util.Set.of(
            "createdAt", "status", "id");

    private Pageable createPageable(InvestigationFilterDTO filter) {
        String sortBy = com.q2k.meditech.util.SortFieldValidator.validate(
                filter.getSortBy(), ALLOWED_INVESTIGATION_SORT_FIELDS, "createdAt");
        Sort.Direction direction = "ASC".equalsIgnoreCase(filter.getSortDir())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(
                filter.getPageNumber() != null ? filter.getPageNumber() : 0,
                filter.getPageSize() != null ? filter.getPageSize() : 20,
                Sort.by(direction, sortBy)
        );
    }
}
