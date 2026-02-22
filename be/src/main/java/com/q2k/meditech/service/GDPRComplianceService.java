package com.q2k.meditech.service;

import com.q2k.meditech.dto.DataProcessingActivityDTO;
import com.q2k.meditech.dto.DataRequestDTO;
import com.q2k.meditech.dto.GDPRComplianceDashboardDTO;
import com.q2k.meditech.dto.UserConsentDTO;
import com.q2k.meditech.entity.DataProcessingActivity;
import com.q2k.meditech.entity.DataRequest;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserConsent;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.DataProcessingActivityRepository;
import com.q2k.meditech.repository.DataRequestRepository;
import com.q2k.meditech.repository.UserConsentRepository;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for GDPR Compliance Management
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GDPRComplianceService {

    private final DataRequestRepository dataRequestRepository;
    private final UserConsentRepository userConsentRepository;
    private final DataProcessingActivityRepository dataProcessingActivityRepository;
    private final UserRepository userRepository;

    /**
     * Get GDPR compliance dashboard statistics
     */
    @Transactional(readOnly = true)
    public GDPRComplianceDashboardDTO getDashboardStatistics() {
        log.info("Generating GDPR compliance dashboard statistics");

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);

        // Data Request Statistics
        long totalDataRequests = dataRequestRepository.count();
        long pendingRequests = dataRequestRepository.countByStatus("PENDING");
        long completedRequests = dataRequestRepository.countByStatus("COMPLETED");
        long overdueRequests = dataRequestRepository.countOverdueRequests(thirtyDaysAgo);

        // Consent Statistics
        long totalConsents = userConsentRepository.count();
        long activeConsents = userConsentRepository.countByConsentGiven(true);
        long revokedConsents = userConsentRepository.countByConsentGiven(false);

        // Processing Activities
        long totalProcessingActivities = dataProcessingActivityRepository.count();
        long activeProcessingActivities = dataProcessingActivityRepository.findByIsActiveOrderByCreatedAtDesc(true).size();

        // Recent Data Requests (last 10)
        List<DataRequestDTO> recentDataRequests = getRecentDataRequests(10);

        // Recent Consents (last 10)
        List<UserConsentDTO> recentConsents = getRecentConsents(10);

        // Data Request Breakdown by Type
        long exportRequests = dataRequestRepository.findByRequestTypeOrderByCreatedAtDesc("DATA_EXPORT").size();
        long deletionRequests = dataRequestRepository.findByRequestTypeOrderByCreatedAtDesc("DATA_DELETION").size();
        long rectificationRequests = dataRequestRepository.findByRequestTypeOrderByCreatedAtDesc("DATA_RECTIFICATION").size();

        // Processing Activities
        List<DataProcessingActivityDTO> processingActivities = getAllProcessingActivities();

        return GDPRComplianceDashboardDTO.builder()
                .totalDataRequests(totalDataRequests)
                .pendingRequests(pendingRequests)
                .completedRequests(completedRequests)
                .overdueRequests(overdueRequests)
                .totalConsents(totalConsents)
                .activeConsents(activeConsents)
                .revokedConsents(revokedConsents)
                .totalProcessingActivities(totalProcessingActivities)
                .activeProcessingActivities(activeProcessingActivities)
                .recentDataRequests(recentDataRequests)
                .recentConsents(recentConsents)
                .exportRequests(exportRequests)
                .deletionRequests(deletionRequests)
                .rectificationRequests(rectificationRequests)
                .processingActivities(processingActivities)
                .generatedAt(now)
                .build();
    }

    /**
     * Get all data requests
     */
    @Transactional(readOnly = true)
    public List<DataRequestDTO> getAllDataRequests() {
        return dataRequestRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::convertToDataRequestDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get data request by ID
     */
    @Transactional(readOnly = true)
    public DataRequestDTO getDataRequestById(Long id) {
        DataRequest dataRequest = dataRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data request not found with id: " + id));
        return convertToDataRequestDTO(dataRequest);
    }

    /**
     * Create a new data request
     */
    @Transactional
    public DataRequestDTO createDataRequest(Long userId, String requestType, String requestReason, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        DataRequest dataRequest = DataRequest.builder()
                .user(user)
                .requestType(requestType)
                .status("PENDING")
                .requestReason(requestReason)
                .ipAddress(ipAddress)
                .build();

        DataRequest saved = dataRequestRepository.save(dataRequest);
        log.info("Created data request: {} for user: {}", saved.getId(), userId);

        return convertToDataRequestDTO(saved);
    }

    /**
     * Update data request status
     */
    @Transactional
    public DataRequestDTO updateDataRequestStatus(Long requestId, String status, String adminNotes, Long processedById) {
        DataRequest dataRequest = dataRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Data request not found with id: " + requestId));

        dataRequest.setStatus(status);
        dataRequest.setAdminNotes(adminNotes);

        if (processedById != null) {
            User processedBy = userRepository.findById(processedById)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + processedById));
            dataRequest.setProcessedBy(processedBy);
        }

        if ("COMPLETED".equals(status) || "REJECTED".equals(status)) {
            dataRequest.setProcessedAt(LocalDateTime.now());
        }

        DataRequest updated = dataRequestRepository.save(dataRequest);
        log.info("Updated data request: {} status to: {}", requestId, status);

        return convertToDataRequestDTO(updated);
    }

    /**
     * Get all user consents
     */
    @Transactional(readOnly = true)
    public List<UserConsentDTO> getAllUserConsents() {
        return userConsentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::convertToUserConsentDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get user consents by user ID
     */
    @Transactional(readOnly = true)
    public List<UserConsentDTO> getUserConsentsByUserId(Long userId) {
        return userConsentRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToUserConsentDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create or update user consent
     */
    @Transactional
    public UserConsentDTO updateUserConsent(Long userId, String consentType, Boolean consentGiven, 
                                           String consentText, String ipAddress, String userAgent) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        UserConsent consent = userConsentRepository.findByUserIdAndConsentType(userId, consentType)
                .orElse(UserConsent.builder()
                        .user(user)
                        .consentType(consentType)
                        .build());

        consent.setConsentGiven(consentGiven);
        consent.setConsentText(consentText);
        consent.setIpAddress(ipAddress);
        consent.setUserAgent(userAgent);

        if (Boolean.TRUE.equals(consentGiven)) {
            consent.setGrantedAt(LocalDateTime.now());
            consent.setRevokedAt(null);
        } else {
            consent.setRevokedAt(LocalDateTime.now());
        }

        UserConsent saved = userConsentRepository.save(consent);
        log.info("Updated consent {} for user: {} - given: {}", consentType, userId, consentGiven);

        return convertToUserConsentDTO(saved);
    }

    /**
     * Get all data processing activities
     */
    @Transactional(readOnly = true)
    public List<DataProcessingActivityDTO> getAllProcessingActivities() {
        return dataProcessingActivityRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::convertToDataProcessingActivityDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get active data processing activities
     */
    @Transactional(readOnly = true)
    public List<DataProcessingActivityDTO> getActiveProcessingActivities() {
        return dataProcessingActivityRepository.findByIsActiveOrderByCreatedAtDesc(true)
                .stream()
                .map(this::convertToDataProcessingActivityDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create data processing activity
     */
    @Transactional
    public DataProcessingActivityDTO createProcessingActivity(DataProcessingActivityDTO dto) {
        DataProcessingActivity activity = DataProcessingActivity.builder()
                .activityName(dto.getActivityName())
                .purpose(dto.getPurpose())
                .legalBasis(dto.getLegalBasis())
                .dataCategories(dto.getDataCategories())
                .dataSubjects(dto.getDataSubjects())
                .recipients(dto.getRecipients())
                .transferCountries(dto.getTransferCountries())
                .retentionPeriod(dto.getRetentionPeriod())
                .securityMeasures(dto.getSecurityMeasures())
                .dpoNotes(dto.getDpoNotes())
                .isActive(true)
                .build();

        DataProcessingActivity saved = dataProcessingActivityRepository.save(activity);
        log.info("Created data processing activity: {}", saved.getId());

        return convertToDataProcessingActivityDTO(saved);
    }

    /**
     * Update data processing activity
     */
    @Transactional
    public DataProcessingActivityDTO updateProcessingActivity(Long id, DataProcessingActivityDTO dto) {
        DataProcessingActivity activity = dataProcessingActivityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data processing activity not found with id: " + id));

        activity.setActivityName(dto.getActivityName());
        activity.setPurpose(dto.getPurpose());
        activity.setLegalBasis(dto.getLegalBasis());
        activity.setDataCategories(dto.getDataCategories());
        activity.setDataSubjects(dto.getDataSubjects());
        activity.setRecipients(dto.getRecipients());
        activity.setTransferCountries(dto.getTransferCountries());
        activity.setRetentionPeriod(dto.getRetentionPeriod());
        activity.setSecurityMeasures(dto.getSecurityMeasures());
        activity.setDpoNotes(dto.getDpoNotes());
        activity.setIsActive(dto.getIsActive());

        DataProcessingActivity updated = dataProcessingActivityRepository.save(activity);
        log.info("Updated data processing activity: {}", id);

        return convertToDataProcessingActivityDTO(updated);
    }

    // Helper methods

    private List<DataRequestDTO> getRecentDataRequests(int limit) {
        return dataRequestRepository.findAll(
                org.springframework.data.domain.PageRequest.of(
                        0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).stream()
                .map(this::convertToDataRequestDTO)
                .collect(Collectors.toList());
    }

    private List<UserConsentDTO> getRecentConsents(int limit) {
        return userConsentRepository.findAll(
                org.springframework.data.domain.PageRequest.of(
                        0, limit, Sort.by(Sort.Direction.DESC, "createdAt"))
        ).stream()
                .map(this::convertToUserConsentDTO)
                .collect(Collectors.toList());
    }

    private DataRequestDTO convertToDataRequestDTO(DataRequest request) {
        return DataRequestDTO.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .username(request.getUser().getEmail())
                .userEmail(request.getUser().getEmail())
                .requestType(request.getRequestType())
                .status(request.getStatus())
                .requestReason(request.getRequestReason())
                .adminNotes(request.getAdminNotes())
                .processedBy(request.getProcessedBy() != null ? request.getProcessedBy().getId() : null)
                .processedByName(request.getProcessedBy() != null ? request.getProcessedBy().getFullName() : null)
                .processedAt(request.getProcessedAt())
                .dataFilePath(request.getDataFilePath())
                .ipAddress(request.getIpAddress())
                .createdAt(request.getCreatedAt())
                .updatedAt(request.getUpdatedAt())
                .build();
    }

    private UserConsentDTO convertToUserConsentDTO(UserConsent consent) {
        return UserConsentDTO.builder()
                .id(consent.getId())
                .userId(consent.getUser().getId())
                .username(consent.getUser().getEmail())
                .consentType(consent.getConsentType())
                .consentGiven(consent.getConsentGiven())
                .consentText(consent.getConsentText())
                .ipAddress(consent.getIpAddress())
                .grantedAt(consent.getGrantedAt())
                .revokedAt(consent.getRevokedAt())
                .createdAt(consent.getCreatedAt())
                .updatedAt(consent.getUpdatedAt())
                .build();
    }

    private DataProcessingActivityDTO convertToDataProcessingActivityDTO(DataProcessingActivity activity) {
        return DataProcessingActivityDTO.builder()
                .id(activity.getId())
                .activityName(activity.getActivityName())
                .purpose(activity.getPurpose())
                .legalBasis(activity.getLegalBasis())
                .dataCategories(activity.getDataCategories())
                .dataSubjects(activity.getDataSubjects())
                .recipients(activity.getRecipients())
                .transferCountries(activity.getTransferCountries())
                .retentionPeriod(activity.getRetentionPeriod())
                .securityMeasures(activity.getSecurityMeasures())
                .dpoNotes(activity.getDpoNotes())
                .isActive(activity.getIsActive())
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt())
                .build();
    }
}
