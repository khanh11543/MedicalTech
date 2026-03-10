package com.q2k.meditech.annotation;

import com.q2k.meditech.entity.enums.AuditActionType;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark service methods for automatic audit logging via AOP.
 * <p>
 * When placed on a service method, the AuditAspect will automatically
 * record the action in the audit_logs table including user, IP, timestamps,
 * and optionally the old/new entity values.
 * </p>
 *
 * <pre>
 * &#64;Auditable(action = "CREATE_USER", actionType = AuditActionType.CREATE, entityType = "User")
 * public UserDTO createUser(CreateUserDTO dto) { ... }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {

    /**
     * Human-readable action name, e.g. "CREATE_USER", "UPDATE_APPOINTMENT".
     */
    String action();

    /**
     * Audit action type category.
     */
    AuditActionType actionType() default AuditActionType.UPDATE;

    /**
     * Entity type being audited, e.g. "User", "Appointment", "Payment".
     */
    String entityType() default "";

    /**
     * SpEL expression to extract the entity ID from the method arguments or return value.
     * Examples: "#id", "#dto.id", "#result.id"
     */
    String entityIdExpression() default "";

    /**
     * Whether to capture old values (before the operation) by loading the entity first.
     * Only applicable for UPDATE and DELETE actions.
     */
    boolean captureOldValue() default false;

    /**
     * Whether to capture the return value as the new value.
     */
    boolean captureNewValue() default false;
}
