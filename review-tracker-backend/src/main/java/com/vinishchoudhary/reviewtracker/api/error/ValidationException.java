package com.vinishchoudhary.reviewtracker.api.error;

public class ValidationException extends RuntimeException {
    public ValidationException(String message) {
        super(message);
    }

    public ValidationException() {
    }
}
