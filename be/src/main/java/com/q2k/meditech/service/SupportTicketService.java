package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.SupportTicket;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.SupportTicketRepository;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final UserRepository userRepository;

    /**
     * Create a support ticket (User)
     */
    @Transactional
    public SupportTicketDTO createTicket(Long userId, CreateSupportTicketDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        SupportTicket ticket = SupportTicket.builder()
                .user(user)
                .subject(dto.getSubject())
                .message(dto.getMessage())
                .category(dto.getCategory())
                .priority(dto.getPriority() != null ? dto.getPriority() : "MEDIUM")
                .status("OPEN")
                .build();

        ticket = supportTicketRepository.save(ticket);
        log.info("Support ticket created by user {} with id {}", userId, ticket.getId());
        return convertToDTO(ticket);
    }

    /**
     * Get tickets for current user
     */
    public Page<SupportTicketDTO> getUserTickets(Long userId, Pageable pageable) {
        return supportTicketRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::convertToDTO);
    }

    /**
     * Get single ticket (with ownership check for users)
     */
    public SupportTicketDTO getTicket(Long ticketId, Long userId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("SupportTicket", "id", ticketId));

        if (userId != null && !ticket.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Ticket does not belong to this user");
        }

        return convertToDTO(ticket);
    }

    /**
     * List all tickets with filters (Admin)
     */
    public Page<SupportTicketDTO> listAllTickets(String status, String category, String priority, String q, Pageable pageable) {
        Specification<SupportTicket> spec = Specification.where(null);

        if (status != null && !status.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }
        if (category != null && !category.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("category"), category));
        }
        if (priority != null && !priority.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("priority"), priority));
        }
        if (q != null && !q.isEmpty()) {
            String searchPattern = "%" + q.toLowerCase() + "%";
            spec = spec.and((root, query, cb) ->
                    cb.or(
                            cb.like(cb.lower(root.get("subject")), searchPattern),
                            cb.like(cb.lower(root.get("message")), searchPattern)
                    )
            );
        }

        return supportTicketRepository.findAll(spec, pageable).map(this::convertToDTO);
    }

    /**
     * Respond to a ticket (Admin)
     */
    @Transactional
    public SupportTicketDTO respondToTicket(Long ticketId, Long adminId, RespondTicketDTO dto) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("SupportTicket", "id", ticketId));

        ticket.setAdminResponse(dto.getAdminResponse());
        ticket.setRespondedAt(LocalDateTime.now());
        ticket.setRespondedBy(adminId);

        if (dto.getStatus() != null && !dto.getStatus().isEmpty()) {
            ticket.setStatus(dto.getStatus());
        } else {
            ticket.setStatus("IN_PROGRESS");
        }

        ticket = supportTicketRepository.save(ticket);
        log.info("Ticket {} responded by admin {}", ticketId, adminId);
        return convertToDTO(ticket);
    }

    /**
     * Close a ticket (Admin)
     */
    @Transactional
    public SupportTicketDTO closeTicket(Long ticketId) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("SupportTicket", "id", ticketId));

        ticket.setStatus("CLOSED");
        ticket = supportTicketRepository.save(ticket);
        log.info("Ticket {} closed", ticketId);
        return convertToDTO(ticket);
    }

    /**
     * Get ticket stats (Admin)
     */
    public SupportTicketStatsDTO getTicketStats() {
        long total = supportTicketRepository.count();
        long open = supportTicketRepository.countByStatus("OPEN");
        long inProgress = supportTicketRepository.countByStatus("IN_PROGRESS");
        long resolved = supportTicketRepository.countByStatus("RESOLVED");
        long closed = supportTicketRepository.countByStatus("CLOSED");

        return SupportTicketStatsDTO.builder()
                .totalTickets(total)
                .openTickets(open)
                .inProgressTickets(inProgress)
                .resolvedTickets(resolved)
                .closedTickets(closed)
                .build();
    }

    private SupportTicketDTO convertToDTO(SupportTicket ticket) {
        return SupportTicketDTO.builder()
                .id(ticket.getId())
                .userId(ticket.getUser().getId())
                .userEmail(ticket.getUser().getEmail())
                .userName(ticket.getUser().getFullName() != null ? ticket.getUser().getFullName() : ticket.getUser().getEmail())
                .subject(ticket.getSubject())
                .message(ticket.getMessage())
                .category(ticket.getCategory())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .adminResponse(ticket.getAdminResponse())
                .respondedAt(ticket.getRespondedAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
