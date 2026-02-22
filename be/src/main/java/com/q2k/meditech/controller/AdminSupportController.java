package com.q2k.meditech.controller;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.service.SupportTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Admin Support Ticket Controller
 * Base path: /api/admin/support-tickets
 */
@RestController
@RequestMapping("/admin/support-tickets")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - Support Tickets", description = "Admin support ticket management APIs")
public class AdminSupportController {

    private final SupportTicketService supportTicketService;
    private final UserRepository userRepository;

    /**
     * GET /api/admin/support-tickets
     */
    @GetMapping
    @Operation(summary = "List all support tickets")
    public ResponseEntity<Page<SupportTicketDTO>> listTickets(
            @Parameter(description = "Filter by status") @RequestParam(required = false) String status,
            @Parameter(description = "Filter by category") @RequestParam(required = false) String category,
            @Parameter(description = "Filter by priority") @RequestParam(required = false) String priority,
            @Parameter(description = "Search in subject/message") @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int pageNumber,
            @RequestParam(defaultValue = "20") int pageSize,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {

        Sort sort = sortOrder.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Page<SupportTicketDTO> tickets = supportTicketService.listAllTickets(
                status, category, priority, q, PageRequest.of(pageNumber, pageSize, sort));

        return ResponseEntity.ok(tickets);
    }

    /**
     * GET /api/admin/support-tickets/stats
     */
    @GetMapping("/stats")
    @Operation(summary = "Get support ticket statistics")
    public ResponseEntity<SupportTicketStatsDTO> getStats() {
        return ResponseEntity.ok(supportTicketService.getTicketStats());
    }

    /**
     * GET /api/admin/support-tickets/{id}
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get ticket detail")
    public ResponseEntity<SupportTicketDTO> getTicketDetail(@PathVariable Long id) {
        return ResponseEntity.ok(supportTicketService.getTicket(id, null));
    }

    /**
     * PATCH /api/admin/support-tickets/{id}/respond
     */
    @PatchMapping("/{id}/respond")
    @Operation(summary = "Respond to a ticket")
    public ResponseEntity<SupportTicketDTO> respondToTicket(
            @PathVariable Long id,
            @Valid @RequestBody RespondTicketDTO dto) {

        Long adminId = getAuthenticatedUserId();
        SupportTicketDTO ticket = supportTicketService.respondToTicket(id, adminId, dto);
        return ResponseEntity.ok(ticket);
    }

    /**
     * PATCH /api/admin/support-tickets/{id}/close
     */
    @PatchMapping("/{id}/close")
    @Operation(summary = "Close a ticket")
    public ResponseEntity<SupportTicketDTO> closeTicket(@PathVariable Long id) {
        return ResponseEntity.ok(supportTicketService.closeTicket(id));
    }

    private Long getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return user.getId();
    }
}
