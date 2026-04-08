package com.q2k.meditech.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.settings.*;
import com.q2k.meditech.entity.SystemSetting;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.repository.SystemSettingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemSettingServiceImplTest {

    @Mock
    private SystemSettingRepository systemSettingRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private SystemSettingServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new SystemSettingServiceImpl(systemSettingRepository, objectMapper);
    }

    @Test
    void getGeneralSettings_returnsDefaultWhenMissing() {
        when(systemSettingRepository.findBySettingKey("general")).thenReturn(Optional.empty());
        GeneralSettingsDTO g = service.getGeneralSettings();
        assertThat(g.getClinicName()).isEqualTo("MedicalTech Clinic");
    }

    @Test
    void updateGeneralSettings_persistsJson() {
        GeneralSettingsDTO dto = GeneralSettingsDTO.builder().clinicName("X").tagline("").email("").phone("")
                .country("VN").timezone("UTC").language("en").dateFormat("DD/MM/YYYY").timeFormat("24h")
                .businessHours(new ArrayList<>()).build();
        when(systemSettingRepository.findBySettingKey("general")).thenReturn(Optional.empty());
        when(systemSettingRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        assertThat(service.updateGeneralSettings(dto)).isEqualTo(dto);
        verify(systemSettingRepository).save(argThat(s -> s.getSettingKey().equals("general")));
    }

    @Test
    void getAppointmentSettings_roundTrip() throws Exception {
        AppointmentSettingsDTO dto = AppointmentSettingsDTO.builder()
                .maxAdvanceBookingDays(30).defaultDurationMinutes(30).allowSameDayBooking(true)
                .requireConfirmation(true).enableCancellationPolicy(true).cancellationDeadlineHours(24)
                .cancellationFeeType("none").cancellationFeeAmount(0).cancellationApplyTo("all")
                .enableReschedulingPolicy(true).maxReschedules(3).reschedulingDeadlineHours(12)
                .noShowAfterMinutes(15).noShowFee(0).blockAfterNoShows(3)
                .emailReminderEnabled(true).emailReminderHoursBefore(24)
                .smsReminderEnabled(false).smsReminderHoursBefore(2)
                .pushReminderEnabled(false).pushReminderHoursBefore(1)
                .build();
        String json = objectMapper.writeValueAsString(dto);
        when(systemSettingRepository.findBySettingKey("appointment"))
                .thenReturn(Optional.of(SystemSetting.builder().settingKey("appointment").settingValue(json).build()));

        assertThat(service.getAppointmentSettings().getMaxAdvanceBookingDays()).isEqualTo(30);
    }

    @Test
    void updateAppointmentSettings_invalidDuration_throws() {
        AppointmentSettingsDTO dto = AppointmentSettingsDTO.builder()
                .maxAdvanceBookingDays(30).defaultDurationMinutes(1).allowSameDayBooking(true)
                .requireConfirmation(true).enableCancellationPolicy(false).cancellationDeadlineHours(0)
                .cancellationFeeType("none").cancellationFeeAmount(0).cancellationApplyTo("all")
                .enableReschedulingPolicy(true).maxReschedules(3).reschedulingDeadlineHours(12)
                .noShowAfterMinutes(15).noShowFee(0).blockAfterNoShows(3)
                .emailReminderEnabled(true).emailReminderHoursBefore(24)
                .smsReminderEnabled(false).smsReminderHoursBefore(2)
                .pushReminderEnabled(false).pushReminderHoursBefore(1)
                .build();
        assertThatThrownBy(() -> service.updateAppointmentSettings(dto)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void updatePaymentSettings_saves() {
        PaymentSettingsDTO dto = PaymentSettingsDTO.builder()
                .cashEnabled(true).cardEnabled(false).bankTransferEnabled(false).insuranceEnabled(false)
                .momoEnabled(false).zalopayEnabled(false).vnpayEnabled(false).gateways(new ArrayList<>())
                .taxRate(10.0).transactionFeePayor("clinic").transactionFeePercent(0).currency("VND")
                .enableRefundPolicy(true).refundProcessingDays(7).refundToOriginalMethod(true)
                .refundToBankTransfer(true).refundToCredit(false).allowPartialRefund(true).refundFeePercent(0)
                .autoGenerateInvoice(true).invoicePrefix("INV").invoiceNumberFormat("sequential")
                .includeTaxOnInvoice(true).invoiceFooterText("")
                .build();
        when(systemSettingRepository.findBySettingKey("payment")).thenReturn(Optional.empty());
        when(systemSettingRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        assertThat(service.updatePaymentSettings(dto)).isEqualTo(dto);
    }

    @Test
    void testPaymentGateway_noGateways() {
        when(systemSettingRepository.findBySettingKey("payment")).thenReturn(Optional.empty());
        TestConnectionDTO r = service.testPaymentGateway("MOMO");
        assertThat(r.isSuccess()).isFalse();
    }

    @Test
    void testEmailConnection_noSmtpHost() {
        when(systemSettingRepository.findBySettingKey("notification")).thenReturn(Optional.empty());
        TestConnectionDTO r = service.testEmailConnection();
        assertThat(r.isSuccess()).isFalse();
    }

    @Test
    void testSmsConnection_noProvider() {
        when(systemSettingRepository.findBySettingKey("notification")).thenReturn(Optional.empty());
        TestConnectionDTO r = service.testSmsConnection();
        assertThat(r.isSuccess()).isFalse();
    }

    @Test
    void updateNotificationSettings_saves() {
        NotificationSettingsDTO dto = NotificationSettingsDTO.builder()
                .emailProvider("smtp").smtpHost("h").smtpPort(587).smtpEncryption("tls")
                .smsProvider("").pushEnabled(false)
                .emailNewUserRegistration(true).emailNewAppointment(true).emailPaymentReceived(true)
                .emailSystemAlerts(true).emailDailyReport(false)
                .smsAppointmentConfirmation(true).smsAppointmentReminder(true).smsPaymentConfirmation(false)
                .pushNewAppointment(true).pushAppointmentReminder(true).pushPaymentReceived(true)
                .build();
        when(systemSettingRepository.findBySettingKey("notification")).thenReturn(Optional.empty());
        when(systemSettingRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        assertThat(service.updateNotificationSettings(dto)).isEqualTo(dto);
    }

    @Test
    void updateSecuritySettings_invalidPasswordLength_throws() {
        SecuritySettingsDTO dto = SecuritySettingsDTO.builder()
                .minPasswordLength(3).passwordExpirationDays(90).passwordHistoryCount(5)
                .requireUppercase(true).requireLowercase(true).requireNumbers(true).requireSpecialChars(true)
                .sessionTimeoutMinutes(30).maxConcurrentSessions(3).enableRememberMe(true)
                .forceLogoutOnPasswordChange(true).require2faForAdmins(true).require2faForDoctors(false)
                .allow2faForPatients(true).enable2faAuthenticator(true).enable2faSms(true).enable2faEmail(true)
                .enableAccountLockout(true).maxFailedAttempts(5).lockoutDurationMinutes(30)
                .autoUnlockAfterDuration(true).enableRateLimiting(true).apiRateLimit(100)
                .rateLimitScope("ip").loginRateLimit(5).rateLimitAction("block")
                .encryptSensitiveData(true).encryptBackups(true).forceHttps(true).enableHsts(true)
                .build();
        assertThatThrownBy(() -> service.updateSecuritySettings(dto)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void getSecuritySettings_defaultWhenMissing() {
        when(systemSettingRepository.findBySettingKey("security")).thenReturn(Optional.empty());
        assertThat(service.getSecuritySettings().getMinPasswordLength()).isEqualTo(8);
    }
}
