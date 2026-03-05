package com.q2k.meditech.service;

import com.q2k.meditech.dto.CreateNotificationDTO;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.NotificationCategory;
import com.q2k.meditech.entity.enums.NotificationPriority;
import com.q2k.meditech.entity.enums.NotificationType;
import com.q2k.meditech.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Central event dispatcher for notifications.
 * Other services call these methods when domain events occur.
 *
 * Security: messages NEVER contain PHI (symptoms, diagnosis, medical notes).
 * Only operational info: queue numbers, room numbers, generic names.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEventService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    // =====================================================================
    //  APPOINTMENT EVENTS
    // =====================================================================

    /**
     * New appointment booked (online or by receptionist).
     * Notifies: all RECEPTIONIST + ADMIN users.
     */
    @Async
    public void onNewBooking(Appointment appointment) {
        String patientName = appointment.getPatient().getUser().getFullName();
        String doctorName = appointment.getDoctor().getUser().getFullName();
        String date = appointment.getAppointmentDate().toString();

        String message = String.format("New booking: %s with Dr. %s on %s",
                patientName, doctorName, date);

        sendToReceptionistsAndAdmins(
                "New Appointment Booking",
                message,
                NotificationCategory.NEW_BOOKING,
                NotificationPriority.INFO,
                "APPOINTMENT",
                appointment.getId()
        );
    }

    /**
     * Appointment cancelled.
     * Notifies: all RECEPTIONIST + ADMIN users.
     */
    @Async
    public void onAppointmentCancelled(Appointment appointment) {
        String patientName = appointment.getPatient().getUser().getFullName();
        String date = appointment.getAppointmentDate().toString();

        String message = String.format("Appointment cancelled: %s on %s",
                patientName, date);

        sendToReceptionistsAndAdmins(
                "Appointment Cancelled",
                message,
                NotificationCategory.APPOINTMENT_CANCELLED,
                NotificationPriority.IMPORTANT,
                "APPOINTMENT",
                appointment.getId()
        );
    }

    /**
     * Appointment rescheduled.
     * Notifies: all RECEPTIONIST + ADMIN users.
     */
    @Async
    public void onAppointmentRescheduled(Appointment appointment) {
        String patientName = appointment.getPatient().getUser().getFullName();
        String newDate = appointment.getAppointmentDate().toString();

        String message = String.format("Appointment rescheduled: %s → %s",
                patientName, newDate);

        sendToReceptionistsAndAdmins(
                "Appointment Rescheduled",
                message,
                NotificationCategory.APPOINTMENT_RESCHEDULED,
                NotificationPriority.INFO,
                "APPOINTMENT",
                appointment.getId()
        );
    }

    /**
     * Patient checked in at reception.
     * Notifies: all RECEPTIONIST + ADMIN users.
     * Message: "Queue #5 for Room 201 checked in"
     */
    @Async
    public void onPatientCheckedIn(Appointment appointment, Integer queueNumber, String room) {
        String message = String.format("Queue #%d for Room %s checked in",
                queueNumber != null ? queueNumber : 0,
                room != null ? room : "N/A");

        sendToReceptionistsAndAdmins(
                "Patient Checked In",
                message,
                NotificationCategory.PATIENT_CHECKED_IN,
                NotificationPriority.INFO,
                "APPOINTMENT",
                appointment.getId()
        );
    }

    /**
     * No-show marked for a patient.
     * Notifies: all RECEPTIONIST + ADMIN users.
     */
    @Async
    public void onNoShowMarked(Appointment appointment) {
        String patientName = appointment.getPatient().getUser().getFullName();

        String message = String.format("No-show: %s did not attend appointment",
                patientName);

        sendToReceptionistsAndAdmins(
                "No-Show Marked",
                message,
                NotificationCategory.NO_SHOW_MARKED,
                NotificationPriority.IMPORTANT,
                "APPOINTMENT",
                appointment.getId()
        );
    }

    /**
     * Doctor notified that a patient is ready / checked-in.
     * Notifies: the specific doctor assigned to this appointment.
     * Message contains NO PHI — only queue number and appointment time.
     */
    @Async
    public void onDoctorNotified(Appointment appointment, String customMessage) {
        Long doctorUserId = appointment.getDoctor().getUser().getId();
        String time = appointment.getStartTime() != null
                ? appointment.getStartTime().toString().substring(0, 5) : "N/A";
        Integer queueNum = appointment.getQueueNumber();

        String message = (customMessage != null && !customMessage.isBlank())
                ? customMessage
                : String.format("Patient for %s has checked in. Queue #%d.",
                        time, queueNum != null ? queueNum : 0);

        try {
            notificationService.createAndSend(CreateNotificationDTO.builder()
                    .userId(doctorUserId)
                    .title("Patient Ready")
                    .message(message)
                    .type(NotificationType.APPOINTMENT)
                    .category(NotificationCategory.DOCTOR_NOTIFIED)
                    .priority(NotificationPriority.IMPORTANT)
                    .referenceType("APPOINTMENT")
                    .referenceId(appointment.getId())
                    .build());
        } catch (Exception e) {
            log.error("Failed to send doctor notification to userId {}: {}", doctorUserId, e.getMessage());
        }
    }

    // =====================================================================
    //  PAYMENT EVENTS
    // =====================================================================

    /**
     * MoMo payment successfully received.
     * Notifies: all RECEPTIONIST + ADMIN users.
     */
    @Async
    public void onMomoPaymentReceived(Payment payment) {
        String amount = formatAmount(payment.getTotalAmount());

        String message = String.format("MoMo payment received: %s (%s)",
                payment.getPaymentCode(), amount);

        sendToReceptionistsAndAdmins(
                "MoMo Payment Received",
                message,
                NotificationCategory.MOMO_PAYMENT_RECEIVED,
                NotificationPriority.INFO,
                "PAYMENT",
                payment.getId()
        );
    }

    /**
     * Payment failed.
     * Notifies: all RECEPTIONIST + ADMIN users.
     */
    @Async
    public void onPaymentFailed(Payment payment) {
        String message = String.format("Payment failed: %s", payment.getPaymentCode());

        sendToReceptionistsAndAdmins(
                "Payment Failed",
                message,
                NotificationCategory.PAYMENT_FAILED,
                NotificationPriority.IMPORTANT,
                "PAYMENT",
                payment.getId()
        );
    }

    /**
     * New pending payment created.
     * Notifies: all RECEPTIONIST + ADMIN users.
     */
    @Async
    public void onNewPendingPayment(Payment payment) {
        String amount = formatAmount(payment.getTotalAmount());

        String message = String.format("New pending payment: %s (%s)",
                payment.getPaymentCode(), amount);

        sendToReceptionistsAndAdmins(
                "New Pending Payment",
                message,
                NotificationCategory.NEW_PENDING_PAYMENT,
                NotificationPriority.INFO,
                "PAYMENT",
                payment.getId()
        );
    }

    /**
     * Overdue payment (pending > 3 days).
     * Priority: URGENT — red, sound, require acknowledge.
     * Notifies: all RECEPTIONIST + ADMIN users.
     */
    @Async
    public void onOverduePayment(Payment payment) {
        String amount = formatAmount(payment.getTotalAmount());

        String message = String.format("OVERDUE: Payment %s (%s) pending > 3 days",
                payment.getPaymentCode(), amount);

        sendToReceptionistsAndAdmins(
                "Overdue Payment",
                message,
                NotificationCategory.OVERDUE_PAYMENT,
                NotificationPriority.URGENT,
                "PAYMENT",
                payment.getId()
        );
    }

    // =====================================================================
    //  PATIENT EVENTS
    // =====================================================================

    /**
     * New patient registered in the system.
     * Notifies: all RECEPTIONIST + ADMIN users.
     */
    @Async
    public void onNewPatientRegistered(User user) {
        String message = String.format("New patient registered: %s", user.getFullName());

        sendToReceptionistsAndAdmins(
                "New Patient Registered",
                message,
                NotificationCategory.NEW_PATIENT_REGISTERED,
                NotificationPriority.INFO,
                "USER",
                user.getId()
        );
    }

    /**
     * Patient profile updated (admin fields only, not medical data).
     * Notifies: all ADMIN users.
     */
    @Async
    public void onPatientProfileUpdated(Long patientUserId, String patientName) {
        String message = String.format("Patient profile updated: %s", patientName);

        sendToAdmins(
                "Patient Profile Updated",
                message,
                NotificationCategory.PATIENT_PROFILE_UPDATED,
                NotificationPriority.INFO,
                "USER",
                patientUserId
        );
    }

    // =====================================================================
    //  SYSTEM EVENTS
    // =====================================================================

    /**
     * Maintenance window scheduled.
     * Notifies: all ADMIN users.
     */
    @Async
    public void onMaintenanceScheduled(String details) {
        String message = String.format("Maintenance scheduled: %s", details);

        sendToAdmins(
                "Maintenance Scheduled",
                message,
                NotificationCategory.MAINTENANCE_SCHEDULED,
                NotificationPriority.IMPORTANT,
                null, null
        );
    }

    /**
     * Backup completed.
     * Notifies: all ADMIN users.
     */
    @Async
    public void onBackupCompleted(String details) {
        String message = String.format("Backup completed: %s", details);

        sendToAdmins(
                "Backup Completed",
                message,
                NotificationCategory.BACKUP_COMPLETED,
                NotificationPriority.INFO,
                null, null
        );
    }

    /**
     * System setting changed.
     * Notifies: all ADMIN users.
     */
    @Async
    public void onSettingChanged(String settingName, String changedBy) {
        String message = String.format("Setting '%s' changed by %s", settingName, changedBy);

        sendToAdmins(
                "Setting Changed",
                message,
                NotificationCategory.SETTING_CHANGED,
                NotificationPriority.INFO,
                null, null
        );
    }

    // =====================================================================
    //  INTERNAL HELPERS
    // =====================================================================

    /**
     * Send notification to all users with RECEPTIONIST or ADMIN role.
     */
    private void sendToReceptionistsAndAdmins(String title, String message,
                                               NotificationCategory category,
                                               NotificationPriority priority,
                                               String referenceType, Long referenceId) {
        NotificationType type = mapCategoryToType(category);

        List<User> recipients = userRepository.findByRoles_NameIn(
                List.of("RECEPTIONIST", "ADMIN"));

        for (User user : recipients) {
            try {
                notificationService.createAndSend(CreateNotificationDTO.builder()
                        .userId(user.getId())
                        .title(title)
                        .message(message)
                        .type(type)
                        .category(category)
                        .priority(priority)
                        .referenceType(referenceType)
                        .referenceId(referenceId)
                        .build());
            } catch (Exception e) {
                log.error("Failed to send notification to user {}: {}", user.getId(), e.getMessage());
            }
        }
    }

    /**
     * Send notification to all users with ADMIN role only.
     */
    private void sendToAdmins(String title, String message,
                               NotificationCategory category,
                               NotificationPriority priority,
                               String referenceType, Long referenceId) {
        NotificationType type = mapCategoryToType(category);

        List<User> admins = userRepository.findByRoles_NameIn(List.of("ADMIN"));

        for (User admin : admins) {
            try {
                notificationService.createAndSend(CreateNotificationDTO.builder()
                        .userId(admin.getId())
                        .title(title)
                        .message(message)
                        .type(type)
                        .category(category)
                        .priority(priority)
                        .referenceType(referenceType)
                        .referenceId(referenceId)
                        .build());
            } catch (Exception e) {
                log.error("Failed to send notification to admin {}: {}", admin.getId(), e.getMessage());
            }
        }
    }

    /**
     * Map NotificationCategory → NotificationType.
     */
    private NotificationType mapCategoryToType(NotificationCategory category) {
        return switch (category) {
            case NEW_BOOKING, APPOINTMENT_CANCELLED, APPOINTMENT_RESCHEDULED,
                 PATIENT_CHECKED_IN, NO_SHOW_MARKED, DOCTOR_NOTIFIED -> NotificationType.APPOINTMENT;
            case MOMO_PAYMENT_RECEIVED, PAYMENT_FAILED,
                 NEW_PENDING_PAYMENT, OVERDUE_PAYMENT -> NotificationType.PAYMENT;
            case NEW_PATIENT_REGISTERED, PATIENT_PROFILE_UPDATED -> NotificationType.PATIENT;
            case MAINTENANCE_SCHEDULED, BACKUP_COMPLETED, SETTING_CHANGED -> NotificationType.SYSTEM;
        };
    }

    private String formatAmount(BigDecimal amount) {
        if (amount == null) return "N/A";
        return String.format("%,.0f VND", amount);
    }
}
