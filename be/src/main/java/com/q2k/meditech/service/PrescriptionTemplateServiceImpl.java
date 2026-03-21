package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.PrescriptionMapper;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.PrescriptionStatus;
import com.q2k.meditech.exception.AppException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PrescriptionTemplateServiceImpl implements PrescriptionTemplateService {

    private final PrescriptionRepository prescriptionRepository;
    private final PrescriptionTemplateRepository prescriptionTemplateRepository;
    private final DoctorRepository doctorRepository;
    private final PrescriptionMapper prescriptionMapper;

    // ==================== ADMIN ANALYTICS ====================

    @Override
    public TemplateStatsDTO getTemplateStatistics(LocalDate from, LocalDate to) {
        log.info("Fetching prescription statistics from {} to {}", from, to);

        List<Prescription> prescriptions;
        long totalPatients;
        long totalDoctors;

        if (from != null && to != null) {
            prescriptions = prescriptionRepository.findByPrescriptionDateBetween(from, to);
            totalPatients = prescriptionRepository.countDistinctPatientsByDateRange(from, to);
            totalDoctors = prescriptionRepository.countDistinctDoctorsByDateRange(from, to);
        } else {
            prescriptions = prescriptionRepository.findAll();
            totalPatients = prescriptionRepository.countDistinctPatients();
            totalDoctors = prescriptionRepository.countDistinctDoctors();
        }

        long totalPrescriptions = prescriptions.size();
        long activePrescriptions = prescriptions.stream()
                .filter(p -> p.getStatus() == PrescriptionStatus.ACTIVE ||
                        (p.getStatus() == null && Boolean.TRUE.equals(p.getIsActive())))
                .count();
        long expiredPrescriptions = prescriptions.stream()
                .filter(p -> p.getStatus() == PrescriptionStatus.EXPIRED ||
                        (p.getStatus() == null && Boolean.FALSE.equals(p.getIsActive())))
                .count();

        // Count total unique medications used
        long totalMedicationsUsed = prescriptions.stream()
                .flatMap(p -> p.getItems().stream())
                .map(PrescriptionItem::getMedicineName)
                .distinct()
                .count();

        // Average medications per prescription
        long avgMedications = totalPrescriptions > 0
                ? prescriptions.stream().mapToLong(p -> p.getItems().size()).sum() / totalPrescriptions
                : 0;

        // Growth rate: compare current period vs previous period of equal length
        Double growthRate = null;
        if (from != null && to != null) {
            long daysBetween = ChronoUnit.DAYS.between(from, to);
            LocalDate prevFrom = from.minusDays(daysBetween);
            LocalDate prevTo = from.minusDays(1);
            List<Prescription> prevPrescriptions = prescriptionRepository.findByPrescriptionDateBetween(prevFrom, prevTo);
            if (!prevPrescriptions.isEmpty()) {
                growthRate = ((double) totalPrescriptions - prevPrescriptions.size()) / prevPrescriptions.size() * 100;
            }
        }

        // Most active doctor
        String mostActiveDoctorName = null;
        Long mostActiveDoctorCount = 0L;
        Map<Long, List<Prescription>> byDoctor = prescriptions.stream()
                .collect(Collectors.groupingBy(p -> p.getDoctor().getId()));
        for (Map.Entry<Long, List<Prescription>> entry : byDoctor.entrySet()) {
            if (entry.getValue().size() > mostActiveDoctorCount) {
                mostActiveDoctorCount = (long) entry.getValue().size();
                mostActiveDoctorName = entry.getValue().get(0).getDoctor().getFullName();
            }
        }

        return TemplateStatsDTO.builder()
                .totalPrescriptions(totalPrescriptions)
                .totalDoctors(totalDoctors)
                .totalPatients(totalPatients)
                .totalMedicationsUsed(totalMedicationsUsed)
                .averageMedicationsPerPrescription(avgMedications)
                .periodStart(from)
                .periodEnd(to)
                .activePrescriptions(activePrescriptions)
                .expiredPrescriptions(expiredPrescriptions)
                .prescriptionGrowthRate(growthRate)
                .mostActiveDoctorName(mostActiveDoctorName)
                .mostActiveDoctorPrescriptionCount(mostActiveDoctorCount)
                .build();
    }

    @Override
    public List<DoctorTemplateStatsDTO> getTemplatesByDoctor(LocalDate from, LocalDate to, int top) {
        log.info("Fetching prescriptions by doctor from {} to {}, top {}", from, to, top);

        List<Prescription> prescriptions;
        if (from != null && to != null) {
            prescriptions = prescriptionRepository.findByPrescriptionDateBetween(from, to);
        } else {
            prescriptions = prescriptionRepository.findAll();
        }

        Map<Long, List<Prescription>> byDoctor = prescriptions.stream()
                .collect(Collectors.groupingBy(p -> p.getDoctor().getId()));

        return byDoctor.entrySet().stream()
                .map(entry -> {
                    List<Prescription> docPrescriptions = entry.getValue();
                    Doctor doctor = docPrescriptions.get(0).getDoctor();

                    long totalRx = docPrescriptions.size();
                    long uniquePatients = docPrescriptions.stream()
                            .map(p -> p.getPatient().getId())
                            .distinct().count();
                    long totalMeds = docPrescriptions.stream()
                            .mapToLong(p -> p.getItems().size()).sum();
                    double avgMeds = totalRx > 0 ? (double) totalMeds / totalRx : 0;

                    long active = docPrescriptions.stream()
                            .filter(p -> p.getStatus() == PrescriptionStatus.ACTIVE ||
                                    (p.getStatus() == null && Boolean.TRUE.equals(p.getIsActive())))
                            .count();
                    long expired = totalRx - active;

                    // Find top medication for this doctor
                    Map<String, Long> medCounts = docPrescriptions.stream()
                            .flatMap(p -> p.getItems().stream())
                            .collect(Collectors.groupingBy(PrescriptionItem::getMedicineName, Collectors.counting()));
                    Map.Entry<String, Long> topMed = medCounts.entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .orElse(null);

                    return DoctorTemplateStatsDTO.builder()
                            .doctorId(doctor.getId())
                            .doctorName(doctor.getFullName())
                            .specialization(doctor.getSpecialization())
                            .totalPrescriptions(totalRx)
                            .uniquePatients(uniquePatients)
                            .totalMedications(totalMeds)
                            .averageMedicationsPerPrescription(avgMeds)
                            .activePrescriptions(active)
                            .expiredPrescriptions(expired)
                            .topMedicationPrescribed(topMed != null ? topMed.getKey() : null)
                            .topMedicationCount(topMed != null ? topMed.getValue() : 0L)
                            .build();
                })
                .sorted(Comparator.comparingLong(DoctorTemplateStatsDTO::getTotalPrescriptions).reversed())
                .limit(top > 0 ? top : 10)
                .collect(Collectors.toList());
    }

    @Override
    public List<CommonMedicationDTO> getCommonMedications(LocalDate from, LocalDate to, int top, String groupBy) {
        log.info("Fetching common medications from {} to {}, top {}, groupBy {}", from, to, top, groupBy);

        List<Prescription> prescriptions;
        if (from != null && to != null) {
            prescriptions = prescriptionRepository.findByPrescriptionDateBetween(from, to);
        } else {
            prescriptions = prescriptionRepository.findAll();
        }

        long totalPrescriptionCount = prescriptions.size();

        // Flatten all items and group by medication name
        Map<String, List<PrescriptionItem>> byMedication = prescriptions.stream()
                .flatMap(p -> p.getItems().stream())
                .collect(Collectors.groupingBy(PrescriptionItem::getMedicineName));

        // Build a map of item -> prescription for unique doctor/patient counting
        Map<Long, Prescription> itemToPrescription = new HashMap<>();
        for (Prescription p : prescriptions) {
            for (PrescriptionItem item : p.getItems()) {
                itemToPrescription.put(item.getId(), p);
            }
        }

        return byMedication.entrySet().stream()
                .map(entry -> {
                    String medName = entry.getKey();
                    List<PrescriptionItem> items = entry.getValue();

                    // Count prescriptions containing this medication
                    Set<Long> rxIds = items.stream()
                            .map(item -> itemToPrescription.get(item.getId()))
                            .filter(Objects::nonNull)
                            .map(Prescription::getId)
                            .collect(Collectors.toSet());
                    long rxCount = rxIds.size();

                    // Total quantity
                    long totalQty = items.stream()
                            .filter(i -> i.getQuantity() != null)
                            .mapToLong(PrescriptionItem::getQuantity)
                            .sum();

                    // Unique doctors and patients
                    Set<Long> doctorIds = new HashSet<>();
                    Set<Long> patientIds = new HashSet<>();
                    for (PrescriptionItem item : items) {
                        Prescription rx = itemToPrescription.get(item.getId());
                        if (rx != null) {
                            doctorIds.add(rx.getDoctor().getId());
                            patientIds.add(rx.getPatient().getId());
                        }
                    }

                    // Most common dosage, frequency, duration
                    String mostCommonDosage = getMostCommon(items.stream()
                            .map(PrescriptionItem::getDosage).filter(Objects::nonNull).collect(Collectors.toList()));
                    String mostCommonFrequency = getMostCommon(items.stream()
                            .map(PrescriptionItem::getFrequency).filter(Objects::nonNull).collect(Collectors.toList()));
                    String mostCommonDuration = getMostCommon(items.stream()
                            .map(PrescriptionItem::getDuration).filter(Objects::nonNull).collect(Collectors.toList()));

                    double pctOfTotal = totalPrescriptionCount > 0
                            ? (double) rxCount / totalPrescriptionCount * 100 : 0;

                    return CommonMedicationDTO.builder()
                            .medicationName(medName)
                            .prescriptionCount(rxCount)
                            .totalQuantity(totalQty)
                            .uniqueDoctors((long) doctorIds.size())
                            .uniquePatients((long) patientIds.size())
                            .mostCommonDosage(mostCommonDosage)
                            .mostCommonFrequency(mostCommonFrequency)
                            .mostCommonDuration(mostCommonDuration)
                            .percentageOfTotal(Math.round(pctOfTotal * 100.0) / 100.0)
                            .build();
                })
                .sorted(Comparator.comparingLong(CommonMedicationDTO::getPrescriptionCount).reversed())
                .limit(top > 0 ? top : 10)
                .collect(Collectors.toList());
    }

    @Override
    public TemplateUsageTrendsDTO getUsageTrends(LocalDate from, LocalDate to, String groupBy, Long doctorId) {
        log.info("Fetching usage trends from {} to {}, groupBy {}, doctorId {}", from, to, groupBy, doctorId);

        List<Prescription> prescriptions;
        if (from != null && to != null) {
            prescriptions = prescriptionRepository.findByPrescriptionDateBetween(from, to);
        } else {
            prescriptions = prescriptionRepository.findAll();
        }

        // Filter by doctor if specified
        if (doctorId != null) {
            prescriptions = prescriptions.stream()
                    .filter(p -> p.getDoctor().getId().equals(doctorId))
                    .collect(Collectors.toList());
        }

        String resolvedGroupBy = (groupBy != null) ? groupBy.toUpperCase() : "MONTH";

        // Group prescriptions into time buckets
        Map<LocalDate, List<Prescription>> buckets = new TreeMap<>();
        for (Prescription p : prescriptions) {
            LocalDate bucketStart = getBucketStart(p.getPrescriptionDate(), resolvedGroupBy);
            buckets.computeIfAbsent(bucketStart, k -> new ArrayList<>()).add(p);
        }

        // Build trend data points
        List<TemplateUsageTrendsDTO.TrendDataPoint> trendData = new ArrayList<>();
        for (Map.Entry<LocalDate, List<Prescription>> entry : buckets.entrySet()) {
            LocalDate bucketStart = entry.getKey();
            LocalDate bucketEnd = getBucketEnd(bucketStart, resolvedGroupBy);
            List<Prescription> bucketRx = entry.getValue();

            long medCount = bucketRx.stream().mapToLong(p -> p.getItems().size()).sum();
            long uniquePatients = bucketRx.stream().map(p -> p.getPatient().getId()).distinct().count();
            long uniqueDoctors = bucketRx.stream().map(p -> p.getDoctor().getId()).distinct().count();

            trendData.add(TemplateUsageTrendsDTO.TrendDataPoint.builder()
                    .period(formatPeriodLabel(bucketStart, resolvedGroupBy))
                    .periodStart(bucketStart)
                    .periodEnd(bucketEnd)
                    .prescriptionCount((long) bucketRx.size())
                    .medicationCount(medCount)
                    .uniquePatients(uniquePatients)
                    .uniqueDoctors(uniqueDoctors)
                    .build());
        }

        long totalRx = prescriptions.size();
        double avgPerPeriod = !trendData.isEmpty() ? (double) totalRx / trendData.size() : 0;
        TemplateUsageTrendsDTO.TrendDataPoint peak = trendData.stream()
                .max(Comparator.comparingLong(TemplateUsageTrendsDTO.TrendDataPoint::getPrescriptionCount))
                .orElse(null);

        return TemplateUsageTrendsDTO.builder()
                .periodStart(from)
                .periodEnd(to)
                .groupBy(resolvedGroupBy)
                .trendData(trendData)
                .totalPrescriptions(totalRx)
                .averagePrescriptionsPerPeriod(Math.round(avgPerPeriod * 100.0) / 100.0)
                .peakPeriod(peak)
                .build();
    }

    // ==================== HELPER METHODS ====================

    private String getMostCommon(List<String> values) {
        if (values == null || values.isEmpty()) return null;
        return values.stream()
                .collect(Collectors.groupingBy(v -> v, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);
    }

    private LocalDate getBucketStart(LocalDate date, String groupBy) {
        return switch (groupBy) {
            case "DAY" -> date;
            case "WEEK" -> date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            default -> date.withDayOfMonth(1); // MONTH
        };
    }

    private LocalDate getBucketEnd(LocalDate bucketStart, String groupBy) {
        return switch (groupBy) {
            case "DAY" -> bucketStart;
            case "WEEK" -> bucketStart.plusDays(6);
            default -> bucketStart.with(TemporalAdjusters.lastDayOfMonth()); // MONTH
        };
    }

    private String formatPeriodLabel(LocalDate start, String groupBy) {
        return switch (groupBy) {
            case "DAY" -> start.toString();
            case "WEEK" -> start + " ~ " + start.plusDays(6);
            default -> start.getYear() + "-" + String.format("%02d", start.getMonthValue()); // MONTH
        };
    }

    // ==================== DOCTOR TEMPLATE CRUD (stubs) ====================

    @Override
    @Transactional
    public TemplateDTO createTemplate(TemplateCreateDTO dto, Long doctorUserId) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));

        PrescriptionTemplate template = PrescriptionTemplate.builder()
                .doctor(doctor)
                .templateName(dto.getTemplateName())
                .description(dto.getDescription())
                .diagnosisTemplate(dto.getDiagnosisTemplate())
                .notesTemplate(dto.getNotesTemplate())
                .defaultFollowUpDays(dto.getDefaultFollowUpDays())
                .isActive(true)
                .usageCount(0)
                .build();

        if (dto.getItems() != null) {
            AtomicInteger order = new AtomicInteger(1);
            dto.getItems().forEach(itemDto -> {
                PrescriptionTemplateItem item = PrescriptionTemplateItem.builder()
                        .medicineName(itemDto.getMedicineName())
                        .defaultDosage(itemDto.getDefaultDosage())
                        .defaultFrequency(itemDto.getDefaultFrequency())
                        .defaultDuration(itemDto.getDefaultDuration())
                        .defaultQuantity(itemDto.getDefaultQuantity())
                        .unit(itemDto.getUnit())
                        .defaultInstructions(itemDto.getDefaultInstructions())
                        .notes(itemDto.getNotes())
                        .itemOrder(order.getAndIncrement())
                        .build();
                template.addItem(item);
            });
        }

        return prescriptionMapper.toTemplateDTO(prescriptionTemplateRepository.save(template));
    }

    @Override
    public List<TemplateDTO> getDoctorTemplates(Long doctorUserId, Boolean activeOnly) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));
        if (Boolean.TRUE.equals(activeOnly)) {
            return prescriptionTemplateRepository.findByDoctorIdAndIsActiveTrue(doctor.getId())
                    .stream().map(prescriptionMapper::toTemplateDTO).collect(Collectors.toList());
        }
        return prescriptionTemplateRepository.findByDoctorId(doctor.getId())
                .stream().map(prescriptionMapper::toTemplateDTO).collect(Collectors.toList());
    }

    @Override
    public TemplateDTO getTemplateById(Long id, Long doctorUserId) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));
        PrescriptionTemplate template = prescriptionTemplateRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template", "id", id));
        if (!template.getDoctor().getId().equals(doctor.getId())) {
            throw new AppException("Access denied: template belongs to another doctor", HttpStatus.FORBIDDEN);
        }
        return prescriptionMapper.toTemplateDTO(template);
    }

    @Override
    @Transactional
    public TemplateDTO updateTemplate(Long id, TemplateUpdateDTO dto, Long doctorUserId) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));
        PrescriptionTemplate template = prescriptionTemplateRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template", "id", id));

        if (!template.getDoctor().getId().equals(doctor.getId())) {
            throw new AppException("Access denied: template belongs to another doctor", HttpStatus.FORBIDDEN);
        }

        template.setTemplateName(dto.getTemplateName());
        template.setDescription(dto.getDescription());
        template.setDiagnosisTemplate(dto.getDiagnosisTemplate());
        template.setNotesTemplate(dto.getNotesTemplate());
        template.setDefaultFollowUpDays(dto.getDefaultFollowUpDays());
        if (dto.getIsActive() != null) template.setIsActive(dto.getIsActive());

        template.getItems().clear();
        if (dto.getItems() != null) {
            AtomicInteger order = new AtomicInteger(1);
            dto.getItems().forEach(itemDto -> {
                PrescriptionTemplateItem item = PrescriptionTemplateItem.builder()
                        .medicineName(itemDto.getMedicineName())
                        .defaultDosage(itemDto.getDefaultDosage())
                        .defaultFrequency(itemDto.getDefaultFrequency())
                        .defaultDuration(itemDto.getDefaultDuration())
                        .defaultQuantity(itemDto.getDefaultQuantity())
                        .unit(itemDto.getUnit())
                        .defaultInstructions(itemDto.getDefaultInstructions())
                        .notes(itemDto.getNotes())
                        .itemOrder(order.getAndIncrement())
                        .build();
                template.addItem(item);
            });
        }

        return prescriptionMapper.toTemplateDTO(prescriptionTemplateRepository.save(template));
    }

    @Override
    @Transactional
    public void deleteTemplate(Long id, Long doctorUserId) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));
        PrescriptionTemplate template = prescriptionTemplateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template", "id", id));

        if (!template.getDoctor().getId().equals(doctor.getId())) {
            throw new AppException("Access denied: template belongs to another doctor", HttpStatus.FORBIDDEN);
        }

        template.setIsActive(false);
        prescriptionTemplateRepository.save(template);
    }

    @Override
    @Transactional
    public PrescriptionDTO applyTemplate(Long id, ApplyTemplateDTO dto, Long doctorUserId) {
        throw new UnsupportedOperationException("Use POST /{id}/apply-items for pre-fill flow");
    }

    @Override
    @Transactional
    public List<PrescriptionItemDTO> getTemplateItems(Long id, Long doctorUserId) {
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));
        PrescriptionTemplate template = prescriptionTemplateRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Template", "id", id));

        if (!template.getDoctor().getId().equals(doctor.getId())) {
            throw new AppException("Access denied: template belongs to another doctor", HttpStatus.FORBIDDEN);
        }

        template.incrementUsageCount();
        prescriptionTemplateRepository.save(template);

        return template.getItems().stream()
                .map(item -> PrescriptionItemDTO.builder()
                        .medicineName(item.getMedicineName())
                        .dosage(item.getDefaultDosage())
                        .frequency(item.getDefaultFrequency())
                        .duration(item.getDefaultDuration())
                        .quantity(item.getDefaultQuantity())
                        .unit(item.getUnit())
                        .instructions(item.getDefaultInstructions())
                        .notes(item.getNotes())
                        .itemOrder(item.getItemOrder())
                        .build())
                .collect(Collectors.toList());
    }
}
