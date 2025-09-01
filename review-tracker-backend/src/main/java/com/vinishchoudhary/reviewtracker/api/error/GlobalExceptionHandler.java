package com.vinishchoudhary.reviewtracker.api.error;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.List;

@RestControllerAdvice
class GlobalExceptionHandler {
    record FieldErrorDto(String field, String message) {
    }

    record ErrorDto(Instant timestamp, int status, String error, String message, String path,
                    List<FieldErrorDto> fieldErrors) {
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorDto> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        var fieldErrors = ex.getBindingResult().getFieldErrors().stream().map(f -> new FieldErrorDto(f.getField(), f.getDefaultMessage())).toList();
        var dto = new ErrorDto(Instant.now(), 400, "Bad Request", "Validation failed", req.getRequestURI(), fieldErrors);
        return ResponseEntity.badRequest().body(dto);
    }

    @ExceptionHandler({ValidationException.class, BadRequestException.class})
    ResponseEntity<ErrorDto> handleBusiness(RuntimeException ex, HttpServletRequest req) {
        var dto = new ErrorDto(Instant.now(), 400, "Bad Request", ex.getMessage(), req.getRequestURI(), List.of());
        return ResponseEntity.badRequest().body(dto);
    }

    @ExceptionHandler(NotFoundException.class)
    ResponseEntity<ErrorDto> handleNotFound(NotFoundException ex, HttpServletRequest req) {
        var dto = new ErrorDto(Instant.now(), 404, "Not Found", ex.getMessage(), req.getRequestURI(), List.of());
        return ResponseEntity.status(404).body(dto);
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ResponseEntity<ErrorDto> handleOptimistic(OptimisticLockingFailureException ex, HttpServletRequest req) {
        var dto = new ErrorDto(Instant.now(), 409, "Conflict", "The review was modified by someone else. Please refresh and try again.", req.getRequestURI(), List.of());
        return ResponseEntity.status(409).body(dto);
    }
}
