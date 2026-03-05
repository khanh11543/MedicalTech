package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.enums.BlockScope;
import com.q2k.meditech.entity.enums.BlockType;
import com.q2k.meditech.entity.enums.IpStatus;
import com.q2k.meditech.service.IpManagementService;
import com.q2k.meditech.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/admin/security/ip")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Admin - IP Management", description = "APIs for managing blocked IPs and IP rules (10.2)")
public class AdminIpManagementController {

    private final IpManagementService ipManagementService;

    // ===== Blocked IPs =====

    @GetMapping("/blocked")
    @Operation(summary = "List blocked IPs", description = "Get paginated list of blocked IPs with filters")
    public ResponseEntity<Page<BlockedIpDTO>> getBlockedIps(
            @Parameter(description = "Search by IP") @RequestParam(required = false) String search,
            @Parameter(description = "Block type") @RequestParam(required = false) BlockType blockType,
            @Parameter(description = "Block scope") @RequestParam(required = false) BlockScope blockScope,
            @Parameter(description = "Auto-blocked only") @RequestParam(required = false) Boolean isAutoBlocked,
            @Parameter(description = "Active only") @RequestParam(required = false) Boolean isActive,
            @Parameter(description = "From datetime") @RequestParam(required = false) LocalDateTime from,
            @Parameter(description = "To datetime") @RequestParam(required = false) LocalDateTime to,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "blockedAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "DESC") String sortDir,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") Integer pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") Integer pageSize) {

        log.info("GET /admin/security/ip/blocked - search: {}", search);
        BlockedIpFilterDTO filter = BlockedIpFilterDTO.builder()
                .search(search)
                .blockType(blockType)
                .blockScope(blockScope)
                .isAutoBlocked(isAutoBlocked)
                .isActive(isActive)
                .from(from)
                .to(to)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();

        return ResponseEntity.ok(ipManagementService.getBlockedIps(filter));
    }

    @GetMapping("/blocked/{id}")
    @Operation(summary = "Get blocked IP detail", description = "Get a single blocked IP record by ID")
    public ResponseEntity<BlockedIpDTO> getBlockedIpById(
            @Parameter(description = "Blocked IP ID") @PathVariable Long id) {
        log.info("GET /admin/security/ip/blocked/{}", id);
        return ResponseEntity.ok(ipManagementService.getBlockedIpById(id));
    }

    @PostMapping("/blocked")
    @Operation(summary = "Block an IP", description = "Manually block an IP address")
    public ResponseEntity<BlockedIpDTO> blockIp(@Valid @RequestBody BlockIpDTO dto) {
        log.info("POST /admin/security/ip/blocked - ip: {}", dto.getIpAddress());
        Long currentUserId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(ipManagementService.blockIp(dto, currentUserId));
    }

    @PatchMapping("/blocked/{id}/unblock")
    @Operation(summary = "Unblock an IP", description = "Remove an IP from the blocklist")
    public ResponseEntity<BlockedIpDTO> unblockIp(
            @Parameter(description = "Blocked IP ID") @PathVariable Long id) {
        log.info("PATCH /admin/security/ip/blocked/{}/unblock", id);
        return ResponseEntity.ok(ipManagementService.unblockIp(id));
    }

    @GetMapping("/check")
    @Operation(summary = "Check if IP is blocked", description = "Check whether a specific IP address is currently blocked")
    public ResponseEntity<Boolean> isIpBlocked(
            @Parameter(description = "IP address to check") @RequestParam String ipAddress) {
        log.info("GET /admin/security/ip/check - ip: {}", ipAddress);
        return ResponseEntity.ok(ipManagementService.isIpBlocked(ipAddress));
    }

    // ===== IP Rules =====

    @GetMapping("/rules")
    @Operation(summary = "List IP rules", description = "Get paginated list of IP rules with filters")
    public ResponseEntity<Page<IpRuleDTO>> getIpRules(
            @Parameter(description = "Search by IP") @RequestParam(required = false) String search,
            @Parameter(description = "IP status") @RequestParam(required = false) IpStatus status,
            @Parameter(description = "Rule type (BLOCK/ALLOW)") @RequestParam(required = false) String ruleType,
            @Parameter(description = "Active only") @RequestParam(required = false) Boolean isActive,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "DESC") String sortDir,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") Integer pageNumber,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") Integer pageSize) {

        log.info("GET /admin/security/ip/rules - search: {}", search);
        IpRuleFilterDTO filter = IpRuleFilterDTO.builder()
                .search(search)
                .status(status)
                .ruleType(ruleType)
                .isActive(isActive)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .pageNumber(pageNumber)
                .pageSize(pageSize)
                .build();

        return ResponseEntity.ok(ipManagementService.getIpRules(filter));
    }

    @GetMapping("/rules/{id}")
    @Operation(summary = "Get IP rule detail", description = "Get a single IP rule by ID")
    public ResponseEntity<IpRuleDTO> getIpRuleById(
            @Parameter(description = "Rule ID") @PathVariable Long id) {
        log.info("GET /admin/security/ip/rules/{}", id);
        return ResponseEntity.ok(ipManagementService.getIpRuleById(id));
    }

    @PostMapping("/rules")
    @Operation(summary = "Create IP rule", description = "Create a new IP rule")
    public ResponseEntity<IpRuleDTO> createIpRule(@Valid @RequestBody CreateIpRuleDTO dto) {
        log.info("POST /admin/security/ip/rules - ip: {}, type: {}", dto.getIpAddress(), dto.getRuleType());
        Long currentUserId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(ipManagementService.createIpRule(dto, currentUserId));
    }

    @PutMapping("/rules/{id}")
    @Operation(summary = "Update IP rule", description = "Update an existing IP rule")
    public ResponseEntity<IpRuleDTO> updateIpRule(
            @Parameter(description = "Rule ID") @PathVariable Long id,
            @Valid @RequestBody UpdateIpRuleDTO dto) {
        log.info("PUT /admin/security/ip/rules/{}", id);
        return ResponseEntity.ok(ipManagementService.updateIpRule(id, dto));
    }

    @DeleteMapping("/rules/{id}")
    @Operation(summary = "Delete IP rule", description = "Delete an IP rule")
    public ResponseEntity<MessageDTO> deleteIpRule(
            @Parameter(description = "Rule ID") @PathVariable Long id) {
        log.info("DELETE /admin/security/ip/rules/{}", id);
        ipManagementService.deleteIpRule(id);
        return ResponseEntity.ok(MessageDTO.success("IP rule deleted successfully"));
    }

    // ===== Statistics =====

    @GetMapping("/stats")
    @Operation(summary = "Get IP management statistics", description = "Get aggregate stats for blocked IPs and rules")
    public ResponseEntity<IpManagementStatsDTO> getStats() {
        log.info("GET /admin/security/ip/stats");
        return ResponseEntity.ok(ipManagementService.getIpManagementStats());
    }
}
