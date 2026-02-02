package com.q2k.meditech.exception;

/**
 * Exception thrown when user is not verified
 */
public class UnverifiedAccountException extends RuntimeException {
    
    public UnverifiedAccountException(String message) {
        super(message);
    }
}
