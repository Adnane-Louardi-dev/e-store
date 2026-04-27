package com.estore.customer.dto;

import com.estore.customer.entity.Role;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email,
        Role role,
        ProfileResponse profile
) {}
