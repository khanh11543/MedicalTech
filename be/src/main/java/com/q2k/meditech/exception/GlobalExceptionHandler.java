package com.q2k.meditech.exception;

import com.q2k.meditech.entity.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global Exception Handler
 * Xử lý tất cả exceptions trong application và trả về response format thống
 * nhất
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
         * Handle DuplicateResourceException (409)
         */
        @ExceptionHandler(DuplicateResourceException.class)
        public ResponseEntity<ApiErrorResponse> handleDuplicateResourceException(
                        DuplicateResourceException ex,
                        WebRequest request) {

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
         * Handle BadRequestException (400)
         */
        @ExceptionHandler(BadRequestException.class)
        public ResponseEntity<ApiErrorResponse> handleBadRequestException(
                        BadRequestException ex,
                        WebRequest request) {

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
         * Handle Validation Errors (400)
         */
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ApiErrorResponse> handleValidationException(
                        MethodArgumentNotValidException ex,
                        WebRequest request) {

                Map<String, String> validationErrors = new HashMap<>();
                ex.getBindingResult().getAllErrors().forEach(error -> {
                        String fieldName = ((FieldError) error).getField();
                        String errorMessage = error.getDefaultMessage();
                        validationErrors.put(fieldName, errorMessage);
                });

                ApiErrorResponse error = ApiErrorResponse.builder()
                                .timestamp(getCurrentTimestamp())
                                .status(HttpStatus.BAD_REQUEST.value())
                                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                                .message("Validation failed")
                                .path(request.getDescription(false).replace("uri=", ""))
                                .validationErrors(validationErrors)
                                .build();

                return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        }

        /**
         * Handle AuthenticationException (401)
         */
        @ExceptionHandler(AuthenticationException.class)
        public ResponseEntity<ApiErrorResponse> handleAuthenticationException(
                        AuthenticationException ex,
                        WebRequest request) {

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
         * Handle AccessDeniedException (403)
         */
        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ApiErrorResponse> handleAccessDeniedException(
                        AccessDeniedException ex,
                        WebRequest request) {

                ApiErrorResponse error = ApiErrorResponse.builder()
                                .timestamp(getCurrentTimestamp())
                                .status(HttpStatus.FORBIDDEN.value())
                                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                                .message("You don't have permission to access this resource")
                                .path(request.getDescription(false).replace("uri=", ""))
                                .build();

                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
        }

        /**
         * Handle InvalidOtpException (400)
         */
        @ExceptionHandler(InvalidOtpException.class)
        public ResponseEntity<ApiErrorResponse> handleInvalidOtpException(
                        InvalidOtpException ex,
                        WebRequest request) {

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
         * Handle AccountLockedException (403)
         */
        @ExceptionHandler(AccountLockedException.class)
        public ResponseEntity<ApiErrorResponse> handleAccountLockedException(
                        AccountLockedException ex,
                        WebRequest request) {

                ApiErrorResponse error = ApiErrorResponse.builder()
                                .timestamp(getCurrentTimestamp())
                                .status(HttpStatus.FORBIDDEN.value())
                                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                                .message(ex.getMessage())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .build();

                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
        }

        /**
         * Handle InvalidTokenException (401)
         */
        @ExceptionHandler(InvalidTokenException.class)
        public ResponseEntity<ApiErrorResponse> handleInvalidTokenException(
                        InvalidTokenException ex,
                        WebRequest request) {

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
         * Handle UnverifiedAccountException (403)
         */
        @ExceptionHandler(UnverifiedAccountException.class)
        public ResponseEntity<ApiErrorResponse> handleUnverifiedAccountException(
                        UnverifiedAccountException ex,
                        WebRequest request) {

                ApiErrorResponse error = ApiErrorResponse.builder()
                                .timestamp(getCurrentTimestamp())
                                .status(HttpStatus.FORBIDDEN.value())
                                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                                .message(ex.getMessage())
                                .path(request.getDescription(false).replace("uri=", ""))
                                .build();

                return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
        }

        /**
         * Handle MethodArgumentTypeMismatchException (400)
         * This happens when path variable cannot be converted (e.g., {id} instead of a
         * number)
         */
        @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ApiErrorResponse> handleMethodArgumentTypeMismatchException(
                        org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex,
                        WebRequest request) {

                String message = String.format("Invalid value '%s' for parameter '%s'. Expected type: %s",
                                ex.getValue(), ex.getName(),
                                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");

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
         * Handle NoResourceFoundException (404) - e.g. missing static resources like
         * avatars
         */
        @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
        public ResponseEntity<ApiErrorResponse> handleNoResourceFoundException(
                        org.springframework.web.servlet.resource.NoResourceFoundException ex,
                        WebRequest request) {

                log.warn("Static resource not found: {}", ex.getMessage());

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
