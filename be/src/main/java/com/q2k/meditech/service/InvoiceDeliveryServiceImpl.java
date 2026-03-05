package com.q2k.meditech.service;

import com.q2k.meditech.dto.DeliveryLogDTO;
import com.q2k.meditech.dto.SendInvoiceDTO;
import com.q2k.meditech.dto.SendInvoiceResultDTO;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Invoice Delivery Service Implementation
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceDeliveryServiceImpl implements InvoiceDeliveryService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final DeliveryLogRepository deliveryLogRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SmsService smsService;

    @Override
    @Transactional
    public SendInvoiceResultDTO sendInvoice(Long paymentId, SendInvoiceDTO dto, Long currentUserId) {
        log.info("Sending invoice for payment ID: {}, email: {}, sms: {}", 
                paymentId, dto.getSendEmail(), dto.getSendSms());

        // Get payment and invoice
        Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        Invoice invoice = invoiceRepository.findByPaymentIdWithDetails(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found for payment: " + paymentId));

        // Get current user (null-safe: currentUserId can be null for auto-send)
        User currentUser = (currentUserId != null) 
                ? userRepository.findById(currentUserId).orElse(null) 
                : null;

        // Get recipient info
        String recipientEmail = dto.getEmail() != null 
                ? dto.getEmail() 
                : payment.getPatient().getUser().getEmail();
        String recipientPhone = dto.getPhone() != null 
                ? dto.getPhone() 
                : payment.getPatient().getUser().getPhone();

        SendInvoiceResultDTO result = SendInvoiceResultDTO.builder()
                .success(true)
                .build();

        // Send email if requested
        if (Boolean.TRUE.equals(dto.getSendEmail()) && recipientEmail != null) {
            try {
                sendEmailInvoice(payment, invoice, recipientEmail, dto.getMessage());
                
                result.setEmailSent(true);
                result.setEmailStatus("Email sent successfully to " + recipientEmail);
                
                // Update invoice email status
                invoice.setEmailStatus("SENT");
                invoice.setEmailSentAt(LocalDateTime.now());
                invoiceRepository.save(invoice);
                
                // Log delivery
                createDeliveryLog(payment, "EMAIL", recipientEmail, "SENT", 
                        "Invoice sent successfully", null, currentUser);
                
            } catch (Exception e) {
                log.error("Failed to send email invoice", e);
                result.setEmailSent(false);
                result.setEmailStatus("Failed: " + e.getMessage());
                
                // Update invoice email status to FAILED (invoice still exists, only email failed)
                invoice.setEmailStatus("FAILED");
                invoiceRepository.save(invoice);
                
                // Log failure
                createDeliveryLog(payment, "EMAIL", recipientEmail, "FAILED", 
                        null, e.getMessage(), currentUser);
            }
        }

        // Send SMS if requested
        if (Boolean.TRUE.equals(dto.getSendSms()) && recipientPhone != null) {
            try {
                sendSmsInvoice(payment, invoice, recipientPhone, dto.getMessage());
                
                result.setSmsSent(true);
                result.setSmsStatus("SMS sent successfully to " + recipientPhone);
                
                // Log delivery
                createDeliveryLog(payment, "SMS", recipientPhone, "SENT", 
                        "Invoice sent successfully", null, currentUser);
                
            } catch (Exception e) {
                log.error("Failed to send SMS invoice", e);
                result.setSmsSent(false);
                result.setSmsStatus("Failed: " + e.getMessage());
                
                // Log failure
                createDeliveryLog(payment, "SMS", recipientPhone, "FAILED", 
                        null, e.getMessage(), currentUser);
            }
        }

        // Build result message
        StringBuilder message = new StringBuilder("Invoice delivery: ");
        if (result.getEmailSent() != null) {
            message.append("Email ").append(result.getEmailSent() ? "sent" : "failed").append(". ");
        }
        if (result.getSmsSent() != null) {
            message.append("SMS ").append(result.getSmsSent() ? "sent" : "failed").append(".");
        }
        result.setMessage(message.toString());

        log.info("Invoice delivery completed for payment: {}", paymentId);
        return result;
    }

    @Override
    public List<DeliveryLogDTO> getDeliveryLogs(Long paymentId) {
        log.info("Getting delivery logs for payment ID: {}", paymentId);

        // Verify payment exists
        if (!paymentRepository.existsById(paymentId)) {
            throw new ResourceNotFoundException("Payment", "id", paymentId);
        }

        List<DeliveryLog> logs = deliveryLogRepository.findByPaymentIdWithDetails(paymentId);
        return logs.stream()
                .map(this::mapToDeliveryLogDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(Long invoiceId) {
        log.info("Generating PDF for invoice ID: {}", invoiceId);

        // Validate invoiceId is not null
        if (invoiceId == null) {
            throw new ResourceNotFoundException("Invoice", "id", null);
        }

        Invoice invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", invoiceId));

        // Use iText to generate real PDF
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(outputStream);
            com.itextpdf.kernel.pdf.PdfDocument pdfDoc = new com.itextpdf.kernel.pdf.PdfDocument(writer);
            com.itextpdf.layout.Document document = new com.itextpdf.layout.Document(pdfDoc);

            // Add title
            document.add(new com.itextpdf.layout.element.Paragraph("INVOICE")
                    .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                    .setMarginBottom(20)
                    .setBold());

            // Add invoice details
            String invoiceNumber = invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "N/A";
            String invoiceDate = invoice.getInvoiceDate() != null ? invoice.getInvoiceDate().toString() : "N/A";
            String patientName = (invoice.getPatient() != null && invoice.getPatient().getUser() != null 
                    && invoice.getPatient().getUser().getFullName() != null) 
                    ? invoice.getPatient().getUser().getFullName() : "N/A";
            String paymentCode = (invoice.getPayment() != null && invoice.getPayment().getPaymentCode() != null) 
                    ? invoice.getPayment().getPaymentCode() : "N/A";

            com.itextpdf.layout.element.Paragraph details = new com.itextpdf.layout.element.Paragraph()
                    .add("Invoice #: ").add(invoiceNumber).add("\n")
                    .add("Date: ").add(invoiceDate).add("\n")
                    .add("Patient: ").add(patientName).add("\n")
                    .add("Payment Code: ").add(paymentCode);
            document.add(details);

            // Add table for line items
            float[] columnWidths = {3, 2, 2, 2};
            com.itextpdf.layout.element.Table table = new com.itextpdf.layout.element.Table(columnWidths)
                    .setMarginTop(20);

            // Header row
            table.addHeaderCell("Description");
            table.addHeaderCell("Unit Price");
            table.addHeaderCell("Quantity");
            table.addHeaderCell("Amount");

            // Items (could be from invoice.items if available)
            String amountStr = (invoice.getPayment() != null && invoice.getPayment().getAmount() != null) 
                    ? invoice.getPayment().getAmount().toString() : "0";
            table.addCell("Consultation Fee");
            table.addCell(amountStr);
            table.addCell("1");
            table.addCell(amountStr);

            document.add(table);

            // Add totals
            String subtotalStr = invoice.getSubtotal() != null ? invoice.getSubtotal().toString() : "0";
            String discountStr = invoice.getDiscount() != null ? invoice.getDiscount().toString() : "0";
            String taxStr = invoice.getTax() != null ? invoice.getTax().toString() : "0";
            String totalStr = invoice.getTotal() != null ? invoice.getTotal().toString() : "0";

            com.itextpdf.layout.element.Paragraph totals = new com.itextpdf.layout.element.Paragraph()
                    .setMarginTop(20)
                    .add("Subtotal: ").add(subtotalStr).add(" VND\n")
                    .add("Discount: ").add(discountStr).add(" VND\n")
                    .add("Tax: ").add(taxStr).add(" VND\n")
                    .add(new com.itextpdf.layout.element.Text("Total: " + totalStr + " VND")
                            .setBold());
            document.add(totals);

            // Add footer
            com.itextpdf.layout.element.Paragraph footer = new com.itextpdf.layout.element.Paragraph()
                    .setMarginTop(40)
                    .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER)
                    .add("Generated: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                    .add("\nThank you for your payment!");
            document.add(footer);

            document.close();

            log.info("PDF generated successfully for invoice: {}, size: {} bytes", invoiceId, outputStream.size());
            return outputStream.toByteArray();

        } catch (Exception e) {
            log.error("Error generating PDF for invoice: {}", invoiceId, e);
            throw new RuntimeException("Failed to generate PDF: " + e.getMessage(), e);
        }
    }

    // ========== HELPER METHODS ==========

    /**
     * Send invoice via email using EmailService
     */
    private void sendEmailInvoice(Payment payment, Invoice invoice, String email, String customMessage) {
        log.info("Sending invoice email to: {}", email);
        
        String subject = "Hóa đơn #" + invoice.getInvoiceNumber() + " - Medical Tech";
        String htmlBody = buildEmailBody(payment, invoice, customMessage);
        
        // Generate PDF and send with attachment
        try {
            byte[] pdfBytes = generateInvoicePdf(invoice.getId());
            String fileName = "Invoice_" + invoice.getInvoiceNumber() + ".pdf";
            
            emailService.sendEmailWithAttachment(email, subject, htmlBody, pdfBytes, fileName);
            log.info("Invoice email sent successfully to: {}", email);
        } catch (Exception e) {
            log.warn("Failed to generate PDF, sending email without attachment: {}", e.getMessage());
            emailService.sendHtmlEmail(email, subject, htmlBody);
            log.info("Invoice email (without PDF) sent to: {}", email);
        }
    }

    /**
     * Send invoice notification via SMS using SmsService
     */
    private void sendSmsInvoice(Payment payment, Invoice invoice, String phone, String customMessage) {
        log.info("Sending invoice SMS to: {}", phone);
        
        String smsBody = String.format(
                "MediTech: Hoa don %s - So tien: %s VND - Trang thai: DA THANH TOAN. Cam on ban!",
                invoice.getInvoiceNumber(),
                formatCurrency(invoice.getTotal())
        );
        
        if (customMessage != null && !customMessage.isBlank()) {
            smsBody += " " + customMessage;
        }
        
        smsService.sendSms(phone, smsBody);
        log.info("Invoice SMS sent to: {}", phone);
    }

    /**
     * Format currency with thousand separators
     */
    private String formatCurrency(java.math.BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,.0f", amount);
    }

    /**
     * Build email body HTML
     */
    private String buildEmailBody(Payment payment, Invoice invoice, String customMessage) {
        StringBuilder html = new StringBuilder();
        html.append("<html><body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>");
        html.append("<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;'>");
        html.append("<h1 style='color: white; margin: 0;'>Medical Tech</h1>");
        html.append("</div>");
        html.append("<div style='padding: 20px;'>");
        html.append("<h2 style='color: #333;'>Hóa đơn #").append(invoice.getInvoiceNumber()).append("</h2>");
        html.append("<p>Kính gửi <strong>").append(payment.getPatient().getUser().getFullName()).append("</strong>,</p>");
        html.append("<p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Dưới đây là chi tiết hóa đơn của bạn:</p>");
        html.append("<table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>");
        html.append("<tr style='background: #f5f5f5;'><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Mã hóa đơn</th><td style='padding: 10px; border: 1px solid #ddd;'>").append(invoice.getInvoiceNumber()).append("</td></tr>");
        html.append("<tr><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Mã thanh toán</th><td style='padding: 10px; border: 1px solid #ddd;'>").append(payment.getPaymentCode()).append("</td></tr>");
        html.append("<tr style='background: #f5f5f5;'><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Ngày</th><td style='padding: 10px; border: 1px solid #ddd;'>").append(invoice.getInvoiceDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))).append("</td></tr>");
        html.append("<tr><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Tạm tính</th><td style='padding: 10px; border: 1px solid #ddd;'>").append(formatCurrency(invoice.getSubtotal())).append(" VND</td></tr>");
        html.append("<tr style='background: #f5f5f5;'><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Giảm giá</th><td style='padding: 10px; border: 1px solid #ddd;'>").append(formatCurrency(invoice.getDiscount())).append(" VND</td></tr>");
        html.append("<tr><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Thuế</th><td style='padding: 10px; border: 1px solid #ddd;'>").append(formatCurrency(invoice.getTax())).append(" VND</td></tr>");
        html.append("<tr style='background: #667eea; color: white;'><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Tổng cộng</th><td style='padding: 10px; border: 1px solid #ddd;'><strong>").append(formatCurrency(invoice.getTotal())).append(" VND</strong></td></tr>");
        html.append("<tr><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Trạng thái</th><td style='padding: 10px; border: 1px solid #ddd;'><span style='background: #4caf50; color: white; padding: 3px 10px; border-radius: 3px;'>").append(invoice.getStatus()).append("</span></td></tr>");
        html.append("</table>");
        
        if (customMessage != null && !customMessage.isBlank()) {
            html.append("<div style='background: #e8f5e9; padding: 10px; border-left: 4px solid #4caf50; margin: 20px 0;'>");
            html.append("<em>").append(customMessage).append("</em>");
            html.append("</div>");
        }
        
        html.append("<p style='color: #666;'>File PDF hóa đơn được đính kèm trong email này.</p>");
        html.append("<hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>");
        html.append("<p style='color: #999; font-size: 12px;'>Trân trọng,<br><strong>Medical Tech Clinic</strong><br>Hotline: 1900-xxxx</p>");
        html.append("</div></body></html>");
        
        return html.toString();
    }

    /**
     * Create delivery log entry
     */
    private void createDeliveryLog(Payment payment, String deliveryType, String recipient, 
                                   String status, String message, String errorMessage, User sentBy) {
        DeliveryLog log = DeliveryLog.builder()
                .payment(payment)
                .deliveryType(deliveryType)
                .recipient(recipient)
                .status(status)
                .message(message)
                .errorMessage(errorMessage)
                .sentBy(sentBy)
                .sentAt("SENT".equals(status) ? LocalDateTime.now() : null)
                .build();
        
        deliveryLogRepository.save(log);
    }

    /**
     * Map DeliveryLog entity to DTO
     */
    private DeliveryLogDTO mapToDeliveryLogDTO(DeliveryLog log) {
        DeliveryLogDTO dto = DeliveryLogDTO.builder()
                .id(log.getId())
                .paymentId(log.getPayment().getId())
                .deliveryType(log.getDeliveryType())
                .recipient(log.getRecipient())
                .status(log.getStatus())
                .message(log.getMessage())
                .errorMessage(log.getErrorMessage())
                .sentAt(log.getSentAt())
                .createdAt(log.getCreatedAt())
                .build();

        if (log.getSentBy() != null) {
            dto.setSentBy(log.getSentBy().getId());
            dto.setSentByName(log.getSentBy().getEmail());
        }

        return dto;
    }

    // ========== AUTO SEND METHODS ==========

    @Override
    @Transactional
    public SendInvoiceResultDTO autoSendInvoiceOnPaymentSuccess(Long paymentId) {
        log.info("Auto-sending invoice notification for successful payment: {}", paymentId);

        try {
            Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

            // Get patient contact info
            User patientUser = payment.getPatient().getUser();
            String email = patientUser.getEmail();
            String phone = patientUser.getPhone();

            // Check if invoice exists
            Invoice invoice = invoiceRepository.findByPaymentIdWithDetails(paymentId).orElse(null);
            if (invoice == null) {
                log.warn("No invoice found for payment: {}, skipping auto-send", paymentId);
                return SendInvoiceResultDTO.builder()
                        .success(false)
                        .message("No invoice found for this payment")
                        .build();
            }

            // Build DTO to send both email and SMS
            SendInvoiceDTO dto = SendInvoiceDTO.builder()
                    .sendEmail(email != null && !email.isEmpty())
                    .sendSms(phone != null && !phone.isEmpty())
                    .email(email)
                    .phone(phone)
                    .message("Cảm ơn bạn đã thanh toán! Hóa đơn của bạn đã được xử lý thành công.")
                    .build();

            // Send using existing method (currentUserId = null for auto-send)
            SendInvoiceResultDTO result = sendInvoice(paymentId, dto, null);
            result.setMessage("[AUTO] Payment success notification: " + result.getMessage());

            log.info("Auto-send completed for payment: {} - Email: {}, SMS: {}", 
                    paymentId, result.getEmailSent(), result.getSmsSent());

            return result;

        } catch (Exception e) {
            log.error("Failed to auto-send invoice notification for payment: {}", paymentId, e);
            return SendInvoiceResultDTO.builder()
                    .success(false)
                    .message("Auto-send failed: " + e.getMessage())
                    .build();
        }
    }

    @Override
    @Transactional
    public SendInvoiceResultDTO autoSendRefundNotification(Long paymentId) {
        log.info("Auto-sending refund notification for payment: {}", paymentId);

        try {
            Payment payment = paymentRepository.findByIdWithDetails(paymentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

            // Get patient contact info
            User patientUser = payment.getPatient().getUser();
            String email = patientUser.getEmail();
            String phone = patientUser.getPhone();

            SendInvoiceResultDTO result = SendInvoiceResultDTO.builder()
                    .success(true)
                    .build();

            // Send email notification
            if (email != null && !email.isEmpty()) {
                try {
                    sendRefundEmail(payment, email);
                    result.setEmailSent(true);
                    result.setEmailStatus("Refund email sent to " + email);
                    
                    createDeliveryLog(payment, "EMAIL", email, "SENT", 
                            "Refund notification sent", null, null);
                } catch (Exception e) {
                    log.error("Failed to send refund email", e);
                    result.setEmailSent(false);
                    result.setEmailStatus("Failed: " + e.getMessage());
                    
                    createDeliveryLog(payment, "EMAIL", email, "FAILED", 
                            null, e.getMessage(), null);
                }
            }

            // Send SMS notification
            if (phone != null && !phone.isEmpty()) {
                try {
                    sendRefundSms(payment, phone);
                    result.setSmsSent(true);
                    result.setSmsStatus("Refund SMS sent to " + phone);
                    
                    createDeliveryLog(payment, "SMS", phone, "SENT", 
                            "Refund notification sent", null, null);
                } catch (Exception e) {
                    log.error("Failed to send refund SMS", e);
                    result.setSmsSent(false);
                    result.setSmsStatus("Failed: " + e.getMessage());
                    
                    createDeliveryLog(payment, "SMS", phone, "FAILED", 
                            null, e.getMessage(), null);
                }
            }

            result.setMessage("[AUTO] Refund notification sent");
            log.info("Refund notification completed for payment: {}", paymentId);

            return result;

        } catch (Exception e) {
            log.error("Failed to auto-send refund notification for payment: {}", paymentId, e);
            return SendInvoiceResultDTO.builder()
                    .success(false)
                    .message("Refund notification failed: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Send refund notification via email using EmailService
     */
    private void sendRefundEmail(Payment payment, String email) {
        log.info("Sending refund email to: {}", email);

        String subject = "Thông báo hoàn tiền - " + payment.getPaymentCode();
        String htmlBody = buildRefundEmailBody(payment);
        
        emailService.sendHtmlEmail(email, subject, htmlBody);
        log.info("Refund email sent successfully to: {}", email);
    }

    /**
     * Build refund notification email body
     */
    private String buildRefundEmailBody(Payment payment) {
        StringBuilder html = new StringBuilder();
        html.append("<html><body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>");
        html.append("<div style='background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; text-align: center;'>");
        html.append("<h1 style='color: white; margin: 0;'>Medical Tech</h1>");
        html.append("</div>");
        html.append("<div style='padding: 20px;'>");
        html.append("<h2 style='color: #f5576c;'>🔄 Thông báo hoàn tiền</h2>");
        html.append("<p>Kính gửi <strong>").append(payment.getPatient().getUser().getFullName()).append("</strong>,</p>");
        html.append("<p>Chúng tôi xin thông báo yêu cầu hoàn tiền của bạn đã được xử lý thành công.</p>");
        html.append("<table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>");
        html.append("<tr style='background: #fff3e0;'><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Mã thanh toán</th><td style='padding: 10px; border: 1px solid #ddd;'>").append(payment.getPaymentCode()).append("</td></tr>");
        html.append("<tr><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Số tiền hoàn</th><td style='padding: 10px; border: 1px solid #ddd; color: #f5576c; font-weight: bold;'>").append(formatCurrency(payment.getRefundAmount())).append(" VND</td></tr>");
        html.append("<tr style='background: #fff3e0;'><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Lý do</th><td style='padding: 10px; border: 1px solid #ddd;'>").append(payment.getRefundReason() != null ? payment.getRefundReason() : "Không có").append("</td></tr>");
        html.append("<tr><th style='padding: 10px; border: 1px solid #ddd; text-align: left;'>Thời gian xử lý</th><td style='padding: 10px; border: 1px solid #ddd;'>").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("</td></tr>");
        html.append("</table>");
        html.append("<div style='background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;'>");
        html.append("<p style='margin: 0;'>💡 <strong>Lưu ý:</strong> Số tiền sẽ được hoàn về tài khoản/phương thức thanh toán ban đầu của bạn trong vòng <strong>3-5 ngày làm việc</strong>.</p>");
        html.append("</div>");
        html.append("<hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'>");
        html.append("<p style='color: #999; font-size: 12px;'>Nếu có thắc mắc, vui lòng liên hệ:<br><strong>Hotline: 1900-xxxx</strong><br>Email: support@meditech.vn</p>");
        html.append("<p style='color: #999; font-size: 12px;'>Trân trọng,<br><strong>Medical Tech Clinic</strong></p>");
        html.append("</div></body></html>");
        
        return html.toString();
    }

    /**
     * Send refund notification via SMS using SmsService
     */
    private void sendRefundSms(Payment payment, String phone) {
        log.info("Sending refund SMS to: {}", phone);

        String message = String.format(
                "MediTech: Hoan tien %s VND cho ma %s da duoc xu ly. So tien se duoc hoan trong 3-5 ngay lam viec. Hotline: 1900-xxxx",
                formatCurrency(payment.getRefundAmount()),
                payment.getPaymentCode()
        );

        smsService.sendSms(phone, message);
        log.info("Refund SMS sent to: {}", phone);
    }
}