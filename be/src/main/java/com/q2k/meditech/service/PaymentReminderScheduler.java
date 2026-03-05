package com.q2k.meditech.service;

import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Scheduled service to automatically send reminders for pending payments.
 * 
 * Reminder schedule:
 * - After 24h:  First reminder (REMINDER_1)
 * - After 48h:  Second reminder (REMINDER_2)
 * - After 72h:  Urgent reminder (URGENT)
 * - After 7d:   Escalation notice (ESCALATED) — notify admin
 * 
 * Runs every hour to check for pending payments that need reminders.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentReminderScheduler {

    private final PaymentRepository paymentRepository;
    private final PaymentStatusWebSocketService webSocketService;

    // Reminder thresholds in hours
    private static final long REMINDER_1_HOURS = 24;
    private static final long REMINDER_2_HOURS = 48;
    private static final long URGENT_HOURS = 72;
    private static final long ESCALATION_HOURS = 168; // 7 days

    /**
     * Check for pending payments every hour and send appropriate reminders
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour at minute 0
    public void checkPendingPaymentsAndRemind() {
        log.info("Running pending payment reminder check...");

        try {
            // Find all PENDING payments with completed appointments
            List<Payment> pendingPayments = paymentRepository.findAllPendingWithCompletedAppointments();

            int remindersSent = 0;
            int escalated = 0;

            for (Payment payment : pendingPayments) {
                LocalDateTime referenceTime = payment.getCreatedAt();
                if (payment.getAppointment() != null && payment.getAppointment().getConsultationEndedAt() != null) {
                    referenceTime = payment.getAppointment().getConsultationEndedAt();
                }

                long hoursPending = Duration.between(referenceTime, LocalDateTime.now()).toHours();

                if (hoursPending >= ESCALATION_HOURS) {
                    // Escalation: notify admin via WebSocket
                    webSocketService.broadcastReceptionistUpdate("PAYMENT_ESCALATED", Map.of(
                            "paymentId", payment.getId(),
                            "paymentCode", payment.getPaymentCode(),
                            "patientName", payment.getPatient() != null && payment.getPatient().getUser() != null
                                    ? payment.getPatient().getUser().getFullName() : "Unknown",
                            "amount", payment.getTotalAmount().toString(),
                            "hoursPending", hoursPending,
                            "level", "ESCALATED"
                    ));
                    escalated++;
                } else if (hoursPending >= URGENT_HOURS) {
                    webSocketService.broadcastReceptionistUpdate("PAYMENT_REMINDER", Map.of(
                            "paymentId", payment.getId(),
                            "paymentCode", payment.getPaymentCode(),
                            "amount", payment.getTotalAmount().toString(),
                            "hoursPending", hoursPending,
                            "level", "URGENT"
                    ));
                    remindersSent++;
                } else if (hoursPending >= REMINDER_2_HOURS) {
                    webSocketService.broadcastReceptionistUpdate("PAYMENT_REMINDER", Map.of(
                            "paymentId", payment.getId(),
                            "paymentCode", payment.getPaymentCode(),
                            "amount", payment.getTotalAmount().toString(),
                            "hoursPending", hoursPending,
                            "level", "REMINDER_2"
                    ));
                    remindersSent++;
                } else if (hoursPending >= REMINDER_1_HOURS) {
                    webSocketService.broadcastReceptionistUpdate("PAYMENT_REMINDER", Map.of(
                            "paymentId", payment.getId(),
                            "paymentCode", payment.getPaymentCode(),
                            "amount", payment.getTotalAmount().toString(),
                            "hoursPending", hoursPending,
                            "level", "REMINDER_1"
                    ));
                    remindersSent++;
                }
            }

            log.info("Pending payment check complete. Total pending: {}, reminders sent: {}, escalated: {}",
                    pendingPayments.size(), remindersSent, escalated);

        } catch (Exception e) {
            log.error("Error during pending payment reminder check: {}", e.getMessage(), e);
        }
    }
}
