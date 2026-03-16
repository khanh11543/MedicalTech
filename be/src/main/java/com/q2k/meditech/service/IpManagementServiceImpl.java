package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.BlockedIp;
import com.q2k.meditech.entity.IpRule;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.IpStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.BlockedIpRepository;
import com.q2k.meditech.repository.IpRuleRepository;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Implementation of IpManagementService (10.2 IP Management).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class IpManagementServiceImpl implements IpManagementService {

    private final BlockedIpRepository blockedIpRepository;
    private final IpRuleRepository ipRuleRepository;
    private final UserRepository userRepository;

    // ===== Blocked IPs =====

    @Override
    @Transactional(readOnly = true)
    public Page<BlockedIpDTO> getBlockedIps(BlockedIpFilterDTO filter) {
        log.debug("Fetching blocked IPs with filter: {}", filter);
        Pageable pageable = createBlockedIpPageable(filter);

        Page<BlockedIp> page;
        if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
            page = blockedIpRepository.searchActiveByIpAddress(filter.getSearch(), pageable);
        } else if (Boolean.TRUE.equals(filter.getIsActive())) {
            page = blockedIpRepository.findByIsActiveTrueOrderByBlockedAtDesc(pageable);
        } else {
            page = blockedIpRepository.findAll(pageable);
        }

        return page.map(this::toBlockedIpDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public BlockedIpDTO getBlockedIpById(Long id) {
        log.debug("Fetching blocked IP by id: {}", id);
        BlockedIp blockedIp = blockedIpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blocked IP not found with id: " + id));
        return toBlockedIpDTO(blockedIp);
    }

    @Override
    public BlockedIpDTO blockIp(BlockIpDTO dto, Long blockedByUserId) {
        log.info("Blocking IP: {} by user: {}", dto.getIpAddress(), blockedByUserId);

        if (blockedIpRepository.existsByIpAddressAndIsActiveTrue(dto.getIpAddress())) {
            throw new DuplicateResourceException("IP address is already blocked: " + dto.getIpAddress());
        }

        User blockedByUser = userRepository.findById(blockedByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + blockedByUserId));

        BlockedIp blockedIp = BlockedIp.builder()
                .ipAddress(dto.getIpAddress())
                .reason(dto.getReason())
                .blockedBy(blockedByUser)
                .blockType(dto.getBlockType())
                .blockScope(dto.getBlockScope())
                .expiresAt(dto.getExpiresAt())
                .isAutoBlocked(false)
                .isActive(true)
                .build();

        BlockedIp saved = blockedIpRepository.save(blockedIp);
        log.info("IP blocked successfully: {}", saved.getIpAddress());
        return toBlockedIpDTO(saved);
    }

    @Override
    public BlockedIpDTO unblockIp(Long id) {
        log.info("Unblocking IP with id: {}", id);
        BlockedIp blockedIp = blockedIpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Blocked IP not found with id: " + id));

        if (!Boolean.TRUE.equals(blockedIp.getIsActive())) {
            throw new BadRequestException("IP is already unblocked");
        }

        blockedIp.setIsActive(false);
        blockedIp.setUnblockedAt(LocalDateTime.now());

        BlockedIp saved = blockedIpRepository.save(blockedIp);
        return toBlockedIpDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isIpBlocked(String ipAddress) {
        return blockedIpRepository.existsByIpAddressAndIsActiveTrue(ipAddress);
    }

    // ===== IP Rules =====

    @Override
    @Transactional(readOnly = true)
    public Page<IpRuleDTO> getIpRules(IpRuleFilterDTO filter) {
        log.debug("Fetching IP rules with filter: {}", filter);
        Pageable pageable = createIpRulePageable(filter);

        Page<IpRule> page;
        if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
            page = ipRuleRepository.searchByIpAddress(filter.getSearch(), pageable);
        } else if (filter.getStatus() != null) {
            page = ipRuleRepository.findByStatusAndIsActiveTrueOrderByCreatedAtDesc(filter.getStatus(), pageable);
        } else if (filter.getRuleType() != null && !filter.getRuleType().isBlank()) {
            page = ipRuleRepository.findByRuleTypeAndIsActiveTrueOrderByCreatedAtDesc(filter.getRuleType(), pageable);
        } else {
            page = ipRuleRepository.findAll(pageable);
        }

        return page.map(this::toIpRuleDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public IpRuleDTO getIpRuleById(Long id) {
        log.debug("Fetching IP rule by id: {}", id);
        IpRule rule = ipRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("IP rule not found with id: " + id));
        return toIpRuleDTO(rule);
    }

    @Override
    public IpRuleDTO createIpRule(CreateIpRuleDTO dto, Long createdByUserId) {
        log.info("Creating IP rule for: {} by user: {}", dto.getIpAddress(), createdByUserId);

        if (ipRuleRepository.existsByIpAddressAndIsActiveTrue(dto.getIpAddress())) {
            throw new DuplicateResourceException("An active IP rule already exists for: " + dto.getIpAddress());
        }

        User createdBy = userRepository.findById(createdByUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + createdByUserId));

        IpRule rule = IpRule.builder()
                .ipAddress(dto.getIpAddress())
                .ruleType(dto.getRuleType())
                .status(dto.getStatus())
                .scope(dto.getScope())
                .reason(dto.getReason())
                .description(dto.getDescription())
                .isActive(true)
                .createdBy(createdBy)
                .build();

        IpRule saved = ipRuleRepository.save(rule);
        log.info("IP rule created: id={}", saved.getId());
        return toIpRuleDTO(saved);
    }

    @Override
    public IpRuleDTO updateIpRule(Long id, UpdateIpRuleDTO dto) {
        log.info("Updating IP rule id: {}", id);
        IpRule rule = ipRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("IP rule not found with id: " + id));

        if (dto.getStatus() != null) rule.setStatus(dto.getStatus());
        if (dto.getScope() != null) rule.setScope(dto.getScope());
        if (dto.getReason() != null) rule.setReason(dto.getReason());
        if (dto.getDescription() != null) rule.setDescription(dto.getDescription());
        if (dto.getIsActive() != null) rule.setIsActive(dto.getIsActive());

        IpRule saved = ipRuleRepository.save(rule);
        return toIpRuleDTO(saved);
    }

    @Override
    public void deleteIpRule(Long id) {
        log.info("Deleting IP rule id: {}", id);
        IpRule rule = ipRuleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("IP rule not found with id: " + id));
        ipRuleRepository.delete(rule);
    }

    // ===== Statistics =====

    @Override
    @Transactional(readOnly = true)
    public IpManagementStatsDTO getIpManagementStats() {
        log.debug("Fetching IP management stats");
        return IpManagementStatsDTO.builder()
                .totalBlockedIps(blockedIpRepository.count())
                .activeBlockedIps(blockedIpRepository.countActiveBlocked())
                .autoBlockedCount(blockedIpRepository.countActiveAutoBlocked())
                .manuallyBlockedCount(blockedIpRepository.countManuallyBlocked())
                .temporaryBlocksCount(blockedIpRepository.countTemporaryBlocks())
                .permanentBlocksCount(blockedIpRepository.countActiveBlocked() - blockedIpRepository.countTemporaryBlocks())
                .totalIpRules(ipRuleRepository.count())
                .blockedRulesCount(ipRuleRepository.countByStatusAndActive(IpStatus.BLOCKED))
                .whitelistedCount(ipRuleRepository.countByStatusAndActive(IpStatus.WHITELISTED))
                .flaggedCount(ipRuleRepository.countByStatusAndActive(IpStatus.FLAGGED))
                .build();
    }

    // ===== Mapping helpers =====

    private BlockedIpDTO toBlockedIpDTO(BlockedIp entity) {
        return BlockedIpDTO.builder()
                .id(entity.getId())
                .ipAddress(entity.getIpAddress())
                .reason(entity.getReason())
                .blockedBy(toUserSummary(entity.getBlockedBy()))
                .blockType(entity.getBlockType())
                .blockScope(entity.getBlockScope())
                .geoCountry(entity.getGeoCountry())
                .geoCity(entity.getGeoCity())
                .eventCount(entity.getEventCount())
                .isAutoBlocked(entity.getIsAutoBlocked())
                .isActive(entity.getIsActive())
                .expiresAt(entity.getExpiresAt())
                .blockedAt(entity.getBlockedAt())
                .unblockedAt(entity.getUnblockedAt())
                .build();
    }

    private IpRuleDTO toIpRuleDTO(IpRule entity) {
        return IpRuleDTO.builder()
                .id(entity.getId())
                .ipAddress(entity.getIpAddress())
                .ruleType(entity.getRuleType())
                .status(entity.getStatus())
                .scope(entity.getScope())
                .reason(entity.getReason())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .createdBy(toUserSummary(entity.getCreatedBy()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
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

    private static final java.util.Set<String> ALLOWED_BLOCKED_IP_SORT_FIELDS = java.util.Set.of(
            "blockedAt", "createdAt", "id");
    private static final java.util.Set<String> ALLOWED_IP_RULE_SORT_FIELDS = java.util.Set.of(
            "createdAt", "id");

    private Pageable createBlockedIpPageable(BlockedIpFilterDTO filter) {
        String sortBy = com.q2k.meditech.util.SortFieldValidator.validate(
                filter.getSortBy(), ALLOWED_BLOCKED_IP_SORT_FIELDS, "blockedAt");
        Sort.Direction direction = "ASC".equalsIgnoreCase(filter.getSortDir())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(
                filter.getPageNumber() != null ? filter.getPageNumber() : 0,
                filter.getPageSize() != null ? filter.getPageSize() : 20,
                Sort.by(direction, sortBy)
        );
    }

    private Pageable createIpRulePageable(IpRuleFilterDTO filter) {
        String sortBy = com.q2k.meditech.util.SortFieldValidator.validate(
                filter.getSortBy(), ALLOWED_IP_RULE_SORT_FIELDS, "createdAt");
        Sort.Direction direction = "ASC".equalsIgnoreCase(filter.getSortDir())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(
                filter.getPageNumber() != null ? filter.getPageNumber() : 0,
                filter.getPageSize() != null ? filter.getPageSize() : 20,
                Sort.by(direction, sortBy)
        );
    }
}
