package com.estore.billing.controller;

import com.estore.billing.dto.OrderResponse;
import com.estore.billing.service.OrderService;
import com.estore.shared.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.findById(id));
    }
}
