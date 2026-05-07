package com.estore.customer.dto;

public record ProfileResponse(
        Long id,
        String phone,
        String address,
        String city,
        String country
) {}
