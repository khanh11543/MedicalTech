package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.DataExportRequestDTO;
import com.q2k.meditech.entity.DataExportRequest;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataExportRequestMapper {

    private final UserRepository userRepository;

    public DataExportRequestDTO toDTO(DataExportRequest entity) {
        if (entity == null) return null;

        DataExportRequestDTO.DataExportRequestDTOBuilder builder = DataExportRequestDTO.builder()
                .id(entity.getId())
                .status(entity.getStatus().name())
                .requestedDate(entity.getRequestedDate())
                .processedDate(entity.getProcessedDate())
                .processedBy(entity.getProcessedBy())
                .includeProfile(entity.getIncludeProfile())
                .includeAppointments(entity.getIncludeAppointments())
                .includePrescriptions(entity.getIncludePrescriptions())
                .includePayments(entity.getIncludePayments())
                .includeReviews(entity.getIncludeReviews())
                .includeActivityLogs(entity.getIncludeActivityLogs())
                .exportFormat(entity.getExportFormat())
                .filePath(entity.getFilePath())
                .fileSize(entity.getFileSize())
                .errorMessage(entity.getErrorMessage())
                .emailSent(entity.getEmailSent())
                .emailSentDate(entity.getEmailSentDate())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt());

        // Map user info
        User user = entity.getUser();
        if (user != null) {
            builder.userId(user.getId())
                    .userName(user.getFullName())
                    .userEmail(user.getEmail());
        }

        // Map processed by name
        if (entity.getProcessedBy() != null) {
            userRepository.findById(entity.getProcessedBy()).ifPresent(admin ->
                    builder.processedByName(admin.getFullName())
            );
        }

        return builder.build();
    }
}
