package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import org.springframework.data.domain.Page;

import java.time.LocalDate;

public interface ConsentManagementService {

    ConsentStatsDTO getConsentStatistics(LocalDate from, LocalDate to);

    Page<UserConsentDTO> getConsentRecords(ConsentFilterDTO filter);

    UserConsentDetailDTO getUserConsentDetail(Long userId);

    UserConsentDTO revokeConsent(Long id, RevokeConsentDTO dto);

    byte[] exportConsentRecords(Long userId, String consentType, LocalDate from, LocalDate to, String format);

    String getExportFileName(String format);

    ConsentTrendsDTO getConsentTrends(LocalDate from, LocalDate to, String groupBy, String consentType);
}
