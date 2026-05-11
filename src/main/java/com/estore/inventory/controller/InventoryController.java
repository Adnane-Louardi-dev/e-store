package com.estore.inventory.controller;

import com.estore.inventory.dto.AdjustStockRequest;
import com.estore.inventory.dto.InventoryResponse;
import com.estore.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<InventoryResponse> get(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.get(productId));
    }

    @PutMapping("/product/{productId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InventoryResponse> set(@PathVariable Long productId,
                                                 @Valid @RequestBody AdjustStockRequest request) {
        return ResponseEntity.ok(inventoryService.setQuantity(productId, request));
    }
}
