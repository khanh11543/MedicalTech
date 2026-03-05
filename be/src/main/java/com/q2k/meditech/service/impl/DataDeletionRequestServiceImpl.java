package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.DataDeletionRequestMapper;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.DeletionRequestStatus;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.service.DataDeletionRequestService;
import com.q2k.meditech.service.EmailService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DataDeletionRequestServiceImpl implements DataDeletionRequestService {

    private final DataDeletionRequestRepository deletionRequestRepository;
    private final DeletionLogRepository deletionLogRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final DataDeletionRequestMapper mapper;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public Page<DataDeletionRequestDTO> getDeletionRequests(DeletionRequestFilterDTO filter) {
        log.info("Fetching deletion requests with filter: {}", filter);

        Sort sort = Sort.by(
                "asc".equalsIgnoreCase(filter.getSortDirection()) ? Sort.Direction.ASC : Sort.Direction.DESC,
                filter.getSortBy() != null ? filter.getSortBy() : "createdAt"
        );
        Pageable pageable = PageRequest.of(
                filter.getPage() != null ? filter.getPage() : 0,
                filter.getSize() != null ? filter.getSize() : 10,
                sort
        );

        Specification<DataDeletionRequest> spec = buildSpecification(filter);
        Page<DataDeletionRequest> page = deletionRequestRepository.findAll(spec, pageable);

        return page.map(mapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public DeletionReviewDetailDTO getReviewDetail(Long id) {
        log.info("Fetching review detail for deletion request: {}", id);

        DataDeletionRequest request = deletionRequestRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deletion request not found with id: " + id));

        DeletionReviewDetailDTO dto = mapper.toReviewDetailDTO(request);

        // Populate data counts
        User user = request.getUser();
        Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());

        if (patientOpt.isPresent()) {
            Patient patient = patientOpt.get();
            Long patientId = patient.getId();

            List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
            List<Prescription> prescriptions = prescriptionRepository.findByPatientId(patientId);
            List<Payment> payments = paymentRepository.findByPatientIdOrderByCreatedAtDesc(patientId);

            int reviewCount = 0;
            for (Appointment appointment : appointments) {
                if (reviewRepository.existsByAppointmentId(appointment.getId())) {
                    reviewCount++;
                }
            }

            dto.setAppointmentCount(appointments.size());
            dto.setPrescriptionCount(prescriptions.size());
            dto.setPaymentCount(payments.size());
            dto.setReviewCount(reviewCount);
            dto.setTotalRecords(appointments.size() + prescriptions.size() + payments.size() + reviewCount);
        } else {
            dto.setAppointmentCount(0);
            dto.setPrescriptionCount(0);
            dto.setPaymentCount(0);
            dto.setReviewCount(0);
            dto.setTotalRecords(0);
        }

        return dto;
    }

    @Override
    public DataDeletionRequestDTO approveDeletionRequest(Long id, ApproveDeletionDTO dto) {
        log.info("Approving deletion request: {}", id);

        DataDeletionRequest request = deletionRequestRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deletion request not found with id: " + id));

        if (request.getStatus() != DeletionRequestStatus.PENDING
                && request.getStatus() != DeletionRequestStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Deletion request can only be approved when status is PENDING or UNDER_REVIEW. Current status: " + request.getStatus());
        }

        Long adminId = SecurityUtil.getCurrentUserId();

        request.setStatus(DeletionRequestStatus.APPROVED);
        request.setReviewedBy(adminId);
        request.setReviewedDate(LocalDateTime.now());
        request.setAdminNotes(dto.getAdminNotes());
        request.setExecuteImmediately(dto.getExecuteImmediately() != null ? dto.getExecuteImmediately() : false);

        if (Boolean.TRUE.equals(dto.getExecuteImmediately())) {
            request.setScheduleDate(LocalDateTime.now());
        } else if (dto.getScheduleDate() != null) {
            request.setScheduleDate(dto.getScheduleDate());
        } else {
            // Default: 30 days from now
            request.setScheduleDate(LocalDateTime.now().plusDays(30));
        }

        DataDeletionRequest saved = deletionRequestRepository.save(request);

        // Send notification
        if (Boolean.TRUE.equals(dto.getSendNotification())) {
            sendNotification(saved, "approved");
        }

        log.info("Deletion request {} approved by admin {}", id, adminId);
        return mapper.toDTO(saved);
    }

    @Override
    public DataDeletionRequestDTO rejectDeletionRequest(Long id, RejectDeletionDTO dto) {
        log.info("Rejecting deletion request: {}", id);

        DataDeletionRequest request = deletionRequestRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deletion request not found with id: " + id));

        if (request.getStatus() != DeletionRequestStatus.PENDING
                && request.getStatus() != DeletionRequestStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Deletion request can only be rejected when status is PENDING or UNDER_REVIEW. Current status: " + request.getStatus());
        }

        Long adminId = SecurityUtil.getCurrentUserId();

        request.setStatus(DeletionRequestStatus.REJECTED);
        request.setReviewedBy(adminId);
        request.setReviewedDate(LocalDateTime.now());
        request.setRejectionReason(dto.getRejectionReason());
        request.setAdditionalComments(dto.getAdditionalComments());

        DataDeletionRequest saved = deletionRequestRepository.save(request);

        if (Boolean.TRUE.equals(dto.getSendNotification())) {
            sendNotification(saved, "rejected");
        }

        log.info("Deletion request {} rejected by admin {}", id, adminId);
        return mapper.toDTO(saved);
    }

    @Override
    public DataDeletionRequestDTO requestMoreInfo(Long id, RequestInfoDTO dto) {
        log.info("Requesting more info for deletion request: {}", id);

        DataDeletionRequest request = deletionRequestRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deletion request not found with id: " + id));

        if (request.getStatus() != DeletionRequestStatus.PENDING
                && request.getStatus() != DeletionRequestStatus.UNDER_REVIEW) {
            throw new IllegalStateException("Can only request info when status is PENDING or UNDER_REVIEW. Current status: " + request.getStatus());
        }

        Long adminId = SecurityUtil.getCurrentUserId();

        request.setStatus(DeletionRequestStatus.UNDER_REVIEW);
        request.setReviewedBy(adminId);
        request.setReviewedDate(LocalDateTime.now());
        request.setRequiredInfo(dto.getRequiredInfo());
        request.setInfoDeadline(dto.getDeadline());

        DataDeletionRequest saved = deletionRequestRepository.save(request);

        if (Boolean.TRUE.equals(dto.getSendNotification())) {
            sendNotification(saved, "info_requested");
        }

        log.info("More info requested for deletion request {} by admin {}", id, adminId);
        return mapper.toDTO(saved);
    }

    @Override
    public DataDeletionRequestDTO cancelDeletionRequest(Long id, CancelDeletionDTO dto) {
        log.info("Cancelling deletion request: {}", id);

        DataDeletionRequest request = deletionRequestRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deletion request not found with id: " + id));

        if (request.getStatus() == DeletionRequestStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel a completed deletion request");
        }

        Long adminId = SecurityUtil.getCurrentUserId();

        request.setStatus(DeletionRequestStatus.REJECTED);
        request.setCancelReason(dto.getCancelReason());
        request.setCancelledDate(LocalDateTime.now());
        request.setReviewedBy(adminId);
        request.setReviewedDate(LocalDateTime.now());

        DataDeletionRequest saved = deletionRequestRepository.save(request);

        if (Boolean.TRUE.equals(dto.getSendNotification())) {
            sendNotification(saved, "cancelled");
        }

        log.info("Deletion request {} cancelled by admin {}", id, adminId);
        return mapper.toDTO(saved);
    }

    @Override
    public DeletionExecutionResultDTO executeDeletion(Long id, ExecuteDeletionDTO dto) {
        log.info("Executing deletion for request: {}", id);

        DataDeletionRequest request = deletionRequestRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deletion request not found with id: " + id));

        if (request.getStatus() != DeletionRequestStatus.APPROVED) {
            throw new IllegalStateException("Deletion can only be executed when status is APPROVED. Current status: " + request.getStatus());
        }

        Long adminId = SecurityUtil.getCurrentUserId();
        User adminUser = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));

        // Verify admin password
        if (!passwordEncoder.matches(dto.getAdminPassword(), adminUser.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid admin password");
        }

        // Verify confirmation phrase
        String expectedPhrase = "DELETE USER " + request.getUser().getId();
        if (!expectedPhrase.equals(dto.getConfirmationPhrase())) {
            throw new IllegalArgumentException("Invalid confirmation phrase. Expected: " + expectedPhrase);
        }

        User targetUser = request.getUser();
        Map<String, Integer> deletedRecordsByType = new LinkedHashMap<>();
        int totalDeleted = 0;
        boolean success = true;
        String errorMessage = null;

        try {
            Optional<Patient> patientOpt = patientRepository.findByUserId(targetUser.getId());

            if (patientOpt.isPresent()) {
                Patient patient = patientOpt.get();
                Long patientId = patient.getId();

                // Delete reviews
                List<Appointment> appointments = appointmentRepository.findByPatientId(patientId);
                int reviewsDeleted = 0;
                for (Appointment appointment : appointments) {
                    Optional<Review> review = reviewRepository.findByAppointmentId(appointment.getId());
                    if (review.isPresent()) {
                        reviewRepository.delete(review.get());
                        reviewsDeleted++;
                    }
                }
                deletedRecordsByType.put("reviews", reviewsDeleted);
                totalDeleted += reviewsDeleted;

                // Delete payments
                List<Payment> payments = paymentRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
                paymentRepository.deleteAll(payments);
                deletedRecordsByType.put("payments", payments.size());
                totalDeleted += payments.size();

                // Delete prescriptions
                List<Prescription> prescriptions = prescriptionRepository.findByPatientId(patientId);
                prescriptionRepository.deleteAll(prescriptions);
                deletedRecordsByType.put("prescriptions", prescriptions.size());
                totalDeleted += prescriptions.size();

                // Delete appointments
                appointmentRepository.deleteAll(appointments);
                deletedRecordsByType.put("appointments", appointments.size());
                totalDeleted += appointments.size();

                // Delete patient
                patientRepository.delete(patient);
                deletedRecordsByType.put("patient", 1);
                totalDeleted++;
            }

            // Deactivate user account (soft delete)
            targetUser.setIsActive(false);
            userRepository.save(targetUser);
            deletedRecordsByType.put("userDeactivated", 1);

            // Update deletion request
            request.setStatus(DeletionRequestStatus.COMPLETED);
            request.setExecutedDate(LocalDateTime.now());
            request.setExecutedBy(adminId);
            deletionRequestRepository.save(request);

        } catch (Exception e) {
            success = false;
            errorMessage = e.getMessage();
            log.error("Error executing deletion for request {}: {}", id, e.getMessage(), e);
        }

        // Create deletion log
        DeletionLog deletionLog = DeletionLog.builder()
                .userId(targetUser.getId())
                .userEmail(targetUser.getEmail())
                .userFullName(targetUser.getFullName())
                .deletionRequestId(request.getId())
                .deletedDataSummary(buildDeletedDataSummary(deletedRecordsByType))
                .deletedRecordsCount(totalDeleted)
                .executedBy(adminId)
                .executedByName(adminUser.getFullName())
                .executedDate(LocalDateTime.now())
                .executionNotes(dto.getAdminNotes())
                .success(success)
                .errorMessage(errorMessage)
                .build();
        deletionLogRepository.save(deletionLog);

        // Send notification to user
        if (success) {
            try {
                emailService.sendHtmlEmail(
                        targetUser.getEmail(),
                        "Your Data Deletion Request Has Been Completed",
                        buildDeletionCompletedEmail(targetUser.getFullName(), totalDeleted)
                );
            } catch (Exception e) {
                log.warn("Failed to send deletion completion email: {}", e.getMessage());
            }
        }

        log.info("Deletion execution {} for request {}. Total records deleted: {}",
                success ? "succeeded" : "failed", id, totalDeleted);

        return DeletionExecutionResultDTO.builder()
                .deletionRequestId(id)
                .userId(targetUser.getId())
                .userEmail(targetUser.getEmail())
                .success(success)
                .totalDeletedRecords(totalDeleted)
                .deletedRecordsByType(deletedRecordsByType)
                .executionNotes(dto.getAdminNotes())
                .errorMessage(errorMessage)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DeletionLogDTO> getDeletionLog(Integer page, Integer size, String sortBy, String sortDirection) {
        log.info("Fetching deletion log, page: {}, size: {}", page, size);

        Sort sort = Sort.by(
                "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC,
                sortBy != null ? sortBy : "executedDate"
        );
        Pageable pageable = PageRequest.of(
                page != null ? page : 0,
                size != null ? size : 10,
                sort
        );

        Page<DeletionLog> logs = deletionLogRepository.findAll(pageable);
        return logs.map(mapper::toLogDTO);
    }

    // ==================== Private Helpers ====================

    private Specification<DataDeletionRequest> buildSpecification(DeletionRequestFilterDTO filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            if (filter.getUserId() != null) {
                predicates.add(cb.equal(root.get("user").get("id"), filter.getUserId()));
            }

            if (filter.getFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("requestedDate"), filter.getFrom()));
            }

            if (filter.getTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("requestedDate"), filter.getTo()));
            }

            // Fetch user eagerly
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("user", jakarta.persistence.criteria.JoinType.LEFT);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String buildDeletedDataSummary(Map<String, Integer> deletedRecordsByType) {
        StringBuilder sb = new StringBuilder();
        deletedRecordsByType.forEach((type, count) ->
                sb.append(type).append(": ").append(count).append(", ")
        );
        if (sb.length() > 2) {
            sb.setLength(sb.length() - 2);
        }
        return sb.toString();
    }

    private void sendNotification(DataDeletionRequest request, String action) {
        try {
            User user = request.getUser();
            String subject;
            String content;

            switch (action) {
                case "approved":
                    subject = "Your Data Deletion Request Has Been Approved";
                    content = buildApprovedEmail(user.getFullName(), request.getScheduleDate());
                    break;
                case "rejected":
                    subject = "Your Data Deletion Request Has Been Rejected";
                    content = buildRejectedEmail(user.getFullName(), request.getRejectionReason());
                    break;
                case "info_requested":
                    subject = "Additional Information Required for Your Data Deletion Request";
                    content = buildInfoRequestedEmail(user.getFullName(), request.getRequiredInfo(), request.getInfoDeadline());
                    break;
                case "cancelled":
                    subject = "Your Data Deletion Request Has Been Cancelled";
                    content = buildCancelledEmail(user.getFullName(), request.getCancelReason());
                    break;
                default:
                    return;
            }

            emailService.sendHtmlEmail(user.getEmail(), subject, content);
            request.setNotificationSent(true);
            request.setNotificationSentDate(LocalDateTime.now());
            deletionRequestRepository.save(request);

        } catch (Exception e) {
            log.warn("Failed to send notification for deletion request {}: {}", request.getId(), e.getMessage());
        }
    }

    private String buildApprovedEmail(String fullName, LocalDateTime scheduleDate) {
        return "<html><body>"
                + "<h2>Data Deletion Request Approved</h2>"
                + "<p>Dear " + fullName + ",</p>"
                + "<p>Your data deletion request has been approved.</p>"
                + (scheduleDate != null
                ? "<p>Your data is scheduled to be deleted on: <strong>" + scheduleDate.toLocalDate() + "</strong></p>"
                : "<p>Your data will be deleted shortly.</p>")
                + "<p>If you wish to cancel, please contact us before the scheduled date.</p>"
                + "<p>Best regards,<br>MediTech Team</p>"
                + "</body></html>";
    }

    private String buildRejectedEmail(String fullName, String reason) {
        return "<html><body>"
                + "<h2>Data Deletion Request Rejected</h2>"
                + "<p>Dear " + fullName + ",</p>"
                + "<p>Your data deletion request has been rejected.</p>"
                + "<p><strong>Reason:</strong> " + (reason != null ? reason : "N/A") + "</p>"
                + "<p>If you have any questions, please contact our support team.</p>"
                + "<p>Best regards,<br>MediTech Team</p>"
                + "</body></html>";
    }

    private String buildInfoRequestedEmail(String fullName, String requiredInfo, LocalDate deadline) {
        return "<html><body>"
                + "<h2>Additional Information Required</h2>"
                + "<p>Dear " + fullName + ",</p>"
                + "<p>We need additional information to process your data deletion request:</p>"
                + "<p><strong>" + (requiredInfo != null ? requiredInfo : "") + "</strong></p>"
                + (deadline != null
                ? "<p>Please respond by: <strong>" + deadline + "</strong></p>"
                : "")
                + "<p>Best regards,<br>MediTech Team</p>"
                + "</body></html>";
    }

    private String buildCancelledEmail(String fullName, String reason) {
        return "<html><body>"
                + "<h2>Data Deletion Request Cancelled</h2>"
                + "<p>Dear " + fullName + ",</p>"
                + "<p>Your data deletion request has been cancelled.</p>"
                + (reason != null ? "<p><strong>Reason:</strong> " + reason + "</p>" : "")
                + "<p>If you have any questions, please contact our support team.</p>"
                + "<p>Best regards,<br>MediTech Team</p>"
                + "</body></html>";
    }

    private String buildDeletionCompletedEmail(String fullName, int totalDeleted) {
        return "<html><body>"
                + "<h2>Data Deletion Completed</h2>"
                + "<p>Dear " + fullName + ",</p>"
                + "<p>Your data deletion request has been completed. A total of <strong>" + totalDeleted + "</strong> records have been removed from our system.</p>"
                + "<p>Your account has been deactivated.</p>"
                + "<p>Best regards,<br>MediTech Team</p>"
                + "</body></html>";
    }
}
