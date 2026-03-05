package com.q2k.meditech.aspect;

import com.q2k.meditech.annotation.Auditable;
import com.q2k.meditech.entity.AuditLog;
import com.q2k.meditech.entity.User;
import com.q2k.meditech.repository.AuditLogRepository;
import com.q2k.meditech.repository.UserRepository;
import com.q2k.meditech.service.GeoLocationService;
import com.q2k.meditech.util.HttpRequestUtil;
import com.q2k.meditech.util.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.DefaultParameterNameDiscoverer;
import org.springframework.core.ParameterNameDiscoverer;
import org.springframework.expression.EvaluationContext;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

/**
 * AOP Aspect that intercepts methods annotated with {@link Auditable}
 * and automatically creates audit log entries.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;
    private final GeoLocationService geoLocationService;

    private final ExpressionParser parser = new SpelExpressionParser();
    private final ParameterNameDiscoverer parameterNameDiscoverer = new DefaultParameterNameDiscoverer();

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint joinPoint, Auditable auditable) throws Throwable {
        // Execute the actual method
        Object result = joinPoint.proceed();

        try {
            createAuditLog(joinPoint, auditable, result);
        } catch (Exception e) {
            // Never let audit logging failures break business logic
            log.error("Failed to create audit log for action: {} - {}", auditable.action(), e.getMessage(), e);
        }

        return result;
    }

    private void createAuditLog(ProceedingJoinPoint joinPoint, Auditable auditable, Object result) {
        // Get current HTTP request (if available)
        String ipAddress = null;
        String userAgent = null;
        String requestUrl = null;
        String requestMethod = null;

        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest request = attrs.getRequest();
            ipAddress = HttpRequestUtil.getClientIp(request);
            userAgent = request.getHeader("User-Agent");
            requestUrl = request.getRequestURI();
            requestMethod = request.getMethod();
        }

        // Resolve current user
        Long currentUserId = SecurityUtil.getCurrentUserId();
        User user = null;
        if (currentUserId != null) {
            user = userRepository.findById(currentUserId).orElse(null);
        }

        // Resolve entity ID from SpEL expression
        Long entityId = resolveEntityId(joinPoint, auditable, result);

        // Capture new value if configured
        Object newValues = null;
        if (auditable.captureNewValue() && result != null) {
            newValues = result;
        }

        // Geo-location lookup
        String geoCountry = null;
        String geoCity = null;
        if (ipAddress != null) {
            GeoLocationService.GeoInfo geo = geoLocationService.lookup(ipAddress);
            if (geo != null) {
                geoCountry = geo.getCountry();
                geoCity = geo.getCity();
            }
        }

        // Build and persist audit log
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .action(auditable.action())
                .actionType(auditable.actionType())
                .entityType(auditable.entityType())
                .entityId(entityId)
                .newValues(newValues)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .requestUrl(requestUrl)
                .requestMethod(requestMethod)
                .geoCountry(geoCountry)
                .geoCity(geoCity)
                .createdAt(LocalDateTime.now())
                .build();

        auditLogRepository.save(auditLog);
        log.debug("Audit log created: action={}, entity={}#{}", auditable.action(), auditable.entityType(), entityId);
    }

    /**
     * Resolve entity ID using SpEL expression from annotation.
     */
    private Long resolveEntityId(ProceedingJoinPoint joinPoint, Auditable auditable, Object result) {
        String expression = auditable.entityIdExpression();
        if (expression == null || expression.isBlank()) {
            return null;
        }

        try {
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            String[] paramNames = parameterNameDiscoverer.getParameterNames(signature.getMethod());
            Object[] args = joinPoint.getArgs();

            EvaluationContext context = new StandardEvaluationContext();
            if (paramNames != null) {
                for (int i = 0; i < paramNames.length; i++) {
                    ((StandardEvaluationContext) context).setVariable(paramNames[i], args[i]);
                }
            }
            ((StandardEvaluationContext) context).setVariable("result", result);

            Object value = parser.parseExpression(expression).getValue(context);
            if (value instanceof Long) return (Long) value;
            if (value instanceof Number) return ((Number) value).longValue();
            if (value instanceof String) return Long.parseLong((String) value);
        } catch (Exception e) {
            log.warn("Failed to resolve entityId from expression '{}': {}", expression, e.getMessage());
        }

        return null;
    }
}
