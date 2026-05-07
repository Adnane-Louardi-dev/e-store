package com.estore.shopping.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
        Long id,
        Long userId,
        List<CartItemResponse> items,
        int itemCount,
        BigDecimal total
) {}
