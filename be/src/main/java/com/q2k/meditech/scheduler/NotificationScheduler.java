package com.q2k.meditech.scheduler;

import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.repository.NotificationRepository;
import com.q2k.meditech.repository.PaymentRepository;
import com.q2k.meditech.service.NotificationEventService;
import com.q2k.meditech.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled tasks for the notification system:
 * 1. Auto-archive notifications older than 30 days
 * 2. Detect overdue payments (PENDING > 3 days) → generate URGENT notification
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationScheduler {

    private final NotificationService notificationService;
    private final NotificationEventService notificationEventService;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;

    /**
     * Auto-archive notifications older than 30 days.
     * Runs daily at 2:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void archiveOldNotifications() {
        log.info("[Scheduler] Running: archive old notifications (> 30 days)");
        try {
            int count = notificationService.archiveOldNotifications();
            log.info("[Scheduler] Archived {} notifications", count);
        } catch (Exception e) {
            log.error("[Scheduler] Failed to archive notifications: {}", e.getMessage(), e);
        }
    }

    /**
     * Check for overdue payments: PENDING status > 3 days.
     * Generates URGENT notifications for RECEPTIONIST + ADMIN.
     * Runs every hour at minute 0.
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void checkOverduePayments() {
        log.info("[Scheduler] Running: check overdue payments (PENDING > 3 days)");
        try {
            LocalDateTime threeDaysAgo = LocalDateTime.now().minusDays(3);

            List<Payment> overduePayments = paymentRepository.findByPaymentStatusOrderByCreatedAtDesc("PENDING");

            int count = 0;
            for (Payment payment : overduePayments) {
                // Only flag if created more than 3 days ago
                if (payment.getCreatedAt() != null && payment.getCreatedAt().isBefore(threeDaysAgo)) {
                    // Check if we already sent an overdue notification for this payment
                    boolean hasOverdueNotif = notificationRepository
                            .findByReferenceTypeAndReferenceId("PAYMENT", payment.getId())
                            .stream()
                            .anyMatch(n -> n.getCategory() != null &&
                                    n.getCategory().name().equals("OVERDUE_PAYMENT"));

                    if (!hasOverdueNotif) {
                        notificationEventService.onOverduePayment(payment);
                        count++;
                    }
                }
            }

            if (count > 0) {
                log.info("[Scheduler] Generated {} overdue payment URGENT notifications", count);
            }
        } catch (Exception e) {
            log.error("[Scheduler] Failed to check overdue payments: {}", e.getMessage(), e);
        }
    }
}
