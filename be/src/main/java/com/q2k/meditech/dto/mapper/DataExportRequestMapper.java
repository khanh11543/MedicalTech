package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.DataExportRequestDTO;
import com.q2k.meditech.entity.DataExportRequest;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class DataExportRequestMapper {

    private final UserRepository userRepository;

    public DataExportRequestDTO toDTO(DataExportRequest entity) {
        return toDTO(entity, null);
    }

    public Page<DataExportRequestDTO> toDTOPage(Page<DataExportRequest> page) {
        // Batch load all processedBy users in one query
        List<Long> processedByIds = page.getContent().stream()
                .map(DataExportRequest::getProcessedBy)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, String> processedByNames = processedByIds.isEmpty() ? Map.of() :
                userRepository.findAllById(processedByIds).stream()
                        .collect(Collectors.toMap(User::getId, User::getFullName));

        return page.map(entity -> toDTO(entity, processedByNames));
    }

    private DataExportRequestDTO toDTO(DataExportRequest entity, Map<Long, String> processedByNames) {
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
            if (processedByNames != null) {
                builder.processedByName(processedByNames.get(entity.getProcessedBy()));
            } else {
                userRepository.findById(entity.getProcessedBy()).ifPresent(admin ->
                        builder.processedByName(admin.getFullName())
                );
            }
        }

        return builder.build();
    }
}
