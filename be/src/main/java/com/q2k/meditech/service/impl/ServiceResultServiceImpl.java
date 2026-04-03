package com.q2k.meditech.service.impl;

import com.q2k.meditech.dto.*;
import com.q2k.meditech.entity.*;
import com.q2k.meditech.entity.enums.ConsultationStatus;
import com.q2k.meditech.entity.enums.ServiceOrderStatus;
import com.q2k.meditech.repository.*;
import com.q2k.meditech.service.FileStorageService;
import com.q2k.meditech.service.ServiceOrderAuditLogService;
import com.q2k.meditech.service.ServiceResultService;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceResultServiceImpl implements ServiceResultService {

    private final ServiceResultRepository serviceResultRepository;
    private final ServiceOrderRepository serviceOrderRepository;
    private final ConsultationRepository consultationRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final ServiceOrderAuditLogService soAuditLogService;

    @Override
    @Transactional
    public ServiceResultDTO saveResult(Long serviceOrderId, ServiceResultCreateDTO dto) {
        log.info("Saving service result for order ID: {}, markCompleted: {}", serviceOrderId, dto.getMarkCompleted());

        ServiceOrder order = serviceOrderRepository.findById(serviceOrderId)
                .orElseThrow(() -> new EntityNotFoundException("Service order not found: " + serviceOrderId));

        // Must be IN_PROGRESS to enter results
        if (order.getStatus() != ServiceOrderStatus.IN_PROGRESS) {
            throw new IllegalStateException("Service order must be IN_PROGRESS to enter results. Current: " + order.getStatus());
        }

        Long currentUserId = SecurityUtil.getCurrentUserId();
        Doctor currentDoctor = doctorRepository.findByUserId(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("Doctor profile not found"));

        // Verify current doctor is the assigned doctor
        if (order.getAssignedDoctor() == null || !order.getAssignedDoctor().getId().equals(currentDoctor.getId())) {
            throw new IllegalStateException("Only the assigned doctor can enter results for this service order");
        }

        // Find or create the result
        ServiceResult result = serviceResultRepository.findByServiceOrderId(serviceOrderId)
                .orElseGet(() -> ServiceResult.builder()
                        .serviceOrder(order)
                        .build());

        result.setFindings(dto.getFindings());
        result.setConclusion(dto.getConclusion());
        result.setNotes(dto.getNotes());
        result.setCompletedByDoctor(currentDoctor);

        if (Boolean.TRUE.equals(dto.getMarkCompleted())) {
            result.setIsDraft(false);
            result.setCompletedAt(LocalDateTime.now());

            // Update service order status
            order.setStatus(ServiceOrderStatus.COMPLETED);
            order.setCompletedAt(LocalDateTime.now());
            order.setPerformedBy(currentDoctor.getFullName());
            order.setResult(dto.getConclusion()); // Store conclusion as summary
            order.setServiceResult(result);
            serviceOrderRepository.save(order);

            // Check if all service orders for this appointment are completed
            checkAndUpdateConsultationStatus(order.getAppointment().getId());

            // Audit log
            String patientName = null; Long patientId = null;
            try {
                if (order.getAppointment().getPatient() != null && order.getAppointment().getPatient().getUser() != null) {
                    patientName = order.getAppointment().getPatient().getUser().getFullName();
                    patientId = order.getAppointment().getPatient().getId();
                }
            } catch (Exception ignored) {}
            soAuditLogService.logEvent(
                    ServiceOrderAuditLogService.event("SERVICE_RESULT_COMPLETED")
                            .appointment(order.getAppointment().getId())
                            .consultation(order.getConsultation().getId())
                            .patient(patientId, patientName)
                            .serviceOrder(serviceOrderId)
                            .serviceResult(result.getId())
                            .summary("Dr. " + currentDoctor.getFullName() + " completed result for " + order.getServiceName())
                            .before(java.util.Map.of("status", "IN_PROGRESS"))
                            .after(java.util.Map.of("status", "COMPLETED", "conclusion", dto.getConclusion() != null ? dto.getConclusion() : ""))
            );
        } else {
            result.setIsDraft(true);
        }

        ServiceResult saved = serviceResultRepository.save(result);
        log.info("Service result saved, ID: {}, draft: {}", saved.getId(), saved.getIsDraft());

        return toDTO(saved, order);
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceResultDTO getResultByServiceOrderId(Long serviceOrderId) {
        ServiceResult result = serviceResultRepository.findByServiceOrderIdWithAttachments(serviceOrderId)
                .orElseThrow(() -> new EntityNotFoundException("No result found for service order: " + serviceOrderId));

        ServiceOrder order = result.getServiceOrder();
        return toDTO(result, order);
    }

    @Override
    @Transactional
    public ServiceResultDTO uploadAttachment(Long serviceOrderId, MultipartFile file) {
        log.info("Uploading attachment for service order ID: {}, file: {}", serviceOrderId, file.getOriginalFilename());

        ServiceOrder order = serviceOrderRepository.findById(serviceOrderId)
                .orElseThrow(() -> new EntityNotFoundException("Service order not found: " + serviceOrderId));

        ServiceResult result = serviceResultRepository.findByServiceOrderId(serviceOrderId)
                .orElseGet(() -> {
                    Long currentUserId = SecurityUtil.getCurrentUserId();
                    Doctor currentDoctor = doctorRepository.findByUserId(currentUserId)
                            .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));
                    ServiceResult newResult = ServiceResult.builder()
                            .serviceOrder(order)
                            .completedByDoctor(currentDoctor)
                            .build();
                    return serviceResultRepository.save(newResult);
                });

        // Upload file
        String fileUrl = fileStorageService.uploadFile("service-results", file);

        ServiceResultAttachment attachment = ServiceResultAttachment.builder()
                .serviceResult(result)
                .fileName(file.getOriginalFilename())
                .fileUrl(fileUrl)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .build();

        result.addAttachment(attachment);
        ServiceResult saved = serviceResultRepository.save(result);

        return toDTO(saved, order);
    }

    @Override
    @Transactional
    public void deleteAttachment(Long serviceOrderId, Long attachmentId) {
        ServiceResult result = serviceResultRepository.findByServiceOrderIdWithAttachments(serviceOrderId)
                .orElseThrow(() -> new EntityNotFoundException("No result found for service order: " + serviceOrderId));

        result.getAttachments().stream()
                .filter(a -> a.getId().equals(attachmentId))
                .findFirst()
                .ifPresent(a -> fileStorageService.deleteFile(a.getFileUrl()));

        result.getAttachments().removeIf(a -> a.getId().equals(attachmentId));
        serviceResultRepository.save(result);
    }

    /**
     * Check if all service orders for the appointment are COMPLETED or CANCELLED.
     * If so, update consultation status to READY_TO_FINALIZE.
     */
    private void checkAndUpdateConsultationStatus(Long appointmentId) {
        List<ServiceOrderStatus> pendingStatuses = List.of(
                ServiceOrderStatus.ORDERED,
                ServiceOrderStatus.PENDING_PAYMENT,
                ServiceOrderStatus.PAID,
                ServiceOrderStatus.IN_PROGRESS
        );

        boolean hasPending = serviceOrderRepository.existsByAppointmentIdAndStatusIn(appointmentId, pendingStatuses);

        if (!hasPending) {
            consultationRepository.findByAppointmentId(appointmentId).ifPresent(consultation -> {
                if (ConsultationStatus.AWAITING_RESULTS.equals(consultation.getStatus())) {
                    consultation.setStatus(ConsultationStatus.READY_TO_FINALIZE);
                    consultationRepository.save(consultation);
                    log.info("Consultation for appointment {} updated to READY_TO_FINALIZE", appointmentId);
                }
            });
        }
    }

    private ServiceResultDTO toDTO(ServiceResult result, ServiceOrder order) {
        String completedByName = null;
        Long completedById = null;
        if (result.getCompletedByDoctor() != null) {
            completedByName = result.getCompletedByDoctor().getFullName();
            completedById = result.getCompletedByDoctor().getId();
        }

        String patientName = null;
        if (order.getAppointment() != null && order.getAppointment().getPatient() != null
                && order.getAppointment().getPatient().getUser() != null) {
            patientName = order.getAppointment().getPatient().getUser().getFullName();
        }

        String appointmentCode = null;
        if (order.getAppointment() != null) {
            appointmentCode = order.getAppointment().getAppointmentCode();
        }

        String orderedByName = null;
        if (order.getOrderedByDoctor() != null && order.getOrderedByDoctor().getUser() != null) {
            orderedByName = order.getOrderedByDoctor().getUser().getFullName();
        }

        List<ServiceResultAttachmentDTO> attachmentDTOs = List.of();
        if (result.getAttachments() != null) {
            attachmentDTOs = result.getAttachments().stream()
                    .map(a -> ServiceResultAttachmentDTO.builder()
                            .id(a.getId())
                            .fileName(a.getFileName())
                            .fileUrl(a.getFileUrl())
                            .fileType(a.getFileType())
                            .fileSize(a.getFileSize())
                            .build())
                    .collect(Collectors.toList());
        }

        return ServiceResultDTO.builder()
                .id(result.getId())
                .serviceOrderId(order.getId())
                .findings(result.getFindings())
                .conclusion(result.getConclusion())
                .notes(result.getNotes())
                .completedByDoctorName(completedByName)
                .completedByDoctorId(completedById)
                .completedAt(result.getCompletedAt())
                .isDraft(result.getIsDraft())
                .attachments(attachmentDTOs)
                .serviceName(order.getServiceName())
                .category(order.getCategory() != null ? order.getCategory().name() : null)
                .patientName(patientName)
                .appointmentCode(appointmentCode)
                .orderedByDoctorName(orderedByName)
                .createdAt(result.getCreatedAt())
                .updatedAt(result.getUpdatedAt())
                .build();
    }
}
