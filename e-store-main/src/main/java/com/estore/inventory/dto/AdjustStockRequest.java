package com.estore.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record AdjustStockRequest(
        @NotNull @PositiveOrZero Integer quantity
) {}
