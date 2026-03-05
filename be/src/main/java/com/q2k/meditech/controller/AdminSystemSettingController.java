package com.q2k.meditech.controller;

import com.q2k.meditech.dto.MessageDTO;
import com.q2k.meditech.dto.settings.*;
import com.q2k.meditech.service.SystemSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/settings")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "System Settings", description = "APIs for managing system settings (Admin only)")
public class AdminSystemSettingController {

    private final SystemSettingService systemSettingService;

    // ==================== GENERAL SETTINGS ====================

    @GetMapping("/general")
    @Operation(summary = "Get general settings", description = "Retrieve clinic information, contact, business hours, and regional settings")
    public ResponseEntity<GeneralSettingsDTO> getGeneralSettings() {
        return ResponseEntity.ok(systemSettingService.getGeneralSettings());
    }

    @PutMapping("/general")
    @Operation(summary = "Update general settings")
    public ResponseEntity<GeneralSettingsDTO> updateGeneralSettings(@RequestBody GeneralSettingsDTO dto) {
        return ResponseEntity.ok(systemSettingService.updateGeneralSettings(dto));
    }

    // ==================== APPOINTMENT SETTINGS ====================

    @GetMapping("/appointment")
    @Operation(summary = "Get appointment settings", description = "Retrieve booking rules, cancellation, rescheduling, and reminder settings")
    public ResponseEntity<AppointmentSettingsDTO> getAppointmentSettings() {
        return ResponseEntity.ok(systemSettingService.getAppointmentSettings());
    }

    @PutMapping("/appointment")
    @Operation(summary = "Update appointment settings")
    public ResponseEntity<AppointmentSettingsDTO> updateAppointmentSettings(@RequestBody AppointmentSettingsDTO dto) {
        return ResponseEntity.ok(systemSettingService.updateAppointmentSettings(dto));
    }

    // ==================== PAYMENT SETTINGS ====================

    @GetMapping("/payment")
    @Operation(summary = "Get payment settings", description = "Retrieve payment methods, gateway config, pricing, and invoice settings")
    public ResponseEntity<PaymentSettingsDTO> getPaymentSettings() {
        return ResponseEntity.ok(systemSettingService.getPaymentSettings());
    }

    @PutMapping("/payment")
    @Operation(summary = "Update payment settings")
    public ResponseEntity<PaymentSettingsDTO> updatePaymentSettings(@RequestBody PaymentSettingsDTO dto) {
        return ResponseEntity.ok(systemSettingService.updatePaymentSettings(dto));
    }

    @PostMapping("/payment/test-gateway")
    @Operation(summary = "Test payment gateway connection")
    public ResponseEntity<TestConnectionDTO> testPaymentGateway(@RequestParam String gatewayName) {
        return ResponseEntity.ok(systemSettingService.testPaymentGateway(gatewayName));
    }

    // ==================== NOTIFICATION SETTINGS ====================

    @GetMapping("/notification")
    @Operation(summary = "Get notification settings", description = "Retrieve email, SMS, and push notification configuration")
    public ResponseEntity<NotificationSettingsDTO> getNotificationSettings() {
        return ResponseEntity.ok(systemSettingService.getNotificationSettings());
    }

    @PutMapping("/notification")
    @Operation(summary = "Update notification settings")
    public ResponseEntity<NotificationSettingsDTO> updateNotificationSettings(@RequestBody NotificationSettingsDTO dto) {
        return ResponseEntity.ok(systemSettingService.updateNotificationSettings(dto));
    }

    @PostMapping("/notification/test-email")
    @Operation(summary = "Test email connection")
    public ResponseEntity<TestConnectionDTO> testEmailConnection() {
        return ResponseEntity.ok(systemSettingService.testEmailConnection());
    }

    @PostMapping("/notification/test-sms")
    @Operation(summary = "Test SMS connection")
    public ResponseEntity<TestConnectionDTO> testSmsConnection() {
        return ResponseEntity.ok(systemSettingService.testSmsConnection());
    }

    // ==================== SECURITY SETTINGS ====================

    @GetMapping("/security")
    @Operation(summary = "Get security settings", description = "Retrieve password policy, session, 2FA, lockout, and rate limiting settings")
    public ResponseEntity<SecuritySettingsDTO> getSecuritySettings() {
        return ResponseEntity.ok(systemSettingService.getSecuritySettings());
    }

    @PutMapping("/security")
    @Operation(summary = "Update security settings")
    public ResponseEntity<SecuritySettingsDTO> updateSecuritySettings(@RequestBody SecuritySettingsDTO dto) {
        return ResponseEntity.ok(systemSettingService.updateSecuritySettings(dto));
    }
}
