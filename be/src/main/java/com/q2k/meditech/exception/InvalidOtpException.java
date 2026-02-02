package com.q2k.meditech.exception;

/**
 * Exception thrown when OTP is invalid or expired
 */
public class InvalidOtpException extends RuntimeException {
    
    public InvalidOtpException(String message) {
        super(message);
    }
}
