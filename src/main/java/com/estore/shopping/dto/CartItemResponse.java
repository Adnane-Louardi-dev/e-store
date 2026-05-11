package com.estore.shopping.dto;

import java.math.BigDecimal;

public record CartItemResponse(
        Long id,
        Long productId,
        String productName,
        String productImageUrl,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {}
