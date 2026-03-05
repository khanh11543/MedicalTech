package com.q2k.meditech.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.q2k.meditech.dto.*;
import com.q2k.meditech.dto.mapper.DataExportRequestMapper;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.ExportRequestStatus;
import com.q2k.meditech.exception.AppException;
import com.q2k.meditech.exception.ResourceNotFoundException;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.util.SecurityUtil;
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

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DataExportRequestServiceImpl implements DataExportRequestService {

    private final DataExportRequestRepository exportRequestRepository;
    private final DataExportRequestMapper exportRequestMapper;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final EmailService emailService;

    // Auto-process configuration (in-memory — could be persisted to DB/config)
    private final AtomicBoolean autoProcessEnabled = new AtomicBoolean(false);
    private final AtomicInteger autoProcessWithinHours = new AtomicInteger(24);

    private static final String EXPORT_DIR = "exports/gdpr";

    // ==================== LIST EXPORT REQUESTS ====================
    @Override
    @Transactional(readOnly = true)
    public Page<DataExportRequestDTO> getExportRequests(ExportRequestFilterDTO filter) {
        log.info("Fetching export requests with filter: {}", filter);

        Sort.Direction direction = "ASC".equalsIgnoreCase(filter.getSortDir())
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(
                filter.getPageNumber(), filter.getPageSize(),
                Sort.by(direction, filter.getSortBy())
        );

        Specification<DataExportRequest> spec = Specification.where(null);

        // Filter by status
        if (filter.getStatus() != null && !filter.getStatus().isEmpty()) {
            try {
                ExportRequestStatus status = ExportRequestStatus.valueOf(filter.getStatus().toUpperCase());
                spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status filter: {}", filter.getStatus());
            }
        }

        // Filter by userId
        if (filter.getUserId() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("user").get("id"), filter.getUserId()));
        }

        // Filter by date range (requestedDate)
        if (filter.getFrom() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("requestedDate"), filter.getFrom()));
        }
        if (filter.getTo() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("requestedDate"), filter.getTo()));
        }

        Page<DataExportRequest> page = exportRequestRepository.findAll(spec, pageable);
        return page.map(exportRequestMapper::toDTO);
    }

    // ==================== PROCESS EXPORT REQUEST ====================
    @Override
    public DataExportRequestDTO processExportRequest(Long id, ProcessExportRequestDTO dto) {
        log.info("Processing export request id={}, format={}", id, dto.getFormat());

        DataExportRequest request = exportRequestRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("DataExportRequest", "id", id));

        if (request.getStatus() == ExportRequestStatus.PROCESSING) {
            throw new AppException("Export request is already being processed", HttpStatus.CONFLICT);
        }

        // Update request with processing options
        request.setStatus(ExportRequestStatus.PROCESSING);
        request.setIncludeProfile(dto.getIncludeProfile());
        request.setIncludeAppointments(dto.getIncludeAppointments());
        request.setIncludePrescriptions(dto.getIncludePrescriptions());
        request.setIncludePayments(dto.getIncludePayments());
        request.setIncludeReviews(dto.getIncludeReviews());
        request.setIncludeActivityLogs(dto.getIncludeActivityLogs());
        request.setExportFormat(dto.getFormat() != null ? dto.getFormat().toUpperCase() : "JSON");
        request.setProcessedBy(SecurityUtil.getCurrentUserId());
        exportRequestRepository.save(request);

        try {
            // Generate export data
            Map<String, Object> exportData = collectUserData(request);

            // Generate file
            byte[] fileBytes = generateExportFile(exportData, request.getExportFormat());
            String fileName = generateFileName(request);

            // Save file
            Path exportPath = saveExportFile(fileBytes, fileName);
            request.setFilePath(exportPath.toString());
            request.setFileSize((long) fileBytes.length);
            request.setStatus(ExportRequestStatus.COMPLETED);
            request.setProcessedDate(LocalDateTime.now());

            // Send email if requested
            if (Boolean.TRUE.equals(dto.getSendEmail())) {
                try {
                    String userEmail = request.getUser().getEmail();
                    String userName = request.getUser().getFullName();
                    sendExportReadyEmail(userEmail, userName, fileBytes, fileName);
                    request.setEmailSent(true);
                    request.setEmailSentDate(LocalDateTime.now());
                } catch (Exception e) {
                    log.error("Failed to send export email for request {}: {}", id, e.getMessage());
                    // Don't fail the request if email fails
                }
            }

            exportRequestRepository.save(request);
            log.info("Export request {} completed successfully. File: {}", id, exportPath);

        } catch (Exception e) {
            log.error("Failed to process export request {}: {}", id, e.getMessage(), e);
            request.setStatus(ExportRequestStatus.FAILED);
            request.setErrorMessage(e.getMessage());
            request.setProcessedDate(LocalDateTime.now());
            exportRequestRepository.save(request);
            throw new AppException("Failed to process export: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return exportRequestMapper.toDTO(request);
    }

    // ==================== DOWNLOAD EXPORT FILE ====================
    @Override
    public Resource downloadExportFile(Long id) {
        DataExportRequest request = exportRequestRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("DataExportRequest", "id", id));

        if (request.getStatus() != ExportRequestStatus.COMPLETED) {
            throw new AppException("Export file is not ready for download. Status: " + request.getStatus(),
                    HttpStatus.BAD_REQUEST);
        }

        // Try reading the existing file from disk
        if (request.getFilePath() != null && !request.getFilePath().isEmpty()) {
            try {
                Path path = Paths.get(request.getFilePath());
                if (Files.exists(path)) {
                    byte[] data = Files.readAllBytes(path);
                    return new ByteArrayResource(data);
                }
            } catch (IOException e) {
                log.warn("Failed to read existing export file for request {}, will regenerate: {}", id, e.getMessage());
            }
        }

        // File missing on disk — regenerate on the fly
        try {
            log.info("Regenerating export file on the fly for request {}", id);
            String format = request.getExportFormat() != null ? request.getExportFormat() : "JSON";
            Map<String, Object> exportData = collectUserData(request);
            byte[] fileBytes = generateExportFile(exportData, format);

            // Save regenerated file for future downloads
            String fileName = generateFileName(request);
            Path exportPath = saveExportFile(fileBytes, fileName);
            request.setFilePath(exportPath.toString());
            request.setFileSize((long) fileBytes.length);
            exportRequestRepository.save(request);

            return new ByteArrayResource(fileBytes);
        } catch (Exception e) {
            log.error("Failed to regenerate export file for request {}: {}", id, e.getMessage());
            throw new AppException("Failed to generate export file", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String getExportFileName(Long id) {
        DataExportRequest request = exportRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DataExportRequest", "id", id));
        if (request.getFilePath() != null) {
            return Paths.get(request.getFilePath()).getFileName().toString();
        }
        return generateFileName(request);
    }

    // ==================== SEND EXPORT EMAIL ====================
    @Override
    public MessageDTO sendExportEmail(Long id, SendExportEmailDTO dto) {
        log.info("Sending export email for request id={} to {}", id, dto.getEmail());

        DataExportRequest request = exportRequestRepository.findByIdWithUser(id)
                .orElseThrow(() -> new ResourceNotFoundException("DataExportRequest", "id", id));

        if (request.getStatus() != ExportRequestStatus.COMPLETED || request.getFilePath() == null) {
            throw new AppException("Export file is not ready. Please process the request first.",
                    HttpStatus.BAD_REQUEST);
        }

        try {
            Path path = Paths.get(request.getFilePath());
            byte[] fileBytes = Files.readAllBytes(path);
            String fileName = path.getFileName().toString();

            String email = dto.getEmail() != null ? dto.getEmail() : request.getUser().getEmail();
            String userName = request.getUser().getFullName();

            String subject = "Your Data Export is Ready - MediTech";
            String htmlContent = buildExportEmailHtml(userName, dto.getCustomMessage(), fileName);

            emailService.sendEmailWithAttachment(email, subject, htmlContent, fileBytes, fileName);

            request.setEmailSent(true);
            request.setEmailSentDate(LocalDateTime.now());
            exportRequestRepository.save(request);

            log.info("Export email sent successfully for request {} to {}", id, email);
            return MessageDTO.success("Export email sent successfully to " + email);

        } catch (IOException e) {
            log.error("Failed to read export file for email: {}", e.getMessage());
            throw new AppException("Failed to send email: file not readable", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // ==================== DELETE EXPORT REQUEST ====================
    @Override
    public MessageDTO deleteExportRequest(Long id) {
        log.info("Deleting export request id={}", id);

        DataExportRequest request = exportRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("DataExportRequest", "id", id));

        // Delete the file if exists
        if (request.getFilePath() != null) {
            try {
                Path path = Paths.get(request.getFilePath());
                Files.deleteIfExists(path);
                log.info("Deleted export file: {}", path);
            } catch (IOException e) {
                log.warn("Failed to delete export file: {}", e.getMessage());
            }
        }

        exportRequestRepository.delete(request);
        log.info("Export request {} deleted successfully", id);
        return MessageDTO.success("Export request deleted successfully");
    }

    // ==================== AUTO-PROCESS CONFIG ====================
    @Override
    public AutoProcessConfigDTO toggleAutoProcess(AutoProcessConfigDTO dto) {
        log.info("Toggling auto-process: enabled={}, withinHours={}", dto.getEnabled(), dto.getProcessWithinHours());
        autoProcessEnabled.set(Boolean.TRUE.equals(dto.getEnabled()));
        if (dto.getProcessWithinHours() != null && dto.getProcessWithinHours() > 0) {
            autoProcessWithinHours.set(dto.getProcessWithinHours());
        }
        return getAutoProcessConfig();
    }

    @Override
    @Transactional(readOnly = true)
    public AutoProcessConfigDTO getAutoProcessConfig() {
        return AutoProcessConfigDTO.builder()
                .enabled(autoProcessEnabled.get())
                .processWithinHours(autoProcessWithinHours.get())
                .build();
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Collect all user data based on the export request configuration
     */
    private Map<String, Object> collectUserData(DataExportRequest request) {
        User user = request.getUser();
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("exportInfo", Map.of(
                "requestId", request.getId(),
                "requestedDate", request.getRequestedDate().toString(),
                "exportFormat", request.getExportFormat(),
                "generatedAt", LocalDateTime.now().toString()
        ));

        // Profile data
        if (Boolean.TRUE.equals(request.getIncludeProfile())) {
            Map<String, Object> profile = new LinkedHashMap<>();
            profile.put("id", user.getId());
            profile.put("email", user.getEmail());
            profile.put("fullName", user.getFullName());
            profile.put("phone", user.getPhone());
            profile.put("avatarUrl", user.getAvatarUrl());
            profile.put("isActive", user.getIsActive());
            profile.put("isVerified", user.getIsVerified());
            profile.put("twoFactorEnabled", user.getTwoFactorEnabled());
            profile.put("lastLogin", user.getLastLogin() != null ? user.getLastLogin().toString() : null);
            profile.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);

            // Add patient-specific data if applicable
            patientRepository.findByUserId(user.getId()).ifPresent(patient -> {
                profile.put("dateOfBirth", patient.getDateOfBirth() != null ? patient.getDateOfBirth().toString() : null);
                profile.put("gender", patient.getGender());
                profile.put("address", patient.getAddress());
                profile.put("insuranceNumber", patient.getInsuranceNumber());
                profile.put("insuranceProvider", patient.getInsuranceProvider());
                profile.put("emergencyContact", patient.getEmergencyContact());
                profile.put("bloodGroup", patient.getBloodGroup());
                profile.put("allergies", patient.getAllergies());
                profile.put("medicalHistory", patient.getMedicalHistory());
            });

            data.put("profile", profile);
        }

        // Appointments data
        if (Boolean.TRUE.equals(request.getIncludeAppointments())) {
            Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
            if (patientOpt.isPresent()) {
                List<Appointment> appointments = appointmentRepository.findByPatientId(patientOpt.get().getId());
                List<Map<String, Object>> appointmentList = new ArrayList<>();
                for (Appointment apt : appointments) {
                    Map<String, Object> aptMap = new LinkedHashMap<>();
                    aptMap.put("id", apt.getId());
                    aptMap.put("appointmentDate", apt.getAppointmentDate() != null ? apt.getAppointmentDate().toString() : null);
                    aptMap.put("status", apt.getStatus());
                    aptMap.put("reason", apt.getReasonForVisit());
                    aptMap.put("notes", apt.getNotes());
                    aptMap.put("createdAt", apt.getCreatedAt() != null ? apt.getCreatedAt().toString() : null);
                    appointmentList.add(aptMap);
                }
                data.put("appointments", appointmentList);
            } else {
                data.put("appointments", Collections.emptyList());
            }
        }

        // Prescriptions data
        if (Boolean.TRUE.equals(request.getIncludePrescriptions())) {
            Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
            if (patientOpt.isPresent()) {
                List<Prescription> prescriptions = prescriptionRepository.findByPatientId(patientOpt.get().getId());
                List<Map<String, Object>> prescriptionList = new ArrayList<>();
                for (Prescription p : prescriptions) {
                    Map<String, Object> pMap = new LinkedHashMap<>();
                    pMap.put("id", p.getId());
                    pMap.put("prescriptionDate", p.getPrescriptionDate() != null ? p.getPrescriptionDate().toString() : null);
                    pMap.put("diagnosis", p.getDiagnosis());
                    pMap.put("isActive", p.getIsActive());
                    pMap.put("createdAt", p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
                    // Include prescription items
                    if (p.getItems() != null) {
                        List<Map<String, Object>> items = new ArrayList<>();
                        for (PrescriptionItem item : p.getItems()) {
                            Map<String, Object> itemMap = new LinkedHashMap<>();
                            itemMap.put("medicationName", item.getMedicineName());
                            itemMap.put("dosage", item.getDosage());
                            itemMap.put("frequency", item.getFrequency());
                            itemMap.put("duration", item.getDuration());
                            itemMap.put("instructions", item.getInstructions());
                            items.add(itemMap);
                        }
                        pMap.put("items", items);
                    }
                    prescriptionList.add(pMap);
                }
                data.put("prescriptions", prescriptionList);
            } else {
                data.put("prescriptions", Collections.emptyList());
            }
        }

        // Payments data
        if (Boolean.TRUE.equals(request.getIncludePayments())) {
            Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
            if (patientOpt.isPresent()) {
                List<Payment> payments = paymentRepository.findByPatientIdOrderByCreatedAtDesc(patientOpt.get().getId());
                List<Map<String, Object>> paymentList = new ArrayList<>();
                for (Payment pay : payments) {
                    Map<String, Object> payMap = new LinkedHashMap<>();
                    payMap.put("id", pay.getId());
                    payMap.put("amount", pay.getAmount());
                    payMap.put("status", pay.getPaymentStatus());
                    payMap.put("paymentMethod", pay.getPaymentMethod());
                    payMap.put("createdAt", pay.getCreatedAt() != null ? pay.getCreatedAt().toString() : null);
                    paymentList.add(payMap);
                }
                data.put("payments", paymentList);
            } else {
                data.put("payments", Collections.emptyList());
            }
        }

        // Reviews data
        if (Boolean.TRUE.equals(request.getIncludeReviews())) {
            // Reviews are linked via appointments → patient
            Optional<Patient> patientOpt = patientRepository.findByUserId(user.getId());
            if (patientOpt.isPresent()) {
                List<Appointment> appointments = appointmentRepository.findByPatientId(patientOpt.get().getId());
                List<Map<String, Object>> reviewList = new ArrayList<>();
                for (Appointment apt : appointments) {
                    reviewRepository.findByAppointmentId(apt.getId()).ifPresent(review -> {
                        Map<String, Object> rMap = new LinkedHashMap<>();
                        rMap.put("id", review.getId());
                        rMap.put("rating", review.getRating());
                        rMap.put("comment", review.getComment());
                        rMap.put("createdAt", review.getCreatedAt() != null ? review.getCreatedAt().toString() : null);
                        reviewList.add(rMap);
                    });
                }
                data.put("reviews", reviewList);
            } else {
                data.put("reviews", Collections.emptyList());
            }
        }

        // Activity logs placeholder
        if (Boolean.TRUE.equals(request.getIncludeActivityLogs())) {
            // Activity logs - collect login/session info
            List<Map<String, Object>> activityLogs = new ArrayList<>();
            Map<String, Object> loginInfo = new LinkedHashMap<>();
            loginInfo.put("lastLogin", user.getLastLogin() != null ? user.getLastLogin().toString() : null);
            loginInfo.put("accountCreated", user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
            loginInfo.put("failedLoginCount", user.getFailedLoginCount());
            activityLogs.add(loginInfo);
            data.put("activityLogs", activityLogs);
        }

        return data;
    }

    /**
     * Generate export file bytes based on format
     */
    private byte[] generateExportFile(Map<String, Object> data, String format) throws IOException {
        switch (format.toUpperCase()) {
            case "CSV":
                return generateCsvExport(data);
            case "PDF":
                return generatePdfExport(data);
            case "JSON":
            default:
                return generateJsonExport(data);
        }
    }

    private byte[] generateJsonExport(Map<String, Object> data) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.enable(SerializationFeature.INDENT_OUTPUT);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper.writeValueAsBytes(data);
    }

    private byte[] generateCsvExport(Map<String, Object> data) {
        StringBuilder csv = new StringBuilder();
        csv.append("Section,Key,Value\n");

        for (Map.Entry<String, Object> section : data.entrySet()) {
            String sectionName = section.getKey();
            Object value = section.getValue();

            if (value instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> map = (Map<String, Object>) value;
                for (Map.Entry<String, Object> entry : map.entrySet()) {
                    csv.append(escapeCsv(sectionName)).append(",")
                            .append(escapeCsv(entry.getKey())).append(",")
                            .append(escapeCsv(String.valueOf(entry.getValue()))).append("\n");
                }
            } else if (value instanceof List) {
                @SuppressWarnings("unchecked")
                List<Object> list = (List<Object>) value;
                for (int i = 0; i < list.size(); i++) {
                    Object item = list.get(i);
                    if (item instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> map = (Map<String, Object>) item;
                        for (Map.Entry<String, Object> entry : map.entrySet()) {
                            csv.append(escapeCsv(sectionName + "[" + i + "]")).append(",")
                                    .append(escapeCsv(entry.getKey())).append(",")
                                    .append(escapeCsv(String.valueOf(entry.getValue()))).append("\n");
                        }
                    }
                }
            }
        }

        return csv.toString().getBytes();
    }

    private byte[] generatePdfExport(Map<String, Object> data) throws IOException {
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        try (com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(baos);
             com.itextpdf.kernel.pdf.PdfDocument pdf = new com.itextpdf.kernel.pdf.PdfDocument(writer);
             com.itextpdf.layout.Document document = new com.itextpdf.layout.Document(pdf)) {

            // Title
            document.add(new com.itextpdf.layout.element.Paragraph("MEDITECH DATA EXPORT")
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER));

            document.add(new com.itextpdf.layout.element.Paragraph("Generated: " +
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")))
                    .setFontSize(10)
                    .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER));

            document.add(new com.itextpdf.layout.element.Paragraph("\n"));

            for (Map.Entry<String, Object> section : data.entrySet()) {
                // Section header
                document.add(new com.itextpdf.layout.element.Paragraph(section.getKey().toUpperCase())
                        .setFontSize(14)
                        .setBold()
                        .setMarginTop(10));

                Object value = section.getValue();

                if (value instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> map = (Map<String, Object>) value;
                    for (Map.Entry<String, Object> entry : map.entrySet()) {
                        document.add(new com.itextpdf.layout.element.Paragraph(
                                entry.getKey() + ": " + entry.getValue())
                                .setFontSize(10)
                                .setMarginLeft(20));
                    }
                } else if (value instanceof List) {
                    @SuppressWarnings("unchecked")
                    List<Object> list = (List<Object>) value;
                    for (int i = 0; i < list.size(); i++) {
                        Object item = list.get(i);
                        if (item instanceof Map) {
                            document.add(new com.itextpdf.layout.element.Paragraph("[" + (i + 1) + "]")
                                    .setFontSize(10)
                                    .setBold()
                                    .setMarginLeft(15));
                            @SuppressWarnings("unchecked")
                            Map<String, Object> map = (Map<String, Object>) item;
                            for (Map.Entry<String, Object> entry : map.entrySet()) {
                                document.add(new com.itextpdf.layout.element.Paragraph(
                                        entry.getKey() + ": " + entry.getValue())
                                        .setFontSize(10)
                                        .setMarginLeft(30));
                            }
                        }
                    }
                }
            }
        }
        return baos.toByteArray();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    /**
     * Generate filename for the export file
     */
    private String generateFileName(DataExportRequest request) {
        String format = request.getExportFormat() != null ? request.getExportFormat().toLowerCase() : "json";
        String extension = switch (format) {
            case "csv" -> ".csv";
            case "pdf" -> ".pdf";
            default -> ".json";
        };
        return String.format("data_export_%d_user_%d_%s%s",
                request.getId(),
                request.getUser().getId(),
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")),
                extension);
    }

    /**
     * Save export file to disk
     */
    private Path saveExportFile(byte[] data, String fileName) throws IOException {
        Path exportDir = Paths.get(EXPORT_DIR);
        if (!Files.exists(exportDir)) {
            Files.createDirectories(exportDir);
        }
        Path filePath = exportDir.resolve(fileName);
        Files.write(filePath, data);
        return filePath;
    }

    /**
     * Send email notifying user that their export is ready
     */
    private void sendExportReadyEmail(String email, String userName, byte[] fileBytes, String fileName) {
        String subject = "Your Data Export is Ready - MediTech";
        String htmlContent = buildExportEmailHtml(userName, null, fileName);
        emailService.sendEmailWithAttachment(email, subject, htmlContent, fileBytes, fileName);
    }

    /**
     * Build HTML content for the export email
     */
    private String buildExportEmailHtml(String userName, String customMessage, String fileName) {
        StringBuilder html = new StringBuilder();
        html.append("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>");
        html.append("<h2 style='color: #2563eb;'>MediTech - Data Export Ready</h2>");
        html.append("<p>Dear ").append(userName != null ? userName : "User").append(",</p>");
        html.append("<p>Your data export request has been processed successfully. ");
        html.append("Please find the exported file <strong>").append(fileName).append("</strong> attached to this email.</p>");

        if (customMessage != null && !customMessage.isEmpty()) {
            html.append("<div style='background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;'>");
            html.append("<p style='margin: 0;'><strong>Admin Message:</strong></p>");
            html.append("<p style='margin: 8px 0 0;'>").append(customMessage).append("</p>");
            html.append("</div>");
        }

        html.append("<p>This export contains your personal data as requested under GDPR regulations. ");
        html.append("If you have any questions, please contact our support team.</p>");
        html.append("<hr style='border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;'/>");
        html.append("<p style='color: #6b7280; font-size: 12px;'>This is an automated email from MediTech. ");
        html.append("Please do not reply to this email.</p>");
        html.append("</div>");

        return html.toString();
    }
}
