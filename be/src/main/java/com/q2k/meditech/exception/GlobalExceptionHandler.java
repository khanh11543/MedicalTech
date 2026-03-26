package com.q2k.meditech.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.stream.Collectors;

/**
 * Global Exception Handler
 * Handles all exceptions in the application and returns a consistent
 * response format
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

        private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        /**
         * Get current timestamp as formatted string
         */
        private String getCurrentTimestamp() {
                return LocalDateTime.now().format(FORMATTER);
        }

        /**
         * Handle ResourceNotFoundException (404)
         */
        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiErrorResponse> handleResourceNotFoundException(
                        ResourceNotFoundException ex,
                        WebRequest request) {

                ApiErrorResponse error = ApiErrorResponse.builder()
                                .timestamp(getCurrentTimestamp())
                                .status(HttpStatus.NOT_FOUND.value())
                                .error(HttpStatus.NOT_FOUND.getReasonPhrase())
                                .message(ex.getMessage())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .build();

                return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
        }

    /**
     * Handle MethodArgumentTypeMismatchException (400)
     * This happens when path variable cannot be converted (e.g., {id} instead of a number)
     */
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentTypeMismatchException (
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex,
            WebRequest request) {
        
        Class<?> requiredType = ex.getRequiredType();
        String message = String.format("Invalid value '%s' for parameter '%s'. Expected type: %s",
                ex.getValue(), ex.getName(), 
                requiredType != null ? requiredType.getSimpleName() : "unknown");
        
        ApiErrorResponse error = ApiErrorResponse.builder()
                .timestamp(getCurrentTimestamp())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(message)
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle missing static resources (404) — e.g. deleted avatar files
     */
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResourceFound(
            org.springframework.web.servlet.resource.NoResourceFoundException ex,
            WebRequest request) {

        log.debug("Static resource not found: {}", ex.getMessage());

        ApiErrorResponse error = ApiErrorResponse.builder()
                .timestamp(getCurrentTimestamp())
                .status(HttpStatus.NOT_FOUND.value())
                .error(HttpStatus.NOT_FOUND.getReasonPhrase())
                .message("Resource not found")
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /**
     * Handle validation errors (400)
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex,
            WebRequest request) {

        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));

        ApiErrorResponse error = ApiErrorResponse.builder()
                .timestamp(getCurrentTimestamp())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(message)
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle AppException and subclasses (AppointmentException, etc.)
     * Returns the HTTP status defined in the exception itself.
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiErrorResponse> handleAppException(
            AppException ex,
            WebRequest request) {

        HttpStatus status = ex.getStatus() != null ? ex.getStatus() : HttpStatus.BAD_REQUEST;

        log.warn("Application exception [{}]: {}", ex.getClass().getSimpleName(), ex.getMessage());

        ApiErrorResponse error = ApiErrorResponse.builder()
                .timestamp(getCurrentTimestamp())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return new ResponseEntity<>(error, status);
    }

    /**
     * Handle BadRequestException (400)
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleBadRequestException(
            BadRequestException ex,
            WebRequest request) {

        log.warn("Bad request: {}", ex.getMessage());

        ApiErrorResponse error = ApiErrorResponse.builder()
                .timestamp(getCurrentTimestamp())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle AccountLockedException (429 Too Many Requests)
     */
    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccountLockedException(
            AccountLockedException ex,
            WebRequest request) {

        log.warn("Account/IP locked: {}", ex.getMessage());

        ApiErrorResponse error = ApiErrorResponse.builder()
                .timestamp(getCurrentTimestamp())
                .status(HttpStatus.TOO_MANY_REQUESTS.value())
                .error(HttpStatus.TOO_MANY_REQUESTS.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return new ResponseEntity<>(error, HttpStatus.TOO_MANY_REQUESTS);
    }

    /**
     * Handle duplicate resource (e.g. email or phone already registered) — return 409 with message for UI
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicateResourceException(
            DuplicateResourceException ex,
            WebRequest request) {
        log.warn("Duplicate resource: {}", ex.getMessage());
        ApiErrorResponse error = ApiErrorResponse.builder()
                .timestamp(getCurrentTimestamp())
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    /**
     * Handle database constraint violations (409) — e.g. unique keys.
     * This prevents leaking raw SQL errors to UI and avoids 500s for duplicates.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex,
            WebRequest request) {

        String raw = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : ex.getMessage();
        String msg = "Data integrity violation";

        if (raw != null) {
            // MySQL duplicate key pattern: "Duplicate entry '205' for key 'rooms.uk_rooms_room_number'"
            if (raw.contains("Duplicate entry") && raw.contains("uk_rooms_room_number")) {
                msg = "Room number already exists";
            } else if (raw.contains("Duplicate entry")) {
                msg = "Duplicate entry";
            }
        }

        log.warn("Data integrity violation: {}", raw);

        ApiErrorResponse error = ApiErrorResponse.builder()
                .timestamp(getCurrentTimestamp())
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message(msg)
                .path(request.getDescription(false).replace("uri=", ""))
                .build();

        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    /**
     * Handle bad credentials (wrong email/password) — return 401 so frontend shows correct message
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiErrorResponse> handleBadCredentialsException(
            BadCredentialsException ex,
            WebRequest request) {
        log.warn("Login failed: {}", ex.getMessage());
        ApiErrorResponse error = ApiErrorResponse.builder()
                .timestamp(getCurrentTimestamp())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    /**
     * Handle JPA EntityNotFoundException (404)
     * When an entity is not found in the database
     */
    @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleEntityNotFoundException(
            jakarta.persistence.EntityNotFoundException ex,
            WebRequest request) {
        log.warn("Entity not found: {}", ex.getMessage());
        ApiErrorResponse error = ApiErrorResponse.builder()
                .timestamp(getCurrentTimestamp())
                .status(HttpStatus.NOT_FOUND.value())
                .error(HttpStatus.NOT_FOUND.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /**
     * Handle all other exceptions (500)
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGlobalException(
            Exception ex,
            WebRequest request) {
        
        ApiErrorResponse error = ApiErrorResponse.builder()
                .timestamp(getCurrentTimestamp())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase())
                .message("An unexpected error occurred")
                .path(request.getDescription(false).replace("uri=", ""))
                .build();
        
        // Log the exception for debugging
        log.error("Unhandled exception [{}]: {}", ex.getClass().getName(), ex.getMessage(), ex);
        
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
