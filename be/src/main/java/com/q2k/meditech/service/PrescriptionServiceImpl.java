package com.q2k.meditech.service;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.PrescriptionStatus;
import com.q2k.meditech.exception.AppException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.dto.mapper.PrescriptionMapper;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.util.ExportUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PrescriptionServiceImpl implements PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionMapper prescriptionMapper;

    @Override
    public PrescriptionDTO createPrescription(PrescriptionCreateDTO dto, Long doctorUserId) {
        log.info("Creating prescription for patient {} by doctor user {}", dto.getPatientId(), doctorUserId);

        // Validate doctor
        Doctor doctor = doctorRepository.findByUserId(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "userId", doctorUserId));

        // Validate patient
        Patient patient = patientRepository.findByIdWithUser(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", dto.getPatientId()));

        // Validate appointment if provided
        Appointment appointment = null;
        if (dto.getAppointmentId() != null) {
            appointment = appointmentRepository.findById(dto.getAppointmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", dto.getAppointmentId()));

            // Check if appointment belongs to this doctor and patient
            if (!appointment.getDoctor().getId().equals(doctor.getId())) {
                throw new AppException("Appointment does not belong to this doctor", HttpStatus.FORBIDDEN);
            }
            if (!appointment.getPatient().getId().equals(patient.getId())) {
                throw new AppException("Appointment does not belong to this patient", HttpStatus.BAD_REQUEST);
            }
        }

        // Create prescription
        Prescription prescription = Prescription.builder()
                .patient(patient)
                .doctor(doctor)
                .appointment(appointment)
                .prescriptionDate(dto.getPrescriptionDate() != null ? dto.getPrescriptionDate() : LocalDate.now())
                .expiryDate(dto.getFollowUpDate()) // Use follow-up date as expiry if available
                .status(PrescriptionStatus.ACTIVE)
                .diagnosis(dto.getDiagnosis())
                .notes(dto.getNotes())
                .followUpDate(dto.getFollowUpDate())
                .isActive(true)
                .build();

        // Add items
        AtomicInteger order = new AtomicInteger(1);
        dto.getItems().forEach(itemDto -> {
            PrescriptionItem item = prescriptionMapper.toItemEntity(itemDto);
            if (item.getItemOrder() == null) {
                item.setItemOrder(order.getAndIncrement());
            }
            prescription.addItem(item);
        });

        Prescription savedPrescription = prescriptionRepository.save(prescription);

        // Generate prescription code after save (so we have the ID)
        if (savedPrescription.getPrescriptionCode() == null) {
            savedPrescription.setPrescriptionCode("PRE-" + String.format("%06d", savedPrescription.getId()));
            savedPrescription = prescriptionRepository.save(savedPrescription);
        }

        log.info("Prescription created with ID: {}, code: {}", savedPrescription.getId(), savedPrescription.getPrescriptionCode());

        return prescriptionMapper.toDTO(savedPrescription);
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDTO getPrescriptionById(Long id) {
        Prescription prescription = prescriptionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));
        return prescriptionMapper.toDTO(prescription);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PrescriptionDTO> getPatientPrescriptions(Long patientId, LocalDate from, LocalDate to, int pageNumber, int pageSize) {
        log.info("Getting prescriptions for patient {}", patientId);

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "prescriptionDate"));

        Page<Prescription> prescriptions;
        if (from != null && to != null) {
            prescriptions = prescriptionRepository.findByPatientIdAndDateRange(patientId, from, to, pageable);
        } else {
            prescriptions = prescriptionRepository.findByPatientIdOrderByPrescriptionDateDesc(patientId, pageable);
        }

        return prescriptions.map(prescriptionMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PrescriptionDTO> getDoctorPrescriptions(Long doctorId, LocalDate from, LocalDate to, int pageNumber, int pageSize) {
        log.info("Getting prescriptions for doctor {}", doctorId);

        Pageable pageable = PageRequest.of(pageNumber, pageSize, Sort.by(Sort.Direction.DESC, "prescriptionDate"));

        // TODO: Add date range filter if needed
        List<Prescription> prescriptions = prescriptionRepository.findByDoctorId(doctorId);

        // Convert to Page manually for now
        int start = pageNumber * pageSize;
        int end = Math.min(start + pageSize, prescriptions.size());

        List<PrescriptionDTO> content = prescriptions.subList(start, end).stream()
                .map(prescriptionMapper::toDTO)
                .toList();

        return new org.springframework.data.domain.PageImpl<>(content, pageable, prescriptions.size());
    }

    // ==================== ADMIN METHODS ====================

    @Override
    @Transactional(readOnly = true)
    public Page<PrescriptionDTO> getAllPrescriptionsForAdmin(PrescriptionFilterDTO filter) {
        log.info("Admin fetching prescriptions with filters: {}", filter);

        Specification<Prescription> spec = Specification.where(null);

        // Search filter (by code, patient name, doctor name)
        if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
            String searchPattern = "%" + filter.getSearch().toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("id").as(String.class)), searchPattern),
                    cb.like(cb.lower(root.get("patient").get("user").get("fullName")), searchPattern),
                    cb.like(cb.lower(root.get("doctor").get("user").get("fullName")), searchPattern)
            ));
        }

        // Doctor filter
        if (filter.getDoctorId() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("doctor").get("id"), filter.getDoctorId()));
        }

        // Patient filter
        if (filter.getPatientId() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("patient").get("id"), filter.getPatientId()));
        }

        // Status filter (ACTIVE, EXPIRED, CANCELLED)
        if (filter.getStatus() != null && !filter.getStatus().isBlank()) {
            try {
                PrescriptionStatus statusEnum = PrescriptionStatus.valueOf(filter.getStatus().toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), statusEnum));
            } catch (IllegalArgumentException e) {
                // Fallback: legacy isActive filter
                if ("ACTIVE".equalsIgnoreCase(filter.getStatus())) {
                    spec = spec.and((root, query, cb) -> cb.equal(root.get("isActive"), true));
                } else if ("EXPIRED".equalsIgnoreCase(filter.getStatus())) {
                    spec = spec.and((root, query, cb) -> cb.equal(root.get("isActive"), false));
                }
            }
        }

        // Date range filter
        if (filter.getFrom() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("prescriptionDate"), filter.getFrom()));
        }
        if (filter.getTo() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("prescriptionDate"), filter.getTo()));
        }

        // Pagination and sorting
        Sort.Direction direction = "ASC".equalsIgnoreCase(filter.getSortDir())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        String safeSortBy = com.q2k.meditech.util.SortFieldValidator.validate(
                filter.getSortBy(), java.util.Set.of("prescriptionDate", "createdAt", "id", "status"), "prescriptionDate");
        Pageable pageable = PageRequest.of(
                filter.getPageNumber(),
                filter.getPageSize(),
                Sort.by(direction, safeSortBy)
        );

        Page<Prescription> prescriptions = prescriptionRepository.findAll(spec, pageable);
        return prescriptions.map(prescriptionMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionStatsDTO getPrescriptionStatistics(LocalDate from, LocalDate to) {
        log.info("Admin fetching prescription statistics from {} to {}", from, to);

        List<Prescription> allPrescriptions;

        if (from != null && to != null) {
            allPrescriptions = prescriptionRepository.findByPrescriptionDateBetween(from, to);
        } else {
            allPrescriptions = prescriptionRepository.findAll();
        }

        long totalPrescriptions = allPrescriptions.size();
        long activePrescriptions = allPrescriptions.stream()
                .filter(p -> p.getStatus() == PrescriptionStatus.ACTIVE ||
                        (p.getStatus() == null && Boolean.TRUE.equals(p.getIsActive())))
                .count();
        long cancelledPrescriptions = allPrescriptions.stream()
                .filter(p -> p.getStatus() == PrescriptionStatus.CANCELLED)
                .count();
        long expiredPrescriptions = totalPrescriptions - activePrescriptions - cancelledPrescriptions;

        // Calculate most prescribed medications
        Map<String, PrescriptionStatsDTO.MedicationStatsDTO> medicationStatsMap = new HashMap<>();

        allPrescriptions.forEach(prescription -> {
            prescription.getItems().forEach(item -> {
                String medicineName = item.getMedicineName();
                medicationStatsMap.computeIfAbsent(medicineName, k ->
                        PrescriptionStatsDTO.MedicationStatsDTO.builder()
                                .medicationName(medicineName)
                                .genericName(null) // Generic name not available in current schema
                                .prescriptionCount(0L)
                                .totalQuantity(0L)
                                .build()
                );

                PrescriptionStatsDTO.MedicationStatsDTO stats = medicationStatsMap.get(medicineName);
                stats.setPrescriptionCount(stats.getPrescriptionCount() + 1);
                stats.setTotalQuantity(stats.getTotalQuantity() +
                        (item.getQuantity() != null ? item.getQuantity() : 0));
            });
        });

        List<PrescriptionStatsDTO.MedicationStatsDTO> topMedications = medicationStatsMap.values().stream()
                .sorted(Comparator.comparing(PrescriptionStatsDTO.MedicationStatsDTO::getPrescriptionCount).reversed())
                .limit(10)
                .collect(Collectors.toList());

        return PrescriptionStatsDTO.builder()
                .totalPrescriptions(totalPrescriptions)
                .activePrescriptions(activePrescriptions)
                .expiredPrescriptions(expiredPrescriptions)
                .cancelledPrescriptions(cancelledPrescriptions)
                .mostPrescribedMedications(topMedications)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PrescriptionDetailDTO getPrescriptionDetailForAdmin(Long id) {
        log.info("Admin fetching prescription detail - id: {}", id);

        Prescription prescription = prescriptionRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Prescription", "id", id));

        Patient patient = prescription.getPatient();
        Doctor doctor = prescription.getDoctor();
        Appointment appointment = prescription.getAppointment();

        // Map prescription items
        List<PrescriptionItemDTO> medications = prescription.getItems().stream()
                .sorted(Comparator.comparing(PrescriptionItem::getItemOrder))
                .map(item -> PrescriptionItemDTO.builder()
                        .id(item.getId())
                        .medicineName(item.getMedicineName())
                        .dosage(item.getDosage())
                        .frequency(item.getFrequency())
                        .duration(item.getDuration())
                        .quantity(item.getQuantity())
                        .unit(item.getUnit())
                        .instructions(item.getInstructions())
                        .notes(item.getNotes())
                        .itemOrder(item.getItemOrder())
                        .build())
                .collect(Collectors.toList());

        // Calculate patient age
        Integer patientAge = null;
        if (patient.getDateOfBirth() != null) {
            patientAge = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
        }

        // Resolve status: prefer enum, fall back to isActive boolean
        String resolvedStatus;
        if (prescription.getStatus() != null) {
            resolvedStatus = prescription.getStatus().name();
        } else {
            resolvedStatus = Boolean.TRUE.equals(prescription.getIsActive()) ? "ACTIVE" : "EXPIRED";
        }

        // Resolve prescription code
        String prescriptionCode = prescription.getPrescriptionCode() != null
                ? prescription.getPrescriptionCode()
                : "PRE-" + String.format("%06d", prescription.getId());

        // Resolve expiry date: prefer expiryDate, fall back to followUpDate
        LocalDate expiryDate = prescription.getExpiryDate() != null
                ? prescription.getExpiryDate()
                : prescription.getFollowUpDate();

        return PrescriptionDetailDTO.builder()
                // Prescription info
                .id(prescription.getId())
                .prescriptionCode(prescriptionCode)
                .prescribedDate(prescription.getPrescriptionDate())
                .expiryDate(expiryDate)
                .status(resolvedStatus)
                .diagnosis(prescription.getDiagnosis())
                .notes(prescription.getNotes())
                .createdAt(prescription.getCreatedAt())
                .updatedAt(prescription.getUpdatedAt())
                // Patient info
                .patientId(patient.getId())
                .patientName(patient.getUser().getFullName())
                .patientAge(patientAge)
                .patientGender(patient.getGender())
                .patientPhone(patient.getUser().getPhone())
                .patientEmail(patient.getUser().getEmail())
                .patientAddress(patient.getAddress())
                .medicalRecordNumber("MRN-" + patient.getId())
                // Doctor info
                .doctorId(doctor.getId())
                .doctorName(doctor.getUser().getFullName())
                .doctorEmail(doctor.getUser().getEmail())
                .doctorSpecialization(doctor.getSpecialization())
                .doctorLicenseNumber(doctor.getLicenseNumber())
                .doctorSignature(null) // Signature field not available in Doctor entity
                // Appointment info
                .appointmentId(appointment != null ? appointment.getId() : null)
                .appointmentCode(appointment != null ? "APT-" + appointment.getId() : null)
                .appointmentDate(appointment != null && appointment.getAppointmentDate() != null
                        ? appointment.getAppointmentDate().atStartOfDay()
                        : null)
                // Medications
                .medications(medications)
                .generalNotes(prescription.getNotes())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Resource exportPrescriptions(PrescriptionFilterDTO filter, String format) {
        log.info("Admin exporting prescriptions - format: {}", format);

        // Get all prescriptions without pagination for export
        PrescriptionFilterDTO exportFilter = PrescriptionFilterDTO.builder()
                .search(filter.getSearch())
                .doctorId(filter.getDoctorId())
                .patientId(filter.getPatientId())
                .status(filter.getStatus())
                .from(filter.getFrom())
                .to(filter.getTo())
                .pageNumber(0)
                .pageSize(Integer.MAX_VALUE)
                .sortBy(filter.getSortBy())
                .sortDir(filter.getSortDir())
                .build();

        Page<PrescriptionDTO> prescriptions = getAllPrescriptionsForAdmin(exportFilter);

        // Generate export content (simplified - you can enhance this with Apache POI for Excel)
        StringBuilder content = new StringBuilder();

        if ("CSV".equalsIgnoreCase(format)) {
            // CSV Header
            content.append("ID,Prescription Code,Patient Name,Doctor Name,Date,Status,Diagnosis\n");

            // CSV Rows
            prescriptions.getContent().forEach(p -> {
                String status = (p.getIsActive() != null && p.getIsActive()) ? "ACTIVE" : "EXPIRED";
                content.append(String.format("%d,PRE-%d,%s,%s,%s,%s,%s\n",
                        p.getId(),
                        p.getId(),
                        p.getPatientName(),
                        p.getDoctorName(),
                        p.getPrescriptionDate(),
                        status,
                        p.getDiagnosis() != null ? p.getDiagnosis().replace(",", ";") : ""
                ));
            });
        } else {
            // Excel format using Apache POI via ExportUtil
            try {
                List<ExportUtil.ExportColumn<PrescriptionDTO>> columns = List.of(
                        ExportUtil.ExportColumn.of("ID", p -> String.valueOf(p.getId())),
                        ExportUtil.ExportColumn.of("Prescription Code", p -> "PRE-" + p.getId()),
                        ExportUtil.ExportColumn.of("Patient Name", PrescriptionDTO::getPatientName),
                        ExportUtil.ExportColumn.of("Doctor Name", PrescriptionDTO::getDoctorName),
                        ExportUtil.ExportColumn.of("Date", p -> p.getPrescriptionDate() != null ? p.getPrescriptionDate().toString() : ""),
                        ExportUtil.ExportColumn.of("Status", p -> (p.getIsActive() != null && p.getIsActive()) ? "ACTIVE" : "EXPIRED"),
                        ExportUtil.ExportColumn.of("Diagnosis", p -> p.getDiagnosis() != null ? p.getDiagnosis() : "")
                );
                byte[] data = ExportUtil.toExcel(columns, prescriptions.getContent(), "Prescriptions");
                return new ByteArrayResource(data);
            } catch (Exception e) {
                log.error("Error generating Excel export", e);
                throw new AppException("Failed to generate Excel export", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }

        byte[] data = content.toString().getBytes();
        return new ByteArrayResource(data);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource generatePrescriptionPdf(Long id) {
        log.info("Admin generating prescription PDF - id: {}", id);

        PrescriptionDetailDTO detail = getPrescriptionDetailForAdmin(id);

        try {
            // Build rows: prescription info + each medication as a row
            List<String[]> rows = new ArrayList<>();
            rows.add(new String[]{"Prescription Code", detail.getPrescriptionCode() != null ? detail.getPrescriptionCode() : ""});
            rows.add(new String[]{"Date", detail.getPrescribedDate() != null ? detail.getPrescribedDate().toString() : ""});
            rows.add(new String[]{"Patient", detail.getPatientName() != null ? detail.getPatientName() : ""});
            rows.add(new String[]{"Age", detail.getPatientAge() != null ? String.valueOf(detail.getPatientAge()) : ""});
            rows.add(new String[]{"Gender", detail.getPatientGender() != null ? detail.getPatientGender() : ""});
            rows.add(new String[]{"Doctor", detail.getDoctorName() != null ? detail.getDoctorName() : ""});
            rows.add(new String[]{"Specialization", detail.getDoctorSpecialization() != null ? detail.getDoctorSpecialization() : ""});
            rows.add(new String[]{"Diagnosis", detail.getDiagnosis() != null ? detail.getDiagnosis() : ""});
            rows.add(new String[]{"", ""}); // separator
            rows.add(new String[]{"MEDICATIONS", ""});

            if (detail.getMedications() != null) {
                for (var med : detail.getMedications()) {
                    rows.add(new String[]{
                            med.getItemOrder() + ". " + (med.getMedicineName() != null ? med.getMedicineName() : ""),
                            String.format("Dosage: %s | Freq: %s | Duration: %s | Qty: %d %s",
                                    med.getDosage() != null ? med.getDosage() : "",
                                    med.getFrequency() != null ? med.getFrequency() : "",
                                    med.getDuration() != null ? med.getDuration() : "",
                                    med.getQuantity() != null ? med.getQuantity() : 0,
                                    med.getUnit() != null ? med.getUnit() : "")
                    });
                }
            }

            rows.add(new String[]{"", ""}); // separator
            rows.add(new String[]{"Notes", detail.getNotes() != null ? detail.getNotes() : ""});

            List<ExportUtil.ExportColumn<String[]>> columns = List.of(
                    ExportUtil.ExportColumn.of("Field", r -> r[0]),
                    ExportUtil.ExportColumn.of("Value", r -> r[1])
            );

            byte[] data = ExportUtil.toPdf(columns, rows, "Prescription - " + (detail.getPrescriptionCode() != null ? detail.getPrescriptionCode() : String.valueOf(id)));
            return new ByteArrayResource(data);
        } catch (Exception e) {
            log.error("Error generating prescription PDF", e);
            throw new AppException("Failed to generate prescription PDF", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PrintTemplateDTO generatePrintTemplate(Long id, String format) {
        log.info("Admin generating print template - id: {}, format: {}", id, format);

        PrescriptionDetailDTO detail = getPrescriptionDetailForAdmin(id);

        if ("HTML".equalsIgnoreCase(format)) {
            // Generate HTML template for web printing
            String htmlContent = generatePrescriptionHtml(detail);

            return PrintTemplateDTO.builder()
                    .format("HTML")
                    .content(htmlContent)
                    .filename("prescription_" + id + ".html")
                    .prescription(detail)
                    .build();
        } else {
            // Generate PDF and encode as base64
            Resource pdfResource = generatePrescriptionPdf(id);
            try {
                byte[] pdfBytes = pdfResource.getContentAsByteArray();
                String base64Pdf = java.util.Base64.getEncoder().encodeToString(pdfBytes);

                return PrintTemplateDTO.builder()
                        .format("PDF")
                        .content(base64Pdf)
                        .filename("prescription_" + id + ".pdf")
                        .prescription(detail)
                        .build();
            } catch (Exception e) {
                log.error("Error encoding PDF to base64", e);
                throw new AppException("Failed to generate print template", HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }

    @Override
    @Transactional
    public void sendPrescriptionEmail(Long id, SendPrescriptionEmailDTO emailRequest) {
        log.info("Admin sending prescription email - id: {}, request: {}", id, emailRequest);

        PrescriptionDetailDTO detail = getPrescriptionDetailForAdmin(id);

        String recipientEmail = emailRequest.getEmail();
        if (recipientEmail == null || recipientEmail.isBlank()) {
            throw new AppException("Email address is required", HttpStatus.BAD_REQUEST);
        }

        // TODO: Implement email service integration
        // For now, just log the action
        log.info("Would send prescription {} to email: {}", detail.getPrescriptionCode(), recipientEmail);
        log.info("Email options - includePDF: {}, sendCopy: {}, patientRequested: {}, customMessage: {}",
                emailRequest.getIncludePDF(), emailRequest.getSendCopy(),
                emailRequest.getPatientRequested(), emailRequest.getCustomMessage());

        if (emailRequest.getIncludePDF()) {
            log.info("Would attach PDF to email");
        }

        if (emailRequest.getSendCopy()) {
            log.info("Would send copy to doctor: {}", detail.getDoctorEmail());
        }

        if (emailRequest.getCustomMessage() != null && !emailRequest.getCustomMessage().isBlank()) {
            log.info("Custom message: {}", emailRequest.getCustomMessage());
        }

        // In real implementation, use EmailService to send the email
        // emailService.sendPrescriptionEmail(
        //     recipientEmail,
        //     detail,
        //     emailRequest.getIncludePDF() ? generatePrescriptionPdf(id) : null,
        //     emailRequest.getCustomMessage(),
        //     emailRequest.getSendCopy() ? detail.getDoctorEmail() : null
        // );
    }

    /**
     * Generate HTML content for prescription printing
     */
    private String generatePrescriptionHtml(PrescriptionDetailDTO detail) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>\n");
        html.append("<html>\n<head>\n");
        html.append("<meta charset=\"UTF-8\">\n");
        html.append("<title>Prescription - ").append(detail.getPrescriptionCode()).append("</title>\n");
        html.append("<style>\n");
        html.append("  body { font-family: Arial, sans-serif; margin: 40px; }\n");
        html.append("  .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }\n");
        html.append("  .header h1 { color: #2c3e50; margin: 0; }\n");
        html.append("  .section { margin-bottom: 20px; }\n");
        html.append("  .section-title { font-weight: bold; color: #34495e; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }\n");
        html.append("  .info-row { margin: 5px 0; }\n");
        html.append("  .label { font-weight: bold; display: inline-block; width: 150px; }\n");
        html.append("  .medication { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 5px; }\n");
        html.append("  .medication-name { font-weight: bold; color: #2980b9; font-size: 14px; }\n");
        html.append("  .medication-details { margin-top: 8px; font-size: 13px; color: #555; }\n");
        html.append("  .footer { margin-top: 50px; text-align: right; }\n");
        html.append("  .signature-line { border-top: 1px solid #333; width: 200px; display: inline-block; margin-top: 50px; }\n");
        html.append("  @media print { body { margin: 20px; } }\n");
        html.append("</style>\n");
        html.append("</head>\n<body>\n");

        // Header
        html.append("<div class=\"header\">\n");
        html.append("  <h1>MEDICAL PRESCRIPTION</h1>\n");
        html.append("  <p>").append(detail.getPrescriptionCode()).append("</p>\n");
        html.append("</div>\n");

        // Patient Information
        html.append("<div class=\"section\">\n");
        html.append("  <div class=\"section-title\">Patient Information</div>\n");
        html.append("  <div class=\"info-row\"><span class=\"label\">Name:</span> ").append(detail.getPatientName()).append("</div>\n");
        html.append("  <div class=\"info-row\"><span class=\"label\">Age:</span> ").append(detail.getPatientAge() != null ? detail.getPatientAge() : "N/A").append(" years</div>\n");
        html.append("  <div class=\"info-row\"><span class=\"label\">Gender:</span> ").append(detail.getPatientGender() != null ? detail.getPatientGender() : "N/A").append("</div>\n");
        html.append("  <div class=\"info-row\"><span class=\"label\">Phone:</span> ").append(detail.getPatientPhone()).append("</div>\n");
        html.append("  <div class=\"info-row\"><span class=\"label\">MRN:</span> ").append(detail.getMedicalRecordNumber()).append("</div>\n");
        html.append("</div>\n");

        // Doctor Information
        html.append("<div class=\"section\">\n");
        html.append("  <div class=\"section-title\">Physician Information</div>\n");
        html.append("  <div class=\"info-row\"><span class=\"label\">Doctor:</span> ").append(detail.getDoctorName()).append("</div>\n");
        html.append("  <div class=\"info-row\"><span class=\"label\">Specialization:</span> ").append(detail.getDoctorSpecialization() != null ? detail.getDoctorSpecialization() : "N/A").append("</div>\n");
        html.append("  <div class=\"info-row\"><span class=\"label\">License Number:</span> ").append(detail.getDoctorLicenseNumber() != null ? detail.getDoctorLicenseNumber() : "N/A").append("</div>\n");
        html.append("  <div class=\"info-row\"><span class=\"label\">Date:</span> ").append(detail.getPrescribedDate()).append("</div>\n");
        html.append("</div>\n");

        // Diagnosis
        if (detail.getDiagnosis() != null && !detail.getDiagnosis().isBlank()) {
            html.append("<div class=\"section\">\n");
            html.append("  <div class=\"section-title\">Diagnosis</div>\n");
            html.append("  <p>").append(detail.getDiagnosis()).append("</p>\n");
            html.append("</div>\n");
        }

        // Medications
        html.append("<div class=\"section\">\n");
        html.append("  <div class=\"section-title\">Prescribed Medications</div>\n");
        detail.getMedications().forEach(med -> {
            html.append("  <div class=\"medication\">\n");
            html.append("    <div class=\"medication-name\">").append(med.getItemOrder()).append(". ").append(med.getMedicineName()).append("</div>\n");
            html.append("    <div class=\"medication-details\">\n");
            html.append("      <strong>Dosage:</strong> ").append(med.getDosage()).append(" | ");
            html.append("      <strong>Frequency:</strong> ").append(med.getFrequency()).append(" | ");
            html.append("      <strong>Duration:</strong> ").append(med.getDuration()).append("<br>\n");
            html.append("      <strong>Quantity:</strong> ").append(med.getQuantity() != null ? med.getQuantity() : 0).append(" ").append(med.getUnit() != null ? med.getUnit() : "").append("<br>\n");
            if (med.getInstructions() != null && !med.getInstructions().isBlank()) {
                html.append("      <strong>Instructions:</strong> ").append(med.getInstructions()).append("\n");
            }
            html.append("    </div>\n");
            html.append("  </div>\n");
        });
        html.append("</div>\n");

        // Notes
        if (detail.getNotes() != null && !detail.getNotes().isBlank()) {
            html.append("<div class=\"section\">\n");
            html.append("  <div class=\"section-title\">Additional Notes</div>\n");
            html.append("  <p>").append(detail.getNotes()).append("</p>\n");
            html.append("</div>\n");
        }

        // Footer with signature
        html.append("<div class=\"footer\">\n");
        html.append("  <div>\n");
        html.append("    <p>Doctor's Signature</p>\n");
        html.append("    <div class=\"signature-line\"></div>\n");
        html.append("    <p style=\"margin-top: 5px;\">").append(detail.getDoctorName()).append("</p>\n");
        html.append("  </div>\n");
        html.append("</div>\n");

        html.append("</body>\n</html>");

        return html.toString();
    }
}