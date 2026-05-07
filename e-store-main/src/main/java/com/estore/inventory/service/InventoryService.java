package com.estore.inventory.service;

import com.estore.catalog.entity.Product;
import com.estore.exception.BusinessException;
import com.estore.exception.ResourceNotFoundException;
import com.estore.inventory.dto.AdjustStockRequest;
import com.estore.inventory.dto.InventoryResponse;
import com.estore.inventory.entity.Inventory;
import com.estore.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    @Transactional
    public Inventory createFor(Product product, int initialQuantity) {
        Inventory inventory = Inventory.builder()
                .product(product)
                .quantity(initialQuantity)
                .build();
        return inventoryRepository.save(inventory);
    }

    @Transactional
    public void deleteByProduct(Long productId) {
        inventoryRepository.deleteByProductId(productId);
    }

    @Transactional(readOnly = true)
    public int quantityFor(Long productId) {
        return inventoryRepository.findByProductId(productId)
                .map(Inventory::getQuantity)
                .orElse(0);
    }

    @Transactional(readOnly = true)
    public Map<Long, Integer> quantitiesFor(Collection<Long> productIds) {
        if (productIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Integer> result = new HashMap<>();
        for (Inventory inv : inventoryRepository.findByProductIdIn(productIds)) {
            result.put(inv.getProduct().getId(), inv.getQuantity());
        }
        for (Long id : productIds) {
            result.putIfAbsent(id, 0);
        }
        return result;
    }

    /** Reserve stock for a purchase. Throws if insufficient. */
    @Transactional
    public void reserve(Long productId, int quantity) {
        Inventory inv = loadOrFail(productId);
        if (inv.getQuantity() < quantity) {
            throw new BusinessException("Insufficient stock for product " + productId);
        }
        inv.setQuantity(inv.getQuantity() - quantity);
    }

    /** Restore stock (e.g. cancelled order). */
    @Transactional
    public void release(Long productId, int quantity) {
        Inventory inv = loadOrFail(productId);
        inv.setQuantity(inv.getQuantity() + quantity);
    }

    @Transactional(readOnly = true)
    public InventoryResponse get(Long productId) {
        Inventory inv = loadOrFail(productId);
        return new InventoryResponse(productId, inv.getProduct().getName(), inv.getQuantity());
    }

    @Transactional
    public InventoryResponse setQuantity(Long productId, AdjustStockRequest request) {
        Inventory inv = loadOrFail(productId);
        inv.setQuantity(request.quantity());
        return new InventoryResponse(productId, inv.getProduct().getName(), inv.getQuantity());
    }

    private Inventory loadOrFail(Long productId) {
        return inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> ResourceNotFoundException.of("Inventory for product", productId));
    }
}
