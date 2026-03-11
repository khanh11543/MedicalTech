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
                "            <h2>Chào mừng bạn đến với MedicalTech!</h2>\n" +
                "            <p>Xin chào <strong>" + name + "</strong>,</p>\n" +
                "            <p>Tài khoản bác sĩ của bạn đã được tạo thành công. Dưới đây là thông tin đăng nhập:</p>\n" +
                "            <div class='credentials-box'>\n" +
                "                <p><strong>Email đăng nhập:</strong> " + email + "</p>\n" +
                "                <p><strong>Mật khẩu:</strong> " + tempPassword + "</p>\n" +
                "            </div>\n" +
                "            <div style='text-align: center; margin: 25px 0;'>\n" +
                "                <a href='" + verifyUrl + "' style='display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;'>Xác thực tài khoản</a>\n" +
                "            </div>\n" +
                "            <p style='text-align: center; color: #888; font-size: 12px;'>Hoặc copy link: <br/>" + verifyUrl + "</p>\n" +
                "            <p class='warning'>⚠️ <strong>Lưu ý quan trọng:</strong></p>\n" +
                "            <ul>\n" +
                "                <li>Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu</li>\n" +
                "                <li>Không chia sẻ thông tin đăng nhập với bất kỳ ai</li>\n" +
                "                <li>Nhấn nút \"Xác thực tài khoản\" ở trên để kích hoạt tài khoản</li>\n" +
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
}
