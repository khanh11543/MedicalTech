package com.q2k.meditech.service;

import com.q2k.meditech.dto.receptionist.DailyAppointmentReportDTO;
import com.q2k.meditech.dto.receptionist.DailyRevenueReportDTO;
import com.q2k.meditech.dto.receptionist.QueuePerformanceReportDTO;

import java.time.LocalDate;

/**
 * Service for Receptionist Reports (Tab 6).
 * Scope: daily operational data only — no system-wide or cross-branch access.
 */
public interface ReceptionistReportService {

    // ==================== 6.1 Daily Appointments Report ====================

    /**
     * Generate the daily appointments report for a given date.
     * Optionally filtered by doctor.
     *
     * @param date     target date (defaults to today if null)
     * @param doctorId optional doctor filter (null = all doctors)
     * @return report data with summary + detailed appointment list
     */
    DailyAppointmentReportDTO getDailyAppointmentReport(LocalDate date, Long doctorId);

    // ==================== 6.2 Daily Revenue Summary ====================

    /**
     * Generate the daily revenue summary for a given date.
     * Includes transaction list, pending list, and cash drawer balance.
     *
     * @param date target date (defaults to today if null)
     * @return revenue report
     */
    DailyRevenueReportDTO getDailyRevenueReport(LocalDate date);

    // ==================== 6.3 Queue Performance (Today Only) ====================

    /**
     * Generate queue performance metrics for today.
     * Always uses today's date — no date parameter.
     *
     * @return queue performance report
     */
    QueuePerformanceReportDTO getQueuePerformanceReport();
}
