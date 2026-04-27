package com.estore.customer.dto;

import com.estore.customer.entity.Role;

import java.time.Instant;

public record AuthResponse(
        String token,
        String tokenType,
        Long userId,
        String email,
        String firstName,
        String lastName,
        Role role,
        Instant expiresAt
) {
    public static AuthResponse bearer(String token, Long userId, String email, String firstName,
                                      String lastName, Role role, Instant expiresAt) {
        return new AuthResponse(token, "Bearer", userId, email, firstName, lastName, role, expiresAt);
    }
}
