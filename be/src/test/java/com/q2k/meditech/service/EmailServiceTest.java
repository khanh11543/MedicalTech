package com.q2k.meditech.service;

import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class EmailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private MimeMessage mimeMessage;

    @InjectMocks
    private EmailService emailService;

    @BeforeEach
    void mailFrom() {
        ReflectionTestUtils.setField(emailService, "fromEmail", "from@test.com");
        ReflectionTestUtils.setField(emailService, "fromName", "Med");
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
    }

    @Test
    void generateOtp_sixDigits() {
        String otp = emailService.generateOtp();
        assertThat(otp).matches("\\d{6}");
        int n = Integer.parseInt(otp);
        assertThat(n).isBetween(100000, 999999);
    }

    @Test
    void sendOtpEmail_callsMailSender() {
        emailService.sendOtpEmail("to@test.com", "111111");
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendResetPasswordEmail_callsMailSender() {
        emailService.sendResetPasswordEmail("to@test.com", "tok");
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendForgotPasswordTempPasswordEmail_callsMailSender() {
        emailService.sendForgotPasswordTempPasswordEmail("to@test.com", "tmp", 15);
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendWelcomeEmail_swallowsErrors() {
        doThrow(new RuntimeException("fail")).when(mailSender).send(any(MimeMessage.class));
        emailService.sendWelcomeEmail("to@test.com", "N");
    }

    @Test
    void sendDoctorCredentialsEmail_swallowsErrors() {
        doThrow(new RuntimeException("fail")).when(mailSender).send(any(MimeMessage.class));
        emailService.sendDoctorCredentialsEmail("to@test.com", "N", "p", "http://v");
    }

    @Test
    void sendAccountLockedEmail_swallowsErrors() {
        doThrow(new RuntimeException("fail")).when(mailSender).send(any(MimeMessage.class));
        emailService.sendAccountLockedEmail("to@test.com");
    }

    @Test
    void sendBackupCodesEmail_skipsWhenEmpty() {
        emailService.sendBackupCodesEmail("to@test.com", List.of());
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void sendBackupCodesEmail_sends() {
        emailService.sendBackupCodesEmail("to@test.com", List.of("CODE1"));
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendSimpleEmail_sendsSimpleMessage() {
        emailService.sendSimpleEmail("a@b.com", "S", "T");
        ArgumentCaptor<SimpleMailMessage> cap = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(cap.capture());
        assertThat(cap.getValue().getTo()).containsExactly("a@b.com");
    }

    @Test
    void sendHtmlEmail_invokesSend() {
        emailService.sendHtmlEmail("a@b.com", "sub", "<b>x</b>");
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendEmailWithAttachment_handlesMessagingException() throws Exception {
        doAnswer(inv -> {
            throw new jakarta.mail.MessagingException("x");
        }).when(mailSender).send(any(MimeMessage.class));
        emailService.sendEmailWithAttachment("a@b.com", "s", "h", new byte[]{1}, "f.pdf");
    }

    @Test
    void sendInvoiceEmail_delegatesToHtml() {
        emailService.sendInvoiceEmail("a@b.com", "INV-1", "P", "<p/>");
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendPaymentConfirmationEmail_delegates() {
        emailService.sendPaymentConfirmationEmail("a@b.com", "PAY", "100");
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendRefundEmail_delegates() {
        emailService.sendRefundEmail("a@b.com", "PAY", "50");
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendAppointmentConfirmationEmail_shortForm_delegates() {
        emailService.sendAppointmentConfirmationEmail(
                "a@b.com", "P", "C", "D", "Dr", "d", "t", "r", "clinic", "1", "addr");
        verify(mailSender).send(any(MimeMessage.class));
    }

    @Test
    void sendAppointmentConfirmationEmail_blankEmail_noSend() {
        emailService.sendAppointmentConfirmationEmail(
                "", "P", "C", "D", "Dr", "d", "t", "r", "clinic", "1", "addr",
                "100", "http://qr", "http://pay");
        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    void sendAppointmentConfirmationEmail_withPayment_delegates() {
        emailService.sendAppointmentConfirmationEmail(
                "a@b.com", "P", "C", "D", "Dr", "d", "t", "r", "clinic", "1", "addr",
                "100", "http://qr", "http://pay");
        verify(mailSender).send(any(MimeMessage.class));
    }
}
