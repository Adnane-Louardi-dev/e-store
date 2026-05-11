package com.estore.billing.controller;

import com.estore.billing.dto.OrderResponse;
import com.estore.billing.dto.UpdateOrderItemRequest;
import com.estore.billing.service.OrderService;
import com.estore.shared.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> place() {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.placeOrder());
    }

    @GetMapping("/user/me")
    public ResponseEntity<PageResponse<OrderResponse>> myOrders(
            @ParameterObject @PageableDefault(size = 20, sort = "orderDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(orderService.myOrders(pageable));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<OrderResponse>> allOrders(
            @ParameterObject @PageableDefault(size = 20, sort = "orderDate", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        return ResponseEntity.ok(orderService.allOrders(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.findById(id));
    }

    @PutMapping("/{id}/items/{itemId}")
    public ResponseEntity<OrderResponse> updateItem(@PathVariable Long id,
                                                    @PathVariable Long itemId,
                                                    @Valid @RequestBody UpdateOrderItemRequest request) {
        return ResponseEntity.ok(orderService.updateItem(id, itemId, request));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancel(id));
    }
}
