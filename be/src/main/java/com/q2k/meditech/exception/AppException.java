package com.q2k.meditech.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

// Base exception
public class AppException extends RuntimeException {
    private final HttpStatus status;
    
    public AppException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
    
    public HttpStatus getStatus() {
        return status;
    }
}