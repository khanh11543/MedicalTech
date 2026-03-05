package com.q2k.meditech.dto.mapper;

import com.q2k.meditech.dto.UserConsentDTO;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.entity.UserConsent;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserConsentMapper {

    private final UserRepository userRepository;

    public UserConsentDTO toDTO(UserConsent entity) {
        if (entity == null) return null;

        UserConsentDTO.UserConsentDTOBuilder builder = UserConsentDTO.builder()
                .id(entity.getId())
                .consentType(entity.getConsentType())
                .status(entity.getStatus())
                .consentDate(entity.getConsentDate())
                .version(entity.getVersion())
                .ipAddress(entity.getIpAddress())
                .userAgent(entity.getUserAgent())
                .revokedDate(entity.getRevokedDate())
                .revokedBy(entity.getRevokedBy())
                .revocationReason(entity.getRevocationReason())
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

        // Map revoked by name
        if (entity.getRevokedBy() != null) {
            userRepository.findById(entity.getRevokedBy()).ifPresent(admin ->
                    builder.revokedByName(admin.getFullName())
            );
        }

        return builder.build();
    }
}
