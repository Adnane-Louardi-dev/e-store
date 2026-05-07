package com.estore.shared;

import java.time.Instant;
import java.util.List;

public record ApiError(
        int status,
        String error,
        String message,
        String path,
        Instant timestamp,
        List<FieldViolation> errors
) {
    public record FieldViolation(String field, String message) {}
}
