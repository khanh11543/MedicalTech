package com.q2k.meditech.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.security.SecureRandom;
import java.util.List;

/**
 * Email Service for sending emails via SMTP
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    private static final SecureRandom random = new SecureRandom();

    /**
     * Generate 6-digit OTP
     */
    public String generateOtp() {
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    /**
     * Send OTP email
     */
    /**
     * Send OTP email
     */
    public void sendOtpEmail(String email, String otpCode) {
        try {
            String subject = "OTP Verification Code - MedicalTech";
            String htmlContent = buildOtpEmailTemplate(otpCode);
            sendHtmlEmail(email, subject, htmlContent);
            log.info("OTP email queued for: {}", email);
        } catch (Exception e) {
            log.error("❌ Failed to send OTP email to: {}", email, e);
            throw new RuntimeException("Failed to send OTP email. Please try again.", e);
        }
    }

    /**
     * Send reset password email (legacy: token-based reset)
     */
    public void sendResetPasswordEmail(String email, String resetToken) {
        try {
            String subject = "Reset Password - MedicalTech";
            String htmlContent = buildResetPasswordEmailTemplate(resetToken);

            sendHtmlEmail(email, subject, htmlContent);
            log.info("✅ Reset password email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("❌ Failed to send reset password email to: {}", email, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send forgot-password email with new temporary password.
     * Temp password is valid for 15 minutes; user must login and change password in Profile.
     */
    public void sendForgotPasswordTempPasswordEmail(String email, String tempPassword, int validMinutes) {
        try {
            String subject = "Password recovery - Your new password - MedicalTech";
            String htmlContent = buildForgotPasswordTempPasswordTemplate(tempPassword, validMinutes);

            sendHtmlEmail(email, subject, htmlContent);
            log.info("✅ Forgot password (temp password) email sent to: {}", email);
        } catch (Exception e) {
            log.error("❌ Failed to send forgot password email to: {}", email, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send welcome email after successful registration
     */
    public void sendWelcomeEmail(String email, String name) {
        try {
            String subject = "Welcome to MedicalTech!";
            String htmlContent = buildWelcomeEmailTemplate(name);

            sendHtmlEmail(email, subject, htmlContent);
            log.info("✅ Welcome email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("❌ Failed to send welcome email to: {}", email, e);
            // Don't throw exception for welcome email
        }
    }

    /**
     * Send doctor credentials email with login information
     */
    public void sendDoctorCredentialsEmail(String email, String name, String tempPassword, String verifyUrl) {
        try {
            String subject = "Your MedicalTech Doctor Account Has Been Created";
            String htmlContent = buildDoctorCredentialsEmailTemplate(name, email, tempPassword, verifyUrl);
            sendHtmlEmail(email, subject, htmlContent);
            log.info("Doctor credentials email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send doctor credentials email to: {}", email, e);
        }
    }

    /**
     * Send account locked notification
     */
    public void sendAccountLockedEmail(String email) {
        try {
            String subject = "Account Locked - MedicalTech";
            String htmlContent = buildAccountLockedEmailTemplate();

            sendHtmlEmail(email, subject, htmlContent);
            log.info("✅ Account locked email sent successfully to: {}", email);
        } catch (Exception e) {
            log.error("❌ Failed to send account locked email to: {}", email, e);
            // Don't throw exception for notification email
        }
    }

    /**
     * Send two-factor backup codes to the user's email (e.g. after enabling Authenticator).
     */
    public void sendBackupCodesEmail(String email, List<String> backupCodes) {
        if (email == null || backupCodes == null || backupCodes.isEmpty()) return;
        try {
            String subject = "Your Two-Factor Backup Codes - MedicalTech";
            String htmlContent = buildBackupCodesEmailTemplate(backupCodes);
            sendHtmlEmail(email, subject, htmlContent);
            log.info("Backup codes email sent to: {}", email);
        } catch (Exception e) {
            log.error("Failed to send backup codes email to: {}", email, e);
            throw new RuntimeException("Failed to send backup codes email. Please try again or download the codes.", e);
        }
    }

    private String buildBackupCodesEmailTemplate(List<String> backupCodes) {
        StringBuilder codesHtml = new StringBuilder();
        for (String code : backupCodes) {
            codesHtml.append("<div style='font-family:monospace;font-size:14px;padding:8px 12px;margin:4px 0;background:#f5f5f5;border-radius:6px;'>").append(code).append("</div>");
        }
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'></head>\n" +
                "<body style='font-family:Arial,sans-serif;line-height:1.6;color:#333;'>\n" +
                "    <div style='max-width:600px;margin:0 auto;padding:20px;'>\n" +
                "        <div style='background:linear-gradient(135deg,#049ebb 0%,#037a94 100%);color:white;padding:24px;text-align:center;border-radius:10px 10px 0 0;'>\n" +
                "            <h1 style='margin:0;'>MedicalTech</h1>\n" +
                "            <p style='margin:8px 0 0;'>Two-Factor Authentication</p>\n" +
                "        </div>\n" +
                "        <div style='background:#f9f9f9;padding:24px;border-radius:0 0 10px 10px;'>\n" +
                "            <h2>Your backup codes</h2>\n" +
                "            <p>Store these codes in a safe place. Each code can be used once to sign in if you lose access to your Authenticator app.</p>\n" +
                "            <p><strong>These codes are shown only once.</strong> If you did not enable two-factor authentication, please secure your account immediately.</p>\n" +
                "            <div style='margin:16px 0;'>" + codesHtml + "</div>\n" +
                "        </div>\n" +
                "        <p style='text-align:center;margin-top:20px;color:#777;font-size:12px;'>© 2026 MedicalTech. This is an automated email; please do not reply.</p>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Build OTP email HTML template
     */
    private String buildOtpEmailTemplate(String otpCode) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset='UTF-8'>\n" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n" +
                "        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }\n" +
                "        .otp-box { background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n" +
                "        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 10px 0; }\n" +
                "        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }\n" +
                "        .warning { color: #e74c3c; font-size: 14px; margin-top: 10px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='container'>\n" +
                "        <div class='header'>\n" +
                "            <h1>🏥 MedicalTech</h1>\n" +
                "            <p>Healthcare Management System</p>\n" +
                "        </div>\n" +
                "        <div class='content'>\n" +
                "            <h2>Verify Your Account</h2>\n" +
                "            <p>Thank you for registering at MedicalTech. Please use the OTP code below to complete your email verification:</p>\n" +
                "            <div class='otp-box'>\n" +
                "                <p>Your verification code:</p>\n" +
                "                <div class='otp-code'>" + otpCode + "</div>\n" +
                "                <p class='warning'>⏰ This code will expire in 15 minutes</p>\n" +
                "            </div>\n" +
                "            <p>⚠️ <strong>Important:</strong></p>\n" +
                "            <ul>\n" +
                "                <li>Do not share this code with anyone</li>\n" +
                "                <li>If you did not request this code, please ignore this email</li>\n" +
                "                <li>This code can only be used once</li>\n" +
                "            </ul>\n" +
                "        </div>\n" +
                "        <div class='footer'>\n" +
                "            <p>© 2026 MedicalTech. All rights reserved.</p>\n" +
                "            <p>This is an automated email, please do not reply.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Build Forgot Password (temporary password) email HTML template
     */
    private String buildForgotPasswordTempPasswordTemplate(String tempPassword, int validMinutes) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset='UTF-8'>\n" +
                "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                "        .header { background: linear-gradient(135deg, #049ebb 0%, #037a94 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n" +
                "        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }\n" +
                "        .password-box { background: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n" +
                "        .password-code { font-size: 24px; font-weight: bold; color: #049ebb; letter-spacing: 3px; margin: 10px 0; }\n" +
                "        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }\n" +
                "        .warning { color: #e74c3c; font-size: 14px; margin-top: 15px; }\n" +
                "        .steps { background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 15px 0; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='container'>\n" +
                "        <div class='header'>\n" +
                "            <h1>MedicalTech</h1>\n" +
                "            <p>Password recovery</p>\n" +
                "        </div>\n" +
                "        <div class='content'>\n" +
                "            <h2>Your new temporary password</h2>\n" +
                "            <p>You requested a password reset. Use the temporary password below to sign in:</p>\n" +
                "            <div class='password-box'>\n" +
                "                <p>Temporary password:</p>\n" +
                "                <div class='password-code'>" + tempPassword + "</div>\n" +
                "                <p class='warning'>This password is valid for <strong>" + validMinutes + " minutes</strong> only. After that, request Forgot password again to receive a new one.</p>\n" +
                "            </div>\n" +
                "            <div class='steps'>\n" +
                "                <p><strong>Next steps:</strong></p>\n" +
                "                <ol style='text-align: left; margin: 10px 0; padding-left: 20px;'>\n" +
                "                    <li>Sign in with your email and the temporary password above</li>\n" +
                "                    <li>Go to <strong>Profile / Account settings</strong> to change your password</li>\n" +
                "                </ol>\n" +
                "            </div>\n" +
                "            <p>Do not share this email. If you did not request a reset, ignore this message and change your password if you are already signed in.</p>\n" +
                "        </div>\n" +
                "        <div class='footer'>\n" +
                "            <p>© 2026 MedicalTech. All rights reserved.</p>\n" +
                "            <p>This is an automated message; please do not reply.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Build Reset Password email HTML template
     */
    private String buildResetPasswordEmailTemplate(String resetToken) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset='UTF-8'>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n" +
                "        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }\n" +
                "        .token-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); word-break: break-all; }\n" +
                "        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='container'>\n" +
                "        <div class='header'>\n" +
                "            <h1>🏥 MedicalTech</h1>\n" +
                "        </div>\n" +
                "        <div class='content'>\n" +
                "            <h2>Reset Password</h2>\n" +
                "            <p>You requested a password reset. Use the following token:</p>\n" +
                "            <div class='token-box'><strong>" + resetToken + "</strong></div>\n" +
                "            <p style='color: #e74c3c;'>⏰ This code will expire in 60 minutes</p>\n" +
                "        </div>\n" +
                "        <div class='footer'>\n" +
                "            <p>© 2026 MedicalTech. All rights reserved.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Build Welcome email HTML template
     */
    private String buildWelcomeEmailTemplate(String name) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset='UTF-8'>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n" +
                "        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }\n" +
                "        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='container'>\n" +
                "        <div class='header'>\n" +
                "            <h1>🏥 MedicalTech</h1>\n" +
                "        </div>\n" +
                "        <div class='content'>\n" +
                "            <h2>Welcome to MedicalTech!</h2>\n" +
                "            <p>Hello <strong>" + name + "</strong>,</p>\n" +
                "            <p>Your account has been verified successfully! Thank you for joining our healthcare management system.</p>\n" +
                "            <p>You can now start using our services.</p>\n" +
                "        </div>\n" +
                "        <div class='footer'>\n" +
                "            <p>© 2026 MedicalTech. All rights reserved.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Build Doctor Credentials email HTML template
     */
    private String buildDoctorCredentialsEmailTemplate(String name, String email, String tempPassword, String verifyUrl) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset='UTF-8'>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n" +
                "        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }\n" +
                "        .credentials-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n" +
                "        .credentials-box p { margin: 8px 0; }\n" +
                "        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }\n" +
                "        .warning { color: #e74c3c; font-size: 14px; margin-top: 15px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='container'>\n" +
                "        <div class='header'>\n" +
                "            <h1>\uD83C\uDFE5 MedicalTech</h1>\n" +
                "        </div>\n" +
                "        <div class='content'>\n" +
                "            <h2>Welcome to MedicalTech!</h2>\n" +
                "            <p>Hello <strong>" + name + "</strong>,</p>\n" +
                "            <p>Your doctor account has been created successfully. Below are your login credentials:</p>\n" +
                "            <div class='credentials-box'>\n" +
                "                <p><strong>Login Email:</strong> " + email + "</p>\n" +
                "                <p><strong>Password:</strong> " + tempPassword + "</p>\n" +
                "            </div>\n" +
                "            <div style='text-align: center; margin: 25px 0;'>\n" +
                "                <a href='" + verifyUrl + "' style='display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;'>Verify Account</a>\n" +
                "            </div>\n" +
                "            <p style='text-align: center; color: #888; font-size: 12px;'>Or copy this link: <br/>" + verifyUrl + "</p>\n" +
                "            <p class='warning'>⚠️ <strong>Important Notice:</strong></p>\n" +
                "            <ul>\n" +
                "                <li>Please change your password immediately after your first login</li>\n" +
                "                <li>Do not share your login credentials with anyone</li>\n" +
                "                <li>Click the \"Verify Account\" button above to activate your account</li>\n" +
                "            </ul>\n" +
                "        </div>\n" +
                "        <div class='footer'>\n" +
                "            <p>© 2026 MedicalTech. All rights reserved.</p>\n" +
                "            <p>This is an automated email, please do not reply.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Build Account Locked email HTML template
     */
    private String buildAccountLockedEmailTemplate() {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset='UTF-8'>\n" +
                "    <style>\n" +
                "        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }\n" +
                "        .container { max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                "        .header { background: #e74c3c; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }\n" +
                "        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }\n" +
                "        .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class='container'>\n" +
                "        <div class='header'>\n" +
                "            <h1>⚠️ Security Alert</h1>\n" +
                "        </div>\n" +
                "        <div class='content'>\n" +
                "            <h2>Account Locked</h2>\n" +
                "            <p>Your account has been locked due to multiple failed login attempts.</p>\n" +
                "            <p>Please contact support or wait for the account to unlock automatically.</p>\n" +
                "        </div>\n" +
                "        <div class='footer'>\n" +
                "            <p>© 2026 MedicalTech. All rights reserved.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
    /**
     * Send simple email (async)
     */
    @Async
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            mailSender.send(message);
            log.info("Simple email sent to: {}, subject: {}", to, subject);

        } catch (Exception e) {
            log.error("Failed to send simple email to: {}", to, e);
        }
    }

    /**
     * Send HTML email
     */
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            log.info("Attempting to send email to: {}", to);
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML

            mailSender.send(message);
            log.info("HTML email sent successfully to: {}, subject: {}", to, subject);

        } catch (Exception e) {
            log.error("Failed to send HTML email to: {}", to, e);
        }
    }

    /**
     * Send HTML email with PDF attachment
     */
    @Async
    public void sendEmailWithAttachment(String to, String subject, String htmlContent,
                                        byte[] attachmentBytes, String attachmentFileName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = HTML

            // Add PDF attachment
            helper.addAttachment(attachmentFileName,
                    new jakarta.mail.util.ByteArrayDataSource(attachmentBytes, "application/pdf"));

            mailSender.send(message);
            log.info("HTML email with attachment sent to: {}, subject: {}", to, subject);

        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send email with attachment to: {}", to, e);
        }
    }

    /**
     * Send invoice email
     */
    @Async
    public void sendInvoiceEmail(String to, String invoiceNumber, String patientName, String htmlContent) {
        String subject = "Invoice #" + invoiceNumber + " - Medical Tech";
        sendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * Send payment confirmation email
     */
    @Async
    public void sendPaymentConfirmationEmail(String to, String paymentCode, String amount) {
        String subject = "Payment Confirmation - " + paymentCode;
        String htmlContent = String.format(
                "<h2>Payment Confirmed</h2>" +
                        "<p>Your payment has been received successfully.</p>" +
                        "<p><strong>Payment Code:</strong> %s</p>" +
                        "<p><strong>Amount:</strong> %s VND</p>" +
                        "<p>Thank you for your payment!</p>" +
                        "<p>Best regards,<br>Medical Tech</p>",
                paymentCode, amount);

        sendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * Send refund notification email
     */
    @Async
    public void sendRefundEmail(String to, String paymentCode, String refundAmount) {
        String subject = "Refund Notification - " + paymentCode;
        String htmlContent = String.format(
                "<h2>Refund Processed</h2>" +
                        "<p>Your refund has been processed successfully.</p>" +
                        "<p><strong>Payment Code:</strong> %s</p>" +
                        "<p><strong>Refund Amount:</strong> %s VND</p>" +
                        "<p>The funds will be returned to your original payment method within 3-5 business days.</p>" +
                        "<p>Best regards,<br>Medical Tech</p>",
                paymentCode, refundAmount);

        sendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * Send appointment confirmation email to the patient's registered email
     * after a successful booking.
     */
    @Async
    public void sendAppointmentConfirmationEmail(
            String toEmail,
            String patientName,
            String appointmentCode,
            String department,
            String doctorName,
            String dateStr,
            String timeStr,
            String reasonForVisit,
            String clinicName,
            String hotline,
            String address) {
        sendAppointmentConfirmationEmail(toEmail, patientName, appointmentCode, department,
                doctorName, dateStr, timeStr, reasonForVisit, clinicName, hotline, address,
                null, null, null);
    }

    /**
     * Send appointment confirmation email with payment info (QR code, payment link).
     */
    @Async
    public void sendAppointmentConfirmationEmail(
            String toEmail,
            String patientName,
            String appointmentCode,
            String department,
            String doctorName,
            String dateStr,
            String timeStr,
            String reasonForVisit,
            String clinicName,
            String hotline,
            String address,
            String paymentAmount,
            String paymentQrUrl,
            String paymentPageUrl) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Cannot send appointment confirmation: patient email is empty");
            return;
        }
        try {
            String subject = "Appointment Confirmation - " + (appointmentCode != null ? appointmentCode : "");
            String htmlContent = buildAppointmentConfirmationEmailTemplate(
                    patientName, appointmentCode, department, doctorName,
                    dateStr, timeStr, reasonForVisit, clinicName, hotline, address,
                    paymentAmount, paymentQrUrl, paymentPageUrl);
            sendHtmlEmail(toEmail, subject, htmlContent);
            log.info("Appointment confirmation email sent to: {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send appointment confirmation email to: {}", toEmail, e);
        }
    }

    private String buildAppointmentConfirmationEmailTemplate(
            String patientName,
            String appointmentCode,
            String department,
            String doctorName,
            String dateStr,
            String timeStr,
            String reasonForVisit,
            String clinicName,
            String hotline,
            String address) {
        return buildAppointmentConfirmationEmailTemplate(patientName, appointmentCode, department,
                doctorName, dateStr, timeStr, reasonForVisit, clinicName, hotline, address,
                null, null, null);
    }

    private String buildAppointmentConfirmationEmailTemplate(
            String patientName,
            String appointmentCode,
            String department,
            String doctorName,
            String dateStr,
            String timeStr,
            String reasonForVisit,
            String clinicName,
            String hotline,
            String address,
            String paymentAmount,
            String paymentQrUrl,
            String paymentPageUrl) {
        String pName = safeStr(patientName);
        String code = safeStr(appointmentCode);
        String dept = safeStr(department);
        String doc = safeStr(doctorName);
        String date = safeStr(dateStr);
        String time = safeStr(timeStr);
        String reason = reasonForVisit == null || reasonForVisit.isBlank() ? "—" : reasonForVisit;
        String clinic = clinicName == null || clinicName.isBlank() ? "MedicalTech Clinic" : clinicName;
        String phone = safeStr(hotline);
        String addr = safeStr(address);

        // Build payment section HTML if payment info is available
        String paymentSection = "";
        if (paymentAmount != null && !paymentAmount.isBlank()) {
            StringBuilder sb = new StringBuilder();
            sb.append("<div style='background:#fff3cd;padding:20px;margin:16px 0;border-radius:8px;border:1px solid #ffc107;'>\n");
            sb.append("<p style='margin:0 0 12px;font-size:1.1rem;font-weight:bold;color:#856404;'>💳 Payment Required Before Your Visit</p>\n");
            sb.append("<p style='margin:4px 0;'>Consultation Fee: <strong>").append(escapeHtml(paymentAmount)).append(" VND</strong></p>\n");
            sb.append("<p style='margin:8px 0 4px;color:#555;font-size:0.9rem;'>Please complete your payment before arriving at the clinic.</p>\n");
            if (paymentQrUrl != null && !paymentQrUrl.isBlank()) {
                sb.append("<div style='text-align:center;margin:16px 0;'>\n");
                sb.append("<p style='margin:0 0 8px;font-weight:bold;'>Scan QR with MoMo App to Pay:</p>\n");
                sb.append("<img src='").append(escapeHtml(paymentQrUrl)).append("' alt='MoMo Payment QR Code' style='width:200px;height:200px;border-radius:8px;border:2px solid #ddd;' />\n");
                sb.append("<p style='margin:8px 0 0;font-size:0.8rem;color:#888;'>⏱ QR code expires in 15 minutes. You can generate a new one from your Payment History.</p>\n");
                sb.append("</div>\n");
            }
            if (paymentPageUrl != null && !paymentPageUrl.isBlank()) {
                sb.append("<div style='text-align:center;margin:12px 0;'>\n");
                sb.append("<a href='").append(escapeHtml(paymentPageUrl)).append("' style='display:inline-block;background:#a50064;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;'>Pay with MoMo</a>\n");
                sb.append("</div>\n");
            }
            sb.append("<p style='margin:12px 0 0;font-size:0.85rem;color:#555;text-align:center;'>If the QR has expired, go to your <strong>Profile → Payment History</strong> and click <strong>Pay Now</strong> to get a new QR code.</p>\n");
            sb.append("<p style='margin:12px 0 0;font-size:0.85rem;color:#856404;'>⚠️ Cancellation policy: Cancel ≥24h before → 50% refund | Cancel <24h → no refund | Doctor cancels → 100% refund.</p>\n");
            sb.append("</div>\n");
            paymentSection = sb.toString();
        }

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
                "<style>\n" +
                "body{font-family:Arial,sans-serif;line-height:1.6;color:#333;}\n" +
                ".container{max-width:600px;margin:0 auto;padding:20px;}\n" +
                ".header{background:linear-gradient(135deg,#049ebb 0%,#037a94 100%);color:#fff;padding:24px;text-align:center;border-radius:10px 10px 0 0;}\n" +
                ".content{background:#f9f9f9;padding:28px;border-radius:0 0 10px 10px;}\n" +
                ".details{background:#fff;padding:20px;margin:16px 0;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);}\n" +
                ".details p{margin:8px 0;}\n" +
                ".note{background:#e8f4f8;padding:14px;border-radius:8px;margin:16px 0;}\n" +
                ".contact{margin-top:20px;padding-top:16px;border-top:1px solid #eee;}\n" +
                ".footer{text-align:center;margin-top:24px;color:#777;font-size:12px;}\n" +
                "</style>\n" +
                "</head>\n" +
                "<body>\n" +
                "<div class='container'>\n" +
                "<div class='header'><h1 style='margin:0;font-size:1.5rem;'>" + escapeHtml(clinic) + "</h1><p style='margin:8px 0 0;opacity:0.9;'>Appointment Confirmation</p></div>\n" +
                "<div class='content'>\n" +
                "<p>Dear <strong>" + escapeHtml(pName) + "</strong>,</p>\n" +
                "<p>Your appointment at <strong>" + escapeHtml(clinic) + "</strong> has been successfully scheduled.</p>\n" +
                "<div class='details'>\n" +
                "<p><strong>Appointment Details:</strong></p>\n" +
                "<p>• Appointment ID: <strong>" + escapeHtml(code) + "</strong></p>\n" +
                "<p>• Department: " + escapeHtml(dept) + "</p>\n" +
                "<p>• Doctor: " + escapeHtml(doc) + "</p>\n" +
                "<p>• Date: " + escapeHtml(date) + "</p>\n" +
                "<p>• Time: " + escapeHtml(time) + "</p>\n" +
                "<p><strong>Reason for Visit:</strong><br>" + escapeHtml(reason) + "</p>\n" +
                "</div>\n" +
                paymentSection +
                "<div class='note'>\n" +
                "<p><strong>Note:</strong> Please arrive <strong>15 minutes early</strong> to complete the check-in process.</p>\n" +
                "</div>\n" +
                "<div class='contact'>\n" +
                "<p>If you need to reschedule or cancel your appointment, please contact us:</p>\n" +
                "<p><strong>Hotline:</strong> " + escapeHtml(phone) + "</p>\n" +
                "<p><strong>Address:</strong> " + escapeHtml(addr) + "</p>\n" +
                "</div>\n" +
                "<p>Best regards,<br><strong>" + escapeHtml(clinic) + "</strong></p>\n" +
                "</div>\n" +
                "<div class='footer'><p>This is an automated message. Please do not reply to this email.</p></div>\n" +
                "</div>\n" +
                "</body>\n" +
                "</html>";
    }

    private static String safeStr(String s) {
        return s == null || s.isBlank() ? "—" : s;
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
