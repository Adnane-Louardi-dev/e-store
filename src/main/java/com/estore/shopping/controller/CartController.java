package com.estore.shopping.controller;

import com.estore.shopping.dto.AddCartItemRequest;
import com.estore.shopping.dto.CartResponse;
import com.estore.shopping.dto.UpdateCartItemRequest;
import com.estore.shopping.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> get() {
        return ResponseEntity.ok(cartService.currentCart());
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> add(@Valid @RequestBody AddCartItemRequest request) {
        return ResponseEntity.ok(cartService.addItem(request));
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> update(@PathVariable Long itemId,
                                               @Valid @RequestBody UpdateCartItemRequest request) {
        return ResponseEntity.ok(cartService.updateItem(itemId, request));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> remove(@PathVariable Long itemId) {
        return ResponseEntity.ok(cartService.removeItem(itemId));
    }

    @DeleteMapping
    public ResponseEntity<CartResponse> clear() {
        return ResponseEntity.ok(cartService.clear());
    }
}
