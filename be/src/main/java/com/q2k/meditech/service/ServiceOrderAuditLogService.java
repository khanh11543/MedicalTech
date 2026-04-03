package com.q2k.meditech.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.q2k.meditech.dto.ServiceOrderAuditLogDTO;
import com.q2k.meditech.dto.ServiceOrderAuditLogDetailDTO;
import com.q2k.meditech.dto.ServiceOrderAuditLogFilterDTO;
import com.q2k.meditech.entity.ServiceOrderAuditLog;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.ServiceOrderAuditLogRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.util.HttpRequestUtil;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ServiceOrderAuditLogService {

    private final ServiceOrderAuditLogRepository repository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    // ──────────────────────────────────────────────────────────────
    //  LOGGING HELPER — call from workflow services / controllers
    // ──────────────────────────────────────────────────────────────

    /**
     * Record a service-order workflow event.
     * Runs in a NEW transaction so a rollback in the caller won't lose the log.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(LogEventRequest req) {
        try {
            String ipAddress = null;
            String userAgent = null;

            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest httpReq = attrs.getRequest();
                ipAddress = HttpRequestUtil.getClientIp(httpReq);
                userAgent = httpReq.getHeader("User-Agent");
            }

            // Resolve actor
            User actor = null;
            String actorName = req.actorName;
            String actorRole = req.actorRole;
            Long currentUserId = SecurityUtil.getCurrentUserId();
            if (currentUserId != null) {
                actor = userRepository.findById(currentUserId).orElse(null);
                if (actor != null && actorName == null) {
                    actorName = actor.getFullName();
                }
                if (actor != null && actorRole == null) {
                    actorRole = actor.getUserRoles() != null && !actor.getUserRoles().isEmpty()
                            ? actor.getUserRoles().iterator().next().getRole().getName()
                            : "UNKNOWN";
                }
            }

            ServiceOrderAuditLog entry = ServiceOrderAuditLog.builder()
                    .eventType(req.eventType)
                    .actorUser(actor)
                    .actorName(actorName)
                    .actorRole(actorRole)
                    .appointmentId(req.appointmentId)
                    .consultationId(req.consultationId)
                    .patientId(req.patientId)
                    .patientName(req.patientName)
                    .serviceOrderId(req.serviceOrderId)
                    .serviceResultId(req.serviceResultId)
                    .summary(req.summary)
                    .beforeData(toJson(req.beforeData))
                    .afterData(toJson(req.afterData))
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .createdAt(LocalDateTime.now())
                    .build();

            repository.save(entry);
            log.debug("Service-order audit logged: {} for SO#{}", req.eventType, req.serviceOrderId);
        } catch (Exception e) {
            // Never let audit logging break the business flow
            log.error("Failed to record service-order audit log: {}", e.getMessage(), e);
        }
    }

    /** Convenience builder for callers */
    public static LogEventRequest event(String eventType) {
        return new LogEventRequest(eventType);
    }

    // ──────────────────────────────────────────────────────────────
    //  QUERY APIs (for the admin controller)
    // ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<ServiceOrderAuditLogDTO> getAuditLogs(ServiceOrderAuditLogFilterDTO filter) {
        int page = filter.getPageNumber() != null ? filter.getPageNumber() : 0;
        int size = filter.getPageSize() != null ? filter.getPageSize() : 20;
        String sortField = filter.getSortBy() != null ? filter.getSortBy() : "createdAt";
        Sort.Direction dir = "ASC".equalsIgnoreCase(filter.getSortDir()) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(dir, sortField));

        Specification<ServiceOrderAuditLog> spec = buildSpec(filter);
        return repository.findAll(spec, pageable).map(this::toDTO);
    }

    @Transactional(readOnly = true)
    public ServiceOrderAuditLogDetailDTO getDetail(Long id) {
        ServiceOrderAuditLog log = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Audit log not found: " + id));
        return toDetailDTO(log);
    }

    @Transactional(readOnly = true)
    public List<ServiceOrderAuditLogDTO> getTimeline(Long appointmentId) {
        return repository.findByAppointmentIdOrderByCreatedAtAsc(appointmentId)
                .stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<String> getEventTypes() {
        return repository.findDistinctEventTypes();
    }

    // ──────────────────────────────────────────────────────────────
    //  INTERNAL
    // ──────────────────────────────────────────────────────────────

    private Specification<ServiceOrderAuditLog> buildSpec(ServiceOrderAuditLogFilterDTO f) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (f.getEventTypes() != null && !f.getEventTypes().isEmpty()) {
                predicates.add(root.get("eventType").in(f.getEventTypes()));
            }
            if (f.getRoles() != null && !f.getRoles().isEmpty()) {
                predicates.add(root.get("actorRole").in(f.getRoles()));
            }
            if (f.getAppointmentId() != null) {
                predicates.add(cb.equal(root.get("appointmentId"), f.getAppointmentId()));
            }
            if (f.getServiceOrderId() != null) {
                predicates.add(cb.equal(root.get("serviceOrderId"), f.getServiceOrderId()));
            }
            if (f.getFrom() != null && !f.getFrom().isBlank()) {
                LocalDateTime from = LocalDateTime.parse(f.getFrom(), DateTimeFormatter.ISO_DATE_TIME);
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (f.getTo() != null && !f.getTo().isBlank()) {
                LocalDateTime to = LocalDateTime.parse(f.getTo(), DateTimeFormatter.ISO_DATE_TIME);
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            if (f.getSearch() != null && !f.getSearch().isBlank()) {
                String kw = "%" + f.getSearch().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("summary")), kw),
                        cb.like(cb.lower(root.get("actorName")), kw),
                        cb.like(cb.lower(root.get("patientName")), kw)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private ServiceOrderAuditLogDTO toDTO(ServiceOrderAuditLog e) {
        return ServiceOrderAuditLogDTO.builder()
                .id(e.getId())
                .eventType(e.getEventType())
                .actorName(e.getActorName())
                .actorRole(e.getActorRole())
                .patientName(e.getPatientName())
                .appointmentId(e.getAppointmentId())
                .serviceOrderId(e.getServiceOrderId())
                .summary(e.getSummary())
                .createdAt(e.getCreatedAt())
                .build();
    }

    private ServiceOrderAuditLogDetailDTO toDetailDTO(ServiceOrderAuditLog e) {
        Object before = parseJson(e.getBeforeData());
        Object after = parseJson(e.getAfterData());

        return ServiceOrderAuditLogDetailDTO.builder()
                .id(e.getId())
                .eventType(e.getEventType())
                .actorName(e.getActorName())
                .actorRole(e.getActorRole())
                .createdAt(e.getCreatedAt())
                .appointmentId(e.getAppointmentId())
                .consultationId(e.getConsultationId())
                .patientId(e.getPatientId())
                .patientName(e.getPatientName())
                .serviceOrderId(e.getServiceOrderId())
                .serviceResultId(e.getServiceResultId())
                .summary(e.getSummary())
                .beforeData(before)
                .afterData(after)
                .ipAddress(e.getIpAddress())
                .userAgent(e.getUserAgent())
                .build();
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        if (obj instanceof String) return (String) obj;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize audit data: {}", e.getMessage());
            return null;
        }
    }

    private Object parseJson(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception e) {
            return json;
        }
    }

    // ──────────────────────────────────────────────────────────────
    //  Request builder
    // ──────────────────────────────────────────────────────────────

    public static class LogEventRequest {
        String eventType;
        String actorName;
        String actorRole;
        Long appointmentId;
        Long consultationId;
        Long patientId;
        String patientName;
        Long serviceOrderId;
        Long serviceResultId;
        String summary;
        Object beforeData;
        Object afterData;

        LogEventRequest(String eventType) { this.eventType = eventType; }

        public LogEventRequest actor(String name, String role) { this.actorName = name; this.actorRole = role; return this; }
        public LogEventRequest appointment(Long id) { this.appointmentId = id; return this; }
        public LogEventRequest consultation(Long id) { this.consultationId = id; return this; }
        public LogEventRequest patient(Long id, String name) { this.patientId = id; this.patientName = name; return this; }
        public LogEventRequest serviceOrder(Long id) { this.serviceOrderId = id; return this; }
        public LogEventRequest serviceResult(Long id) { this.serviceResultId = id; return this; }
        public LogEventRequest summary(String s) { this.summary = s; return this; }
        public LogEventRequest before(Object data) { this.beforeData = data; return this; }
        public LogEventRequest after(Object data) { this.afterData = data; return this; }
    }
}
