package com.q2k.meditech.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * SMS Service - Send SMS using Twilio
 */
@Service
@Slf4j
public class SmsService {

    @Value("${sms.provider:mock}")
    private String smsProvider;

    @Value("${twilio.account.sid:}")
    private String twilioAccountSid;

    @Value("${twilio.auth.token:}")
    private String twilioAuthToken;

    @Value("${twilio.phone.number:}")
    private String twilioPhoneNumber;

    private boolean twilioInitialized = false;

    @PostConstruct
    public void init() {
        if ("twilio".equalsIgnoreCase(smsProvider) 
                && twilioAccountSid != null && !twilioAccountSid.isEmpty()
                && twilioAuthToken != null && !twilioAuthToken.isEmpty()) {
            try {
                Twilio.init(twilioAccountSid, twilioAuthToken);
                twilioInitialized = true;
                log.info("Twilio SMS service initialized successfully");
            } catch (Exception e) {
                log.error("Failed to initialize Twilio: {}", e.getMessage());
                twilioInitialized = false;
            }
        } else {
            log.info("SMS provider: {} (Twilio not configured)", smsProvider);
        }
    }

    /**
     * Send SMS (async)
     */
    @Async
    public void sendSms(String phoneNumber, String message) {
        try {
            // Normalize phone number for Vietnam
            String normalizedPhone = normalizePhoneNumber(phoneNumber);
            
            if ("twilio".equalsIgnoreCase(smsProvider) && twilioInitialized) {
                sendTwilioSms(normalizedPhone, message);
            } else {
                sendMockSms(normalizedPhone, message);
            }
        } catch (Exception e) {
            log.error("Failed to send SMS to: {}", phoneNumber, e);
        }
    }

    /**
     * Send invoice SMS
     */
    @Async
    public void sendInvoiceSms(String phoneNumber, String invoiceNumber, String amount) {
        String message = String.format(
                "MediTech: Hoa don #%s, so tien %s VND da duoc xu ly. Cam on ban!",
                invoiceNumber, amount);
        sendSms(phoneNumber, message);
    }

    /**
     * Send payment confirmation SMS
     */
    @Async
    public void sendPaymentConfirmationSms(String phoneNumber, String paymentCode, String amount) {
        String message = String.format(
                "MediTech: Thanh toan thanh cong. Ma: %s, So tien: %s VND. Cam on ban!",
                paymentCode, amount);
        sendSms(phoneNumber, message);
    }

    /**
     * Send refund notification SMS
     */
    @Async
    public void sendRefundSms(String phoneNumber, String paymentCode, String refundAmount) {
        String message = String.format(
                "MediTech: Hoan tien thanh cong. Ma: %s, So tien: %s VND. Tien se ve trong 3-5 ngay.",
                paymentCode, refundAmount);
        sendSms(phoneNumber, message);
    }

    /**
     * Normalize Vietnamese phone number to international format
     * 0326166145 -> +84326166145
     */
    private String normalizePhoneNumber(String phone) {
        if (phone == null || phone.isEmpty()) {
            return phone;
        }
        
        // Remove spaces and dashes
        phone = phone.replaceAll("[\\s-]", "");
        
        // If starts with 0, convert to +84
        if (phone.startsWith("0")) {
            phone = "+84" + phone.substring(1);
        }
        
        // If doesn't start with +, add +84
        if (!phone.startsWith("+")) {
            phone = "+84" + phone;
        }
        
        return phone;
    }

    /**
     * Mock SMS implementation (for testing/demo)
     */
    private void sendMockSms(String phoneNumber, String message) {
        log.info("=== MOCK SMS ===");
        log.info("To: {}", phoneNumber);
        log.info("Message: {}", message);
        log.info("================");
    }

    /**
     * Twilio SMS implementation
     */
    private void sendTwilioSms(String phoneNumber, String message) {
        try {
            Message smsMessage = Message.creator(
                    new PhoneNumber(phoneNumber),           // To
                    new PhoneNumber(twilioPhoneNumber),     // From (Twilio number)
                    message
            ).create();

            log.info("Twilio SMS sent successfully!");
            log.info("To: {}", phoneNumber);
            log.info("Message SID: {}", smsMessage.getSid());
            log.info("Status: {}", smsMessage.getStatus());

        } catch (Exception e) {
            log.error("Error sending Twilio SMS to {}: {}", phoneNumber, e.getMessage());
            throw new RuntimeException("Failed to send SMS: " + e.getMessage(), e);
        }
    }
}
