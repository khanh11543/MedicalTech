package com.q2k.meditech.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.security.SecureRandom;

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
    public void sendOtpEmail(String email, String otpCode) {
        try {
            String subject = "OTP Verification Code - MedicalTech";
            String htmlContent = buildOtpEmailTemplate(otpCode);
            
            sendHtmlEmail(email, subject, htmlContent);
            log.info("✅ OTP email sent successfully to: {}", email);
        } catch (MessagingException e) {
            log.error("❌ Failed to send OTP email to: {}", email, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    /**
     * Send reset password email
     */
    public void sendResetPasswordEmail(String email, String resetToken) {
        try {
            String subject = "Reset Password - MedicalTech";
            String htmlContent = buildResetPasswordEmailTemplate(resetToken);
            
            sendHtmlEmail(email, subject, htmlContent);
            log.info("✅ Reset password email sent successfully to: {}", email);
        } catch (MessagingException e) {
            log.error("❌ Failed to send reset password email to: {}", email, e);
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
        } catch (MessagingException e) {
            log.error("❌ Failed to send welcome email to: {}", email, e);
            // Don't throw exception for welcome email
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
        } catch (MessagingException e) {
            log.error("❌ Failed to send account locked email to: {}", email, e);
            // Don't throw exception for notification email
        }
    }
    
    /**
     * Send HTML email
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        
        try {
            helper.setFrom(fromEmail, fromName);
        } catch (UnsupportedEncodingException e) {
            // Fallback to simple email without personal name
            helper.setFrom(fromEmail);
        }
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        
        mailSender.send(message);
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
                "            <p>Hệ thống quản lý y tế</p>\n" +
                "        </div>\n" +
                "        <div class='content'>\n" +
                "            <h2>Xác thực tài khoản của bạn</h2>\n" +
                "            <p>Cảm ơn bạn đã đăng ký tài khoản tại MedicalTech. Vui lòng sử dụng mã OTP dưới đây để hoàn tất việc xác thực email:</p>\n" +
                "            <div class='otp-box'>\n" +
                "                <p>Mã xác thực của bạn:</p>\n" +
                "                <div class='otp-code'>" + otpCode + "</div>\n" +
                "                <p class='warning'>⏰ Mã này sẽ hết hạn sau 15 phút</p>\n" +
                "            </div>\n" +
                "            <p>⚠️ <strong>Lưu ý:</strong></p>\n" +
                "            <ul>\n" +
                "                <li>Không chia sẻ mã này với bất kỳ ai</li>\n" +
                "                <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email</li>\n" +
                "                <li>Mã chỉ được sử dụng 1 lần</li>\n" +
                "            </ul>\n" +
                "        </div>\n" +
                "        <div class='footer'>\n" +
                "            <p>© 2026 MedicalTech. All rights reserved.</p>\n" +
                "            <p>Email này được gửi tự động, vui lòng không trả lời.</p>\n" +
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
}
