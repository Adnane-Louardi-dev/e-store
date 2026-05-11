package com.estore.catalog.dto;

import java.math.BigDecimal;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        String imageUrl,
        CategoryResponse category,
        int quantityInStock
) {}
