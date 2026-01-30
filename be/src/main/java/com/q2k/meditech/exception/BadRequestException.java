package com.q2k.meditech.exception;

/**
 * Exception thrown when request data is invalid or malformed
 */
public class BadRequestException extends RuntimeException {
    
    public BadRequestException(String message) {
        super(message);
    }
}