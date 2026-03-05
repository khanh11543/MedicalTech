package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.Payment;
import com.q2k.meditech.entity.enums.AppointmentStatus;
import com.q2k.meditech.exception.BadRequestException;
import com.q2k.meditech.repository.DoctorRepository;
import com.q2k.meditech.repository.PaymentRepository;
import com.q2k.meditech.repository.RefundRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of RevenueService for Revenue Analytics
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RevenueServiceImpl implements RevenueService {

    private final PaymentRepository paymentRepository;
    private final DoctorRepository doctorRepository;
    private final RefundRepository refundRepository;

    /**
     * Unwrap a single-row JPA aggregate result.
     * Some Hibernate/Spring Data versions return Object[][] instead of Object[],
     * so row[0] is itself an Object[] rather than a column value.
     */
    private static Object[] unwrapRow(Object[] row) {
        if (row != null && row.length > 0 && row[0] instanceof Object[]) {
            return (Object[]) row[0];
        }
        return row;
    }

    /**
     * Safely convert a JPA query result to BigDecimal.
     * Handles BigDecimal, Double, Long, Integer, etc.
     */
    private static BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return BigDecimal.ZERO;
    }

    @Override
    public RevenueSummaryDTO getRevenueSummary(String from, String to, Boolean compareWithPrevious) {
        log.info("Getting revenue summary - from: {}, to: {}, compare: {}", from, to, compareWithPrevious);

        LocalDate fromDate = parseRequiredDate(from, "from");
        LocalDate toDate = parseRequiredDate(to, "to");

        validateDateRange(fromDate, toDate);

        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);

        // Get main summary
        Object[] summary = unwrapRow(paymentRepository.getRevenueSummary(fromDateTime, toDateTime));
        Long totalTransactions = summary[0] != null ? ((Number) summary[0]).longValue() : 0L;
        BigDecimal totalRevenue = toBigDecimal(summary[1]);
        BigDecimal avgTransaction = toBigDecimal(summary[2]);

        // Get refund stats
        Object[] refundStats = unwrapRow(paymentRepository.getRefundStatsInDateRange(fromDateTime, toDateTime));
        Long refundCount = refundStats[0] != null ? ((Number) refundStats[0]).longValue() : 0L;
        BigDecimal totalRefunds = toBigDecimal(refundStats[1]);

        BigDecimal netRevenue = totalRevenue.subtract(totalRefunds);

        // Get pending stats
        BigDecimal pendingRevenue = paymentRepository.sumAmountByStatusInDateRange("PENDING", fromDateTime, toDateTime);
        BigDecimal failedAmount = paymentRepository.sumAmountByStatusInDateRange("FAILED", fromDateTime, toDateTime);

        // Calculate daily averages
        int totalDays = (int) ChronoUnit.DAYS.between(fromDate, toDate) + 1;
        BigDecimal dailyAvgRevenue = totalDays > 0 
                ? totalRevenue.divide(BigDecimal.valueOf(totalDays), 2, RoundingMode.HALF_UP) 
                : BigDecimal.ZERO;
        Double dailyAvgTransactions = totalDays > 0 
                ? totalTransactions.doubleValue() / totalDays 
                : 0.0;

        // Get peak day
        List<Object[]> peakDayData = paymentRepository.getPeakRevenueDay(fromDateTime, toDateTime);
        String peakRevenueDay = null;
        BigDecimal peakDayRevenue = BigDecimal.ZERO;
        if (!peakDayData.isEmpty()) {
            Object[] peak = peakDayData.get(0);
            if (peak[0] != null) {
                peakRevenueDay = peak[0].toString();
                peakDayRevenue = (BigDecimal) peak[1];
            }
        }

        RevenueSummaryDTO.RevenueSummaryDTOBuilder builder = RevenueSummaryDTO.builder()
                .totalRevenue(totalRevenue)
                .totalTransactions(totalTransactions)
                .averageTransactionValue(avgTransaction)
                .netRevenue(netRevenue)
                .totalRefunds(totalRefunds)
                .refundCount(refundCount)
                .completedRevenue(totalRevenue)
                .pendingRevenue(pendingRevenue != null ? pendingRevenue : BigDecimal.ZERO)
                .failedAmount(failedAmount != null ? failedAmount : BigDecimal.ZERO)
                .dailyAverageRevenue(dailyAvgRevenue)
                .dailyAverageTransactions(dailyAvgTransactions)
                .peakRevenueDay(peakRevenueDay)
                .peakDayRevenue(peakDayRevenue)
                .fromDate(from)
                .toDate(to)
                .totalDays(totalDays);

        // Compare with previous period if requested
        if (Boolean.TRUE.equals(compareWithPrevious)) {
            long daysDiff = ChronoUnit.DAYS.between(fromDate, toDate) + 1;
            LocalDate prevFromDate = fromDate.minusDays(daysDiff);
            LocalDate prevToDate = fromDate.minusDays(1);

            LocalDateTime prevFromDateTime = prevFromDate.atStartOfDay();
            LocalDateTime prevToDateTime = prevToDate.atTime(23, 59, 59);

            Object[] prevSummary = unwrapRow(paymentRepository.getRevenueSummary(prevFromDateTime, prevToDateTime));
            Long prevTransactions = prevSummary[0] != null ? ((Number) prevSummary[0]).longValue() : 0L;
            BigDecimal prevRevenue = toBigDecimal(prevSummary[1]);

            Double revenueGrowth = prevRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? totalRevenue.subtract(prevRevenue)
                            .divide(prevRevenue, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .doubleValue()
                    : (totalRevenue.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0);

            Double transactionGrowth = prevTransactions > 0
                    ? ((totalTransactions - prevTransactions) * 100.0 / prevTransactions)
                    : (totalTransactions > 0 ? 100.0 : 0.0);

            builder.previousPeriodRevenue(prevRevenue)
                    .revenueGrowthPercent(revenueGrowth)
                    .previousPeriodTransactions(prevTransactions)
                    .transactionGrowthPercent(transactionGrowth);
        }

        return builder.build();
    }

    @Override
    public List<DoctorRevenueDTO> getRevenueByDoctor(String from, String to, int top, String sortBy) {
        log.info("Getting revenue by doctor - from: {}, to: {}, top: {}, sortBy: {}", from, to, top, sortBy);

        LocalDate fromDate = parseRequiredDate(from, "from");
        LocalDate toDate = parseRequiredDate(to, "to");
        validateDateRange(fromDate, toDate);

        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);

        // Get revenue by doctor
        List<Object[]> revenueData = paymentRepository.getRevenueByDoctor(fromDateTime, toDateTime);

        // Get refund data by doctor
        List<Object[]> refundData = paymentRepository.getRefundByDoctor(fromDateTime, toDateTime);
        Map<Long, Object[]> refundMap = refundData.stream()
                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> r));

        // Get appointment counts
        List<Object[]> appointmentData = paymentRepository.getAppointmentCountByDoctor(fromDate, toDate);
        Map<Long, Object[]> appointmentMap = appointmentData.stream()
                .collect(Collectors.toMap(a -> ((Number) a[0]).longValue(), a -> a));

        // Calculate total revenue for percentage
        BigDecimal totalRevenue = revenueData.stream()
                .map(r -> toBigDecimal(r[4]))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<DoctorRevenueDTO> result = new ArrayList<>();
        int rank = 1;

        for (Object[] row : revenueData) {
            Long doctorId = ((Number) row[0]).longValue();
            String doctorName = (String) row[1];
            String specialization = (String) row[2];
            Long transactionCount = ((Number) row[3]).longValue();
            BigDecimal revenue = toBigDecimal(row[4]);
            BigDecimal avgFee = toBigDecimal(row[5]);

            // Get refund info
            BigDecimal refundAmount = BigDecimal.ZERO;
            Long refundCount = 0L;
            if (refundMap.containsKey(doctorId)) {
                Object[] refund = refundMap.get(doctorId);
                refundCount = ((Number) refund[1]).longValue();
                refundAmount = toBigDecimal(refund[2]);
            }

            BigDecimal netRevenue = revenue.subtract(refundAmount);

            // Get appointment info
            Long completedAppointments = 0L;
            Long cancelledAppointments = 0L;
            if (appointmentMap.containsKey(doctorId)) {
                Object[] appt = appointmentMap.get(doctorId);
                completedAppointments = appt[1] != null ? ((Number) appt[1]).longValue() : 0L;
                cancelledAppointments = appt[2] != null ? ((Number) appt[2]).longValue() : 0L;
            }

            Double percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? revenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            result.add(DoctorRevenueDTO.builder()
                    .doctorId(doctorId)
                    .doctorName(doctorName)
                    .specialization(specialization)
                    .totalRevenue(revenue)
                    .netRevenue(netRevenue)
                    .transactionCount(transactionCount)
                    .averageFee(avgFee)
                    .refundAmount(refundAmount)
                    .refundCount(refundCount)
                    .completedAppointments(completedAppointments)
                    .cancelledAppointments(cancelledAppointments)
                    .revenuePercentage(percentage)
                    .rank(rank++)
                    .build());
        }

        // Sort based on sortBy parameter
        Comparator<DoctorRevenueDTO> comparator = switch (sortBy.toLowerCase()) {
            case "transactioncount" -> Comparator.comparing(DoctorRevenueDTO::getTransactionCount).reversed();
            case "avgfee", "averagefee" -> Comparator.comparing(DoctorRevenueDTO::getAverageFee).reversed();
            default -> Comparator.comparing(DoctorRevenueDTO::getTotalRevenue).reversed();
        };

        return result.stream()
                .sorted(comparator)
                .limit(top)
                .collect(Collectors.toList());
    }

    @Override
    public PaymentMethodRevenueDTO getRevenueByPaymentMethod(String from, String to) {
        log.info("Getting revenue by payment method - from: {}, to: {}", from, to);

        LocalDate fromDate = parseRequiredDate(from, "from");
        LocalDate toDate = parseRequiredDate(to, "to");
        validateDateRange(fromDate, toDate);

        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);

        // Get data with status breakdown
        List<Object[]> data = paymentRepository.getRevenueByMethodWithStatus(fromDateTime, toDateTime);

        // Aggregate by method
        Map<String, Map<String, Object>> methodStats = new HashMap<>();

        for (Object[] row : data) {
            String method = row[0] != null ? (String) row[0] : "UNKNOWN";
            String status = (String) row[1];
            Long count = ((Number) row[2]).longValue();
            BigDecimal amount = toBigDecimal(row[3]);

            methodStats.computeIfAbsent(method, k -> {
                Map<String, Object> stats = new HashMap<>();
                stats.put("revenue", BigDecimal.ZERO);
                stats.put("totalCount", 0L);
                stats.put("successCount", 0L);
                stats.put("failedCount", 0L);
                return stats;
            });

            Map<String, Object> stats = methodStats.get(method);

            if ("PAID".equals(status)) {
                stats.put("revenue", ((BigDecimal) stats.get("revenue")).add(amount));
                stats.put("successCount", ((Long) stats.get("successCount")) + count);
            } else if ("FAILED".equals(status)) {
                stats.put("failedCount", ((Long) stats.get("failedCount")) + count);
            }
            stats.put("totalCount", ((Long) stats.get("totalCount")) + count);
        }

        // Calculate totals
        BigDecimal totalRevenue = methodStats.values().stream()
                .map(s -> (BigDecimal) s.get("revenue"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Long totalTransactions = methodStats.values().stream()
                .mapToLong(s -> (Long) s.get("successCount"))
                .sum();

        // Build method breakdowns
        List<PaymentMethodRevenueDTO.MethodBreakdown> methods = new ArrayList<>();

        for (Map.Entry<String, Map<String, Object>> entry : methodStats.entrySet()) {
            String method = entry.getKey();
            Map<String, Object> stats = entry.getValue();

            BigDecimal revenue = (BigDecimal) stats.get("revenue");
            Long successCount = (Long) stats.get("successCount");
            Long failedCount = (Long) stats.get("failedCount");
            Long totalCount = (Long) stats.get("totalCount");

            Double percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? revenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            BigDecimal avgAmount = successCount > 0
                    ? revenue.divide(BigDecimal.valueOf(successCount), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            Double successRate = totalCount > 0
                    ? (successCount.doubleValue() / totalCount.doubleValue()) * 100
                    : 0.0;

            methods.add(PaymentMethodRevenueDTO.MethodBreakdown.builder()
                    .method(method)
                    .displayName(getMethodDisplayName(method))
                    .revenue(revenue)
                    .transactionCount(successCount)
                    .percentage(percentage)
                    .averageAmount(avgAmount)
                    .successfulTransactions(successCount)
                    .failedTransactions(failedCount)
                    .successRate(successRate)
                    .build());
        }

        // Sort by revenue descending
        methods.sort(Comparator.comparing(PaymentMethodRevenueDTO.MethodBreakdown::getRevenue).reversed());

        return PaymentMethodRevenueDTO.builder()
                .totalRevenue(totalRevenue)
                .totalTransactions(totalTransactions)
                .methods(methods)
                .fromDate(from)
                .toDate(to)
                .build();
    }

    @Override
    public AppointmentTypeRevenueDTO getRevenueByAppointmentType(String from, String to) {
        log.info("Getting revenue by appointment type - from: {}, to: {}", from, to);

        LocalDate fromDate = parseRequiredDate(from, "from");
        LocalDate toDate = parseRequiredDate(to, "to");
        validateDateRange(fromDate, toDate);

        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);

        // Get revenue by appointment type (reason)
        List<Object[]> revenueData = paymentRepository.getRevenueByAppointmentType(fromDateTime, toDateTime);

        // Get appointment status counts
        List<Object[]> statusData = paymentRepository.getAppointmentStatusByType(fromDate, toDate);

        // Group status counts by type
        Map<String, Map<String, Long>> statusMap = new HashMap<>();
        for (Object[] row : statusData) {
            String type = row[0] != null ? (String) row[0] : "OTHER";
            AppointmentStatus status = (AppointmentStatus) row[1];
            Long count = ((Number) row[2]).longValue();

            statusMap.computeIfAbsent(type, k -> new HashMap<>());
            statusMap.get(type).put(status.name(), count);
        }

        // Calculate totals
        BigDecimal totalRevenue = revenueData.stream()
                .map(r -> toBigDecimal(r[2]))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Long totalAppointments = revenueData.stream()
                .mapToLong(r -> ((Number) r[1]).longValue())
                .sum();

        // Build type breakdowns
        List<AppointmentTypeRevenueDTO.TypeBreakdown> types = new ArrayList<>();

        for (Object[] row : revenueData) {
            String type = row[0] != null ? (String) row[0] : "OTHER";
            Long count = ((Number) row[1]).longValue();
            BigDecimal revenue = toBigDecimal(row[2]);
            BigDecimal avgFee = toBigDecimal(row[3]);

            Double percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? revenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0.0;

            // Get status counts
            Long completedCount = 0L;
            Long cancelledCount = 0L;
            if (statusMap.containsKey(type)) {
                Map<String, Long> counts = statusMap.get(type);
                completedCount = counts.getOrDefault("COMPLETED", 0L);
                cancelledCount = counts.getOrDefault("CANCELLED", 0L);
            }

            Long totalTypeCount = completedCount + cancelledCount;
            Double completionRate = totalTypeCount > 0
                    ? (completedCount.doubleValue() / totalTypeCount.doubleValue()) * 100
                    : 0.0;

            types.add(AppointmentTypeRevenueDTO.TypeBreakdown.builder()
                    .appointmentType(type)
                    .displayName(type != null ? type : "Other")
                    .revenue(revenue)
                    .appointmentCount(count)
                    .percentage(percentage)
                    .averageFee(avgFee)
                    .completedCount(completedCount)
                    .cancelledCount(cancelledCount)
                    .completionRate(completionRate)
                    .build());
        }

        // Sort by revenue descending
        types.sort(Comparator.comparing(AppointmentTypeRevenueDTO.TypeBreakdown::getRevenue).reversed());

        return AppointmentTypeRevenueDTO.builder()
                .totalRevenue(totalRevenue)
                .totalAppointments(totalAppointments)
                .types(types)
                .fromDate(from)
                .toDate(to)
                .build();
    }

    @Override
    public RevenueChartDTO getRevenueChartData(String from, String to, String groupBy, Long doctorId) {
        log.info("Getting revenue chart data - from: {}, to: {}, groupBy: {}, doctorId: {}", 
                from, to, groupBy, doctorId);

        LocalDate fromDate = parseRequiredDate(from, "from");
        LocalDate toDate = parseRequiredDate(to, "to");
        validateDateRange(fromDate, toDate);

        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);

        // Get daily revenue data
        List<Object[]> revenueData = paymentRepository.getDailyRevenue(fromDateTime, toDateTime, doctorId);
        List<Object[]> refundData = paymentRepository.getDailyRefunds(fromDateTime, toDateTime, doctorId);

        // Build refund map by date
        Map<String, BigDecimal> refundMap = new HashMap<>();
        for (Object[] row : refundData) {
            String date = row[0].toString();
            BigDecimal amount = toBigDecimal(row[2]);
            refundMap.put(date, amount);
        }

        // Group data based on groupBy parameter
        Map<String, RevenueChartDTO.DataPoint> dataPointMap = new LinkedHashMap<>();

        for (Object[] row : revenueData) {
            String dateStr = row[0].toString();
            LocalDate date = LocalDate.parse(dateStr);
            Long count = ((Number) row[1]).longValue();
            BigDecimal revenue = toBigDecimal(row[2]);

            String periodKey = getPeriodKey(date, groupBy);
            String label = getPeriodLabel(date, groupBy);

            dataPointMap.computeIfAbsent(periodKey, k -> RevenueChartDTO.DataPoint.builder()
                    .period(periodKey)
                    .label(label)
                    .revenue(BigDecimal.ZERO)
                    .transactionCount(0L)
                    .refundAmount(BigDecimal.ZERO)
                    .netRevenue(BigDecimal.ZERO)
                    .build());

            RevenueChartDTO.DataPoint point = dataPointMap.get(periodKey);
            point.setRevenue(point.getRevenue().add(revenue));
            point.setTransactionCount(point.getTransactionCount() + count);

            // Add refund if exists
            BigDecimal dayRefund = refundMap.getOrDefault(dateStr, BigDecimal.ZERO);
            point.setRefundAmount(point.getRefundAmount().add(dayRefund));
            point.setNetRevenue(point.getRevenue().subtract(point.getRefundAmount()));
        }

        // Calculate totals
        List<RevenueChartDTO.DataPoint> dataPoints = new ArrayList<>(dataPointMap.values());

        BigDecimal totalRevenue = dataPoints.stream()
                .map(RevenueChartDTO.DataPoint::getRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Long totalTransactions = dataPoints.stream()
                .mapToLong(RevenueChartDTO.DataPoint::getTransactionCount)
                .sum();

        BigDecimal avgRevenue = !dataPoints.isEmpty()
                ? totalRevenue.divide(BigDecimal.valueOf(dataPoints.size()), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Get doctor name if filtered
        String doctorName = null;
        if (doctorId != null) {
            doctorName = doctorRepository.findById(doctorId)
                    .map(d -> d.getUser().getFullName())
                    .orElse(null);
        }

        return RevenueChartDTO.builder()
                .totalRevenue(totalRevenue)
                .totalTransactions(totalTransactions)
                .averageRevenue(avgRevenue)
                .dataPoints(dataPoints)
                .groupBy(groupBy)
                .fromDate(from)
                .toDate(to)
                .doctorId(doctorId)
                .doctorName(doctorName)
                .build();
    }

    @Override
    public byte[] exportRevenueReport(String from, String to, String format, Boolean includeCharts) {
        log.info("Exporting revenue report - from: {}, to: {}, format: {}", from, to, format);

        // Get all the data
        RevenueSummaryDTO summary = getRevenueSummary(from, to, true);
        List<DoctorRevenueDTO> doctorRevenue = getRevenueByDoctor(from, to, 20, "totalRevenue");
        PaymentMethodRevenueDTO methodRevenue = getRevenueByPaymentMethod(from, to);
        AppointmentTypeRevenueDTO typeRevenue = getRevenueByAppointmentType(from, to);

        if ("EXCEL".equalsIgnoreCase(format)) {
            return generateExcelReport(summary, doctorRevenue, methodRevenue, typeRevenue);
        } else {
            return generatePdfReport(summary, doctorRevenue, methodRevenue, typeRevenue, includeCharts);
        }
    }

    // ========== HELPER METHODS ==========

    // ==================== Refund Analysis ====================

    @Override
    public RefundAnalysisDTO getRefundAnalysis(String from, String to) {
        log.info("Getting refund analysis - from: {}, to: {}", from, to);

        LocalDate fromDate = parseRequiredDate(from, "from");
        LocalDate toDate = parseRequiredDate(to, "to");
        validateDateRange(fromDate, toDate);

        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toDateTime = toDate.atTime(23, 59, 59);

        // Total completed refunds
        Long refundCount = refundRepository.countCompletedInDateRange(fromDateTime, toDateTime);
        BigDecimal totalRefunded = refundRepository.sumCompletedRefundAmountInDateRange(fromDateTime, toDateTime);

        BigDecimal avgRefund = refundCount > 0
                ? totalRefunded.divide(BigDecimal.valueOf(refundCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Refund rate = refundCount / completedPayments * 100
        Long completedPayments = paymentRepository.countCompletedInDateRange(fromDateTime, toDateTime);
        Double refundRate = completedPayments > 0
                ? (refundCount.doubleValue() / completedPayments.doubleValue()) * 100
                : 0.0;

        // Reason distribution
        List<Object[]> reasonData = refundRepository.getRefundByReasonInDateRange(fromDateTime, toDateTime);
        List<RefundAnalysisDTO.ReasonBreakdown> reasons = new ArrayList<>();
        for (Object[] row : reasonData) {
            String reason = row[0] != null ? (String) row[0] : "UNKNOWN";
            Long count = ((Number) row[1]).longValue();
            BigDecimal amount = toBigDecimal(row[2]);
            Double percentage = refundCount > 0 ? (count.doubleValue() / refundCount.doubleValue()) * 100 : 0.0;

            reasons.add(RefundAnalysisDTO.ReasonBreakdown.builder()
                    .reason(reason)
                    .count(count)
                    .amount(amount)
                    .percentage(percentage)
                    .build());
        }

        // Daily refund trend
        List<Object[]> dailyRefundData = refundRepository.getDailyRefundTrend(fromDateTime, toDateTime);
        List<RefundAnalysisDTO.TrendPoint> trendData = new ArrayList<>();
        for (Object[] row : dailyRefundData) {
            String date = row[0].toString();
            Long count = ((Number) row[1]).longValue();
            BigDecimal amount = toBigDecimal(row[2]);

            trendData.add(RefundAnalysisDTO.TrendPoint.builder()
                    .date(date)
                    .count(count)
                    .amount(amount)
                    .build());
        }

        // Refund rate trend (per day)
        List<Object[]> dailyPaidData = paymentRepository.countPaidPerDayInDateRange(fromDateTime, toDateTime);
        Map<String, Long> paidPerDay = new LinkedHashMap<>();
        for (Object[] row : dailyPaidData) {
            paidPerDay.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        Map<String, Long> refundsPerDay = new LinkedHashMap<>();
        for (RefundAnalysisDTO.TrendPoint tp : trendData) {
            refundsPerDay.put(tp.getDate(), tp.getCount());
        }

        List<RefundAnalysisDTO.RateTrendPoint> rateTrend = new ArrayList<>();
        for (Map.Entry<String, Long> entry : paidPerDay.entrySet()) {
            String date = entry.getKey();
            Long paidCount = entry.getValue();
            Long dayRefunds = refundsPerDay.getOrDefault(date, 0L);
            Double rate = paidCount > 0 ? (dayRefunds.doubleValue() / paidCount.doubleValue()) * 100 : 0.0;

            rateTrend.add(RefundAnalysisDTO.RateTrendPoint.builder()
                    .date(date)
                    .rate(rate)
                    .completedCount(paidCount)
                    .refundCount(dayRefunds)
                    .build());
        }

        return RefundAnalysisDTO.builder()
                .totalRefunded(totalRefunded)
                .refundCount(refundCount)
                .averageRefundAmount(avgRefund)
                .refundRate(refundRate)
                .reasonDistribution(reasons)
                .trendData(trendData)
                .refundRateTrend(rateTrend)
                .fromDate(from)
                .toDate(to)
                .build();
    }

    // ==================== Drill-Down Transactions ====================

    @Override
    public Page<DrillDownTransactionDTO> getDrillDownTransactions(
            String from, String to,
            String date, String method, Long doctorId, String appointmentType,
            int page, int size) {
        log.info("Getting drill-down transactions - from: {}, to: {}, date: {}, method: {}, doctorId: {}, type: {}",
                from, to, date, method, doctorId, appointmentType);

        LocalDate fromDate = parseRequiredDate(from, "from");
        LocalDate toDate = parseRequiredDate(to, "to");
        validateDateRange(fromDate, toDate);

        // If specific date is provided, narrow range to that day
        LocalDateTime fromDateTime;
        LocalDateTime toDateTime;
        if (date != null && !date.isEmpty()) {
            LocalDate specificDate = LocalDate.parse(date);
            fromDateTime = specificDate.atStartOfDay();
            toDateTime = specificDate.atTime(23, 59, 59);
        } else {
            fromDateTime = fromDate.atStartOfDay();
            toDateTime = toDate.atTime(23, 59, 59);
        }

        Pageable pageable = PageRequest.of(page, size);

        Page<Payment> payments = paymentRepository.findForDrillDown(
                fromDateTime, toDateTime, method, doctorId, appointmentType, pageable);

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

        return payments.map(p -> {
            String patientName = "";
            String docName = "";
            String apptType = "";

            try {
                if (p.getPatient() != null && p.getPatient().getUser() != null) {
                    patientName = p.getPatient().getUser().getFullName();
                }
            } catch (Exception ignored) {}

            try {
                if (p.getAppointment() != null && p.getAppointment().getDoctor() != null
                        && p.getAppointment().getDoctor().getUser() != null) {
                    docName = p.getAppointment().getDoctor().getUser().getFullName();
                }
            } catch (Exception ignored) {}

            try {
                if (p.getAppointment() != null) {
                    apptType = p.getAppointment().getReasonForVisit();
                }
            } catch (Exception ignored) {}

            return DrillDownTransactionDTO.builder()
                    .id(p.getId())
                    .transactionCode(p.getPaymentCode())
                    .paymentDate(p.getPaidAt() != null ? p.getPaidAt().format(dtf) : "")
                    .patientName(patientName)
                    .doctorName(docName)
                    .amount(p.getTotalAmount())
                    .paymentMethod(p.getPaymentMethod())
                    .status(p.getPaymentStatus())
                    .appointmentType(apptType != null ? apptType : "")
                    .build();
        });
    }

    // ==================== Helper methods ====================

    private LocalDate parseRequiredDate(String dateStr, String fieldName) {
        if (dateStr == null || dateStr.isEmpty()) {
            throw new BadRequestException(fieldName + " date is required");
        }
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            throw new BadRequestException("Invalid " + fieldName + " date format: " + dateStr + ". Expected: yyyy-MM-dd");
        }
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new BadRequestException("From date cannot be after to date");
        }
        if (ChronoUnit.DAYS.between(from, to) > 365) {
            throw new BadRequestException("Date range cannot exceed 365 days");
        }
    }

    private String getMethodDisplayName(String method) {
        if (method == null) return "Unknown";
        return switch (method.toUpperCase()) {
            case "CASH" -> "Cash";
            case "MOMO" -> "MoMo";
            case "VNPAY" -> "VNPay";
            case "ZALOPAY" -> "ZaloPay";
            case "BANK_TRANSFER" -> "Bank Transfer";
            case "CARD" -> "Credit/Debit Card";
            case "INSURANCE" -> "Insurance";
            default -> method;
        };
    }

    private String getPeriodKey(LocalDate date, String groupBy) {
        return switch (groupBy.toUpperCase()) {
            case "WEEK" -> {
                WeekFields weekFields = WeekFields.of(Locale.getDefault());
                int weekNumber = date.get(weekFields.weekOfWeekBasedYear());
                yield date.getYear() + "-W" + String.format("%02d", weekNumber);
            }
            case "MONTH" -> date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            default -> date.toString();
        };
    }

    private String getPeriodLabel(LocalDate date, String groupBy) {
        return switch (groupBy.toUpperCase()) {
            case "WEEK" -> {
                WeekFields weekFields = WeekFields.of(Locale.getDefault());
                int weekNumber = date.get(weekFields.weekOfWeekBasedYear());
                yield "Week " + weekNumber + ", " + date.getYear();
            }
            case "MONTH" -> date.format(DateTimeFormatter.ofPattern("MMM yyyy"));
            default -> date.format(DateTimeFormatter.ofPattern("dd/MM"));
        };
    }

    private byte[] generateExcelReport(RevenueSummaryDTO summary, List<DoctorRevenueDTO> doctors,
                                        PaymentMethodRevenueDTO methods, AppointmentTypeRevenueDTO types) {
        StringBuilder sb = new StringBuilder();
        
        // Header
        sb.append("REVENUE REPORT\n");
        sb.append("Period: ").append(summary.getFromDate()).append(" to ").append(summary.getToDate()).append("\n\n");
        
        // Summary Section
        sb.append("=== SUMMARY ===\n");
        sb.append("Total Revenue,").append(summary.getTotalRevenue()).append("\n");
        sb.append("Total Transactions,").append(summary.getTotalTransactions()).append("\n");
        sb.append("Average Transaction,").append(summary.getAverageTransactionValue()).append("\n");
        sb.append("Net Revenue,").append(summary.getNetRevenue()).append("\n");
        sb.append("Total Refunds,").append(summary.getTotalRefunds()).append("\n");
        sb.append("Daily Average,").append(summary.getDailyAverageRevenue()).append("\n\n");
        
        // Doctor Revenue Section
        sb.append("=== REVENUE BY DOCTOR ===\n");
        sb.append("Rank,Doctor Name,Specialization,Total Revenue,Transaction Count,Average Fee\n");
        for (DoctorRevenueDTO doc : doctors) {
            sb.append(doc.getRank()).append(",");
            sb.append(doc.getDoctorName()).append(",");
            sb.append(doc.getSpecialization()).append(",");
            sb.append(doc.getTotalRevenue()).append(",");
            sb.append(doc.getTransactionCount()).append(",");
            sb.append(doc.getAverageFee()).append("\n");
        }
        sb.append("\n");
        
        // Payment Method Section
        sb.append("=== REVENUE BY PAYMENT METHOD ===\n");
        sb.append("Method,Revenue,Transactions,Percentage,Success Rate\n");
        for (PaymentMethodRevenueDTO.MethodBreakdown method : methods.getMethods()) {
            sb.append(method.getDisplayName()).append(",");
            sb.append(method.getRevenue()).append(",");
            sb.append(method.getTransactionCount()).append(",");
            sb.append(String.format("%.2f%%", method.getPercentage())).append(",");
            sb.append(String.format("%.2f%%", method.getSuccessRate())).append("\n");
        }
        sb.append("\n");
        
        // Appointment Type Section
        sb.append("=== REVENUE BY APPOINTMENT TYPE ===\n");
        sb.append("Type,Revenue,Count,Percentage,Completion Rate\n");
        for (AppointmentTypeRevenueDTO.TypeBreakdown type : types.getTypes()) {
            sb.append(type.getDisplayName()).append(",");
            sb.append(type.getRevenue()).append(",");
            sb.append(type.getAppointmentCount()).append(",");
            sb.append(String.format("%.2f%%", type.getPercentage())).append(",");
            sb.append(String.format("%.2f%%", type.getCompletionRate())).append("\n");
        }
        
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private byte[] generatePdfReport(RevenueSummaryDTO summary, List<DoctorRevenueDTO> doctors,
                                      PaymentMethodRevenueDTO methods, AppointmentTypeRevenueDTO types,
                                      Boolean includeCharts) {
        StringBuilder sb = new StringBuilder();
        
        sb.append("=".repeat(60)).append("\n");
        sb.append("                    REVENUE REPORT\n");
        sb.append("=".repeat(60)).append("\n\n");
        
        sb.append("Report Period: ").append(summary.getFromDate()).append(" to ").append(summary.getToDate()).append("\n");
        sb.append("Generated: ").append(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))).append("\n\n");
        
        // Summary
        sb.append("-".repeat(60)).append("\n");
        sb.append("REVENUE SUMMARY\n");
        sb.append("-".repeat(60)).append("\n");
        sb.append(String.format("%-30s %,20.0f VND\n", "Total Revenue:", summary.getTotalRevenue().doubleValue()));
        sb.append(String.format("%-30s %,20d\n", "Total Transactions:", summary.getTotalTransactions()));
        sb.append(String.format("%-30s %,20.0f VND\n", "Average Transaction:", summary.getAverageTransactionValue().doubleValue()));
        sb.append(String.format("%-30s %,20.0f VND\n", "Net Revenue:", summary.getNetRevenue().doubleValue()));
        sb.append(String.format("%-30s %,20.0f VND\n", "Total Refunds:", summary.getTotalRefunds().doubleValue()));
        sb.append(String.format("%-30s %,20.0f VND\n", "Daily Average:", summary.getDailyAverageRevenue().doubleValue()));
        
        if (summary.getRevenueGrowthPercent() != null) {
            sb.append(String.format("%-30s %19.2f%%\n", "Growth vs Previous Period:", summary.getRevenueGrowthPercent()));
        }
        sb.append("\n");
        
        // Top Doctors
        sb.append("-".repeat(60)).append("\n");
        sb.append("TOP PERFORMING DOCTORS\n");
        sb.append("-".repeat(60)).append("\n");
        for (int i = 0; i < Math.min(10, doctors.size()); i++) {
            DoctorRevenueDTO doc = doctors.get(i);
            sb.append(String.format("%d. %-25s %,15.0f VND (%d transactions)\n",
                    doc.getRank(), doc.getDoctorName(), doc.getTotalRevenue().doubleValue(), doc.getTransactionCount()));
        }
        sb.append("\n");
        
        // Payment Methods
        sb.append("-".repeat(60)).append("\n");
        sb.append("REVENUE BY PAYMENT METHOD\n");
        sb.append("-".repeat(60)).append("\n");
        for (PaymentMethodRevenueDTO.MethodBreakdown method : methods.getMethods()) {
            sb.append(String.format("%-15s %,15.0f VND (%5.1f%%)\n",
                    method.getDisplayName(), method.getRevenue().doubleValue(), method.getPercentage()));
        }
        sb.append("\n");
        
        // Appointment Types
        sb.append("-".repeat(60)).append("\n");
        sb.append("REVENUE BY APPOINTMENT TYPE\n");
        sb.append("-".repeat(60)).append("\n");
        for (AppointmentTypeRevenueDTO.TypeBreakdown type : types.getTypes()) {
            sb.append(String.format("%-20s %,15.0f VND (%5.1f%%)\n",
                    type.getDisplayName(), type.getRevenue().doubleValue(), type.getPercentage()));
        }
        
        sb.append("\n").append("=".repeat(60)).append("\n");
        sb.append("                    END OF REPORT\n");
        sb.append("=".repeat(60)).append("\n");
        
        return sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
}
