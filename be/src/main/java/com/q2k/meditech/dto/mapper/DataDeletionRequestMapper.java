package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.DataDeletionRequestDTO;
import com.q2k.meditech.dto.DeletionLogDTO;
import com.q2k.meditech.dto.DeletionReviewDetailDTO;
import com.q2k.meditech.entity.DataDeletionRequest;
import com.q2k.meditech.entity.DeletionLog;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataDeletionRequestMapper {

    private final UserRepository userRepository;

    public DataDeletionRequestDTO toDTO(DataDeletionRequest entity) {
        if (entity == null) return null;

        DataDeletionRequestDTO.DataDeletionRequestDTOBuilder builder = DataDeletionRequestDTO.builder()
                .id(entity.getId())
                .status(entity.getStatus())
                .requestedDate(entity.getRequestedDate())
                .reason(entity.getReason())
                .reviewedBy(entity.getReviewedBy())
                .reviewedDate(entity.getReviewedDate())
                .adminNotes(entity.getAdminNotes())
                .scheduleDate(entity.getScheduleDate())
                .executeImmediately(entity.getExecuteImmediately())
                .rejectionReason(entity.getRejectionReason())
                .additionalComments(entity.getAdditionalComments())
                .requiredInfo(entity.getRequiredInfo())
                .infoDeadline(entity.getInfoDeadline())
                .cancelReason(entity.getCancelReason())
                .cancelledDate(entity.getCancelledDate())
                .executedDate(entity.getExecutedDate())
                .executedBy(entity.getExecutedBy())
                .notificationSent(entity.getNotificationSent())
                .notificationSentDate(entity.getNotificationSentDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt());

        // Map user info
        User user = entity.getUser();
        if (user != null) {
            builder.userId(user.getId())
                    .userName(user.getFullName())
                    .userEmail(user.getEmail());
        }

        // Map reviewed by name
        if (entity.getReviewedBy() != null) {
            userRepository.findById(entity.getReviewedBy()).ifPresent(admin ->
                    builder.reviewedByName(admin.getFullName())
            );
        }

        // Map executed by name
        if (entity.getExecutedBy() != null) {
            userRepository.findById(entity.getExecutedBy()).ifPresent(admin ->
                    builder.executedByName(admin.getFullName())
            );
        }

        return builder.build();
    }

    public DeletionReviewDetailDTO toReviewDetailDTO(DataDeletionRequest entity) {
        if (entity == null) return null;

        DeletionReviewDetailDTO.DeletionReviewDetailDTOBuilder builder = DeletionReviewDetailDTO.builder()
                .id(entity.getId())
                .status(entity.getStatus())
                .requestedDate(entity.getRequestedDate())
                .reason(entity.getReason())
                .reviewedBy(entity.getReviewedBy())
                .reviewedDate(entity.getReviewedDate())
                .adminNotes(entity.getAdminNotes())
                .scheduleDate(entity.getScheduleDate())
                .executeImmediately(entity.getExecuteImmediately())
                .rejectionReason(entity.getRejectionReason())
                .additionalComments(entity.getAdditionalComments())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt());

        // Map user info
        User user = entity.getUser();
        if (user != null) {
            builder.userId(user.getId())
                    .userName(user.getFullName())
                    .userEmail(user.getEmail())
                    .accountCreatedDate(user.getCreatedAt())
                    .userRole(user.getUserRoles() != null && !user.getUserRoles().isEmpty()
                            ? user.getUserRoles().stream().findFirst().map(ur -> ur.getRole().getName()).orElse(null)
                            : null);
        }

        // Map reviewed by name
        if (entity.getReviewedBy() != null) {
            userRepository.findById(entity.getReviewedBy()).ifPresent(admin ->
                    builder.reviewedByName(admin.getFullName())
            );
        }

        return builder.build();
    }

    public DeletionLogDTO toLogDTO(DeletionLog entity) {
        if (entity == null) return null;

        return DeletionLogDTO.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .userEmail(entity.getUserEmail())
                .userFullName(entity.getUserFullName())
                .deletionRequestId(entity.getDeletionRequestId())
                .deletedDataSummary(entity.getDeletedDataSummary())
                .deletedRecordsCount(entity.getDeletedRecordsCount())
                .executedBy(entity.getExecutedBy())
                .executedByName(entity.getExecutedByName())
                .executedDate(entity.getExecutedDate())
                .executionNotes(entity.getExecutionNotes())
                .success(entity.getSuccess())
                .errorMessage(entity.getErrorMessage())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
