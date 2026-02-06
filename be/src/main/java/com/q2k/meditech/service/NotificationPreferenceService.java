package com.q2k.meditech.service;

import com.q2k.meditech.dto.NotificationPreferenceDTO;
import com.q2k.meditech.entity.NotificationPreference;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.NotificationPreferenceRepository;
import com.q2k.meditech.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationPreferenceService {

    @Autowired
    private NotificationPreferenceRepository preferenceRepository;

    @Autowired
    private UserRepository userRepository;

    public NotificationPreferenceDTO getPreferences(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }

        NotificationPreference preference = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultPreferences(userId));

        return convertToDTO(preference);
    }

    @Transactional
    public NotificationPreferenceDTO updatePreferences(Long userId, NotificationPreferenceDTO dto) {
        if (userId == null) {
            throw new IllegalArgumentException("userId is required");
        }

        NotificationPreference preference = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
                    NotificationPreference newPref = new NotificationPreference();
                    newPref.setUser(user);
                    return newPref;
                });

        // Update fields
        if (dto.getEmailEnabled() != null) {
            preference.setEmailEnabled(dto.getEmailEnabled());
        }
        if (dto.getSmsEnabled() != null) {
            preference.setSmsEnabled(dto.getSmsEnabled());
        }
        if (dto.getPushEnabled() != null) {
            preference.setPushEnabled(dto.getPushEnabled());
        }
        if (dto.getAppointmentReminders() != null) {
            preference.setAppointmentReminders(dto.getAppointmentReminders());
        }
        if (dto.getPromotionalEmails() != null) {
            preference.setPromotionalEmails(dto.getPromotionalEmails());
        }
        if (dto.getReminderHoursBefore() != null) {
            preference.setReminderHoursBefore(dto.getReminderHoursBefore());
        }

        NotificationPreference saved = preferenceRepository.save(preference);
        return convertToDTO(saved);
    }

    private NotificationPreference createDefaultPreferences(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        NotificationPreference preference = new NotificationPreference();
        preference.setUser(user);
        preference.setEmailEnabled(true);
        preference.setSmsEnabled(true);
        preference.setPushEnabled(true);
        preference.setAppointmentReminders(true);
        preference.setPromotionalEmails(false);
        preference.setReminderHoursBefore(24);

        return preferenceRepository.save(preference);
    }

    private NotificationPreferenceDTO convertToDTO(NotificationPreference preference) {
        NotificationPreferenceDTO dto = new NotificationPreferenceDTO();
        dto.setId(preference.getId());
        dto.setUserId(preference.getUser() != null ? preference.getUser().getId() : null);
        dto.setEmailEnabled(preference.getEmailEnabled());
        dto.setSmsEnabled(preference.getSmsEnabled());
        dto.setPushEnabled(preference.getPushEnabled());
        dto.setAppointmentReminders(preference.getAppointmentReminders());
        dto.setPromotionalEmails(preference.getPromotionalEmails());
        dto.setReminderHoursBefore(preference.getReminderHoursBefore());
        dto.setCreatedAt(preference.getCreatedAt());
        dto.setUpdatedAt(preference.getUpdatedAt());
        return dto;
    }
}
