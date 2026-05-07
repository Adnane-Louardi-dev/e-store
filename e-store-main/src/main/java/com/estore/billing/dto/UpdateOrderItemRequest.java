package com.estore.billing.dto;

import jakarta.validation.constraints.Positive;

public record UpdateOrderItemRequest(
        @Positive int quantity
) {
}
