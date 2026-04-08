package com.q2k.meditech.service;

import com.q2k.meditech.dto.security.*;
import com.q2k.meditech.entity.BlockedIp;
import com.q2k.meditech.entity.IpRule;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.enums.BlockScope;
import com.q2k.meditech.entity.enums.BlockType;
import com.q2k.meditech.entity.enums.IpStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.exception.DuplicateResourceException;
import com.q2k.meditech.repository.BlockedIpRepository;
import com.q2k.meditech.repository.IpRuleRepository;
import com.q2k.meditech.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IpManagementServiceImplTest {

    @Mock
    private BlockedIpRepository blockedIpRepository;

    @Mock
    private IpRuleRepository ipRuleRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private IpManagementServiceImpl service;

    @Test
    void getBlockedIps_searchBranch() {
        BlockedIpFilterDTO f = BlockedIpFilterDTO.builder().search("10.").build();
        Page<BlockedIp> page = new PageImpl<>(List.of());
        when(blockedIpRepository.searchActiveByIpAddress(eq("10."), any())).thenReturn(page);
        assertThat(service.getBlockedIps(f).getContent()).isEmpty();
    }

    @Test
    void getBlockedIps_activeBranch() {
        BlockedIpFilterDTO f = BlockedIpFilterDTO.builder().isActive(true).build();
        when(blockedIpRepository.findByIsActiveTrueOrderByBlockedAtDesc(any())).thenReturn(Page.empty(PageRequest.of(0, 20)));
        service.getBlockedIps(f);
    }

    @Test
    void getBlockedIps_allBranch() {
        BlockedIpFilterDTO f = BlockedIpFilterDTO.builder().build();
        when(blockedIpRepository.findAll(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(Page.empty(PageRequest.of(0, 20)));
        service.getBlockedIps(f);
    }

    @Test
    void getBlockedIpById() {
        BlockedIp b = BlockedIp.builder().ipAddress("1.1.1.1").build();
        b.setId(1L);
        when(blockedIpRepository.findById(1L)).thenReturn(Optional.of(b));
        assertThat(service.getBlockedIpById(1L).getIpAddress()).isEqualTo("1.1.1.1");
    }

    @Test
    void blockIp_success() {
        when(blockedIpRepository.existsByIpAddressAndIsActiveTrue("9.9.9.9")).thenReturn(false);
        User u = User.builder().build();
        u.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        BlockedIp saved = BlockedIp.builder().ipAddress("9.9.9.9").build();
        saved.setId(2L);
        when(blockedIpRepository.save(any(BlockedIp.class))).thenReturn(saved);
        BlockIpDTO dto = BlockIpDTO.builder()
                .ipAddress("9.9.9.9")
                .reason("r")
                .blockType(BlockType.PERMANENT)
                .blockScope(BlockScope.ENTIRE_SYSTEM)
                .build();
        assertThat(service.blockIp(dto, 1L).getId()).isEqualTo(2L);
    }

    @Test
    void blockIp_duplicate_throws() {
        when(blockedIpRepository.existsByIpAddressAndIsActiveTrue("1.1.1.1")).thenReturn(true);
        BlockIpDTO dto = BlockIpDTO.builder()
                .ipAddress("1.1.1.1")
                .reason("r")
                .blockType(BlockType.PERMANENT)
                .build();
        assertThatThrownBy(() -> service.blockIp(dto, 1L)).isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    void unblockIp() {
        BlockedIp b = BlockedIp.builder().isActive(true).build();
        b.setId(3L);
        when(blockedIpRepository.findById(3L)).thenReturn(Optional.of(b));
        when(blockedIpRepository.save(any(BlockedIp.class))).thenAnswer(inv -> inv.getArgument(0));
        service.unblockIp(3L);
        assertThat(b.getIsActive()).isFalse();
    }

    @Test
    void unblockIp_alreadyInactive_throws() {
        BlockedIp b = BlockedIp.builder().isActive(false).build();
        b.setId(3L);
        when(blockedIpRepository.findById(3L)).thenReturn(Optional.of(b));
        assertThatThrownBy(() -> service.unblockIp(3L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void isIpBlocked() {
        when(blockedIpRepository.existsByIpAddressAndIsActiveTrue("x")).thenReturn(true);
        assertThat(service.isIpBlocked("x")).isTrue();
    }

    @Test
    void getIpRules_branches() {
        IpRuleFilterDTO f1 = IpRuleFilterDTO.builder().search("1.").build();
        when(ipRuleRepository.searchByIpAddress(eq("1."), any())).thenReturn(Page.empty(PageRequest.of(0, 20)));
        service.getIpRules(f1);

        IpRuleFilterDTO f2 = IpRuleFilterDTO.builder().status(IpStatus.BLOCKED).build();
        when(ipRuleRepository.findByStatusAndIsActiveTrueOrderByCreatedAtDesc(eq(IpStatus.BLOCKED), any()))
                .thenReturn(Page.empty(PageRequest.of(0, 20)));
        service.getIpRules(f2);

        IpRuleFilterDTO f3 = IpRuleFilterDTO.builder().ruleType("BLOCK").build();
        when(ipRuleRepository.findByRuleTypeAndIsActiveTrueOrderByCreatedAtDesc(eq("BLOCK"), any()))
                .thenReturn(Page.empty(PageRequest.of(0, 20)));
        service.getIpRules(f3);

        IpRuleFilterDTO f4 = IpRuleFilterDTO.builder().build();
        when(ipRuleRepository.findAll(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(Page.empty(PageRequest.of(0, 20)));
        service.getIpRules(f4);
    }

    @Test
    void getIpRuleById_create_update_delete_stats() {
        IpRule rule = IpRule.builder().ipAddress("2.2.2.2").build();
        rule.setId(10L);
        when(ipRuleRepository.findById(10L)).thenReturn(Optional.of(rule));
        assertThat(service.getIpRuleById(10L).getIpAddress()).isEqualTo("2.2.2.2");

        when(ipRuleRepository.existsByIpAddressAndIsActiveTrue("3.3.3.3")).thenReturn(false);
        User u = User.builder().build();
        u.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(u));
        CreateIpRuleDTO c = CreateIpRuleDTO.builder()
                .ipAddress("3.3.3.3")
                .ruleType("BLOCK")
                .status(IpStatus.BLOCKED)
                .scope(BlockScope.ENTIRE_SYSTEM)
                .reason("r")
                .build();
        when(ipRuleRepository.save(any(IpRule.class))).thenAnswer(inv -> inv.getArgument(0));
        service.createIpRule(c, 1L);

        UpdateIpRuleDTO uDto = new UpdateIpRuleDTO();
        uDto.setDescription("d");
        when(ipRuleRepository.findById(10L)).thenReturn(Optional.of(rule));
        service.updateIpRule(10L, uDto);

        when(ipRuleRepository.findById(10L)).thenReturn(Optional.of(rule));
        service.deleteIpRule(10L);
        verify(ipRuleRepository).delete(rule);

        when(blockedIpRepository.count()).thenReturn(1L);
        when(blockedIpRepository.countActiveBlocked()).thenReturn(1L);
        when(blockedIpRepository.countActiveAutoBlocked()).thenReturn(0L);
        when(blockedIpRepository.countManuallyBlocked()).thenReturn(1L);
        when(blockedIpRepository.countTemporaryBlocks()).thenReturn(0L);
        when(ipRuleRepository.count()).thenReturn(1L);
        when(ipRuleRepository.countByStatusAndActive(IpStatus.BLOCKED)).thenReturn(1L);
        when(ipRuleRepository.countByStatusAndActive(IpStatus.WHITELISTED)).thenReturn(0L);
        when(ipRuleRepository.countByStatusAndActive(IpStatus.FLAGGED)).thenReturn(0L);
        assertThat(service.getIpManagementStats().getTotalBlockedIps()).isEqualTo(1L);
    }
}
