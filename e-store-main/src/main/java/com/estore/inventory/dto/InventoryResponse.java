package com.estore.inventory.dto;

public record InventoryResponse(
        Long productId,
        String productName,
        int quantity
) {}
