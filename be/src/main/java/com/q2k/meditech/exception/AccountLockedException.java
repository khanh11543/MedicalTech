package com.q2k.meditech.exception;

/**
 * Exception thrown when account is locked
 */
public class AccountLockedException extends RuntimeException {
    
    public AccountLockedException(String message) {
        super(message);
    }
}
