package com.estore.billing.service;

import com.estore.billing.dto.OrderItemResponse;
import com.estore.billing.dto.OrderResponse;
import com.estore.billing.entity.Order;
import com.estore.billing.entity.OrderItem;
import com.estore.billing.entity.OrderStatus;
import com.estore.billing.repository.OrderRepository;
import com.estore.customer.entity.User;
import com.estore.customer.repository.UserRepository;
import com.estore.exception.BusinessException;
import com.estore.exception.ResourceNotFoundException;
import com.estore.inventory.service.InventoryService;
import com.estore.shared.PageResponse;
import com.estore.shopping.entity.Cart;
import com.estore.shopping.entity.CartItem;
import com.estore.shopping.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartService cartService;
    private final InventoryService inventoryService;

    private static final Set<String> SORTABLE_FIELDS = Set.of("id", "orderDate", "totalAmount", "status");

    @Transactional
    public OrderResponse placeOrder() {
        User user = currentUser();
        Cart cart = cartService.loadCurrentForCheckout();

        if (cart.getItems().isEmpty()) {
            throw new BusinessException("Cart is empty");
        }

        Order order = Order.builder()
                .user(user)
                .orderDate(Instant.now())
                .status(OrderStatus.CONFIRMED)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        for (CartItem ci : cart.getItems()) {
            inventoryService.reserve(ci.getProduct().getId(), ci.getQuantity());

            OrderItem item = OrderItem.builder()
                    .product(ci.getProduct())
                    .productName(ci.getProduct().getName())
                    .quantity(ci.getQuantity())
                    .unitPrice(ci.getUnitPrice())
                    .build();
            order.addItem(item);
            total = total.add(item.lineTotal());
        }
        order.setTotalAmount(total);

        Order saved = orderRepository.save(order);
        cart.getItems().clear();

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> myOrders(Pageable pageable) {
        User user = currentUser();
        Pageable safe = sanitizeSort(pageable);
        Page<Order> page = orderRepository.findByUserId(user.getId(), safe);
        return PageResponse.of(page.map(this::toResponse));
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        Order order = orderRepository.findWithItemsById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", id));
        User user = currentUser();
        if (!order.getUser().getId().equals(user.getId()) && !isAdmin()) {
            throw new BusinessException("Not allowed to view this order");
        }
        return toResponse(order);
    }

    private Pageable sanitizeSort(Pageable pageable) {
        Sort sort = Sort.by(pageable.getSort().stream()
                .filter(o -> SORTABLE_FIELDS.contains(o.getProperty()))
                .toList());
        if (sort.isEmpty()) {
            sort = Sort.by(Sort.Direction.DESC, "orderDate");
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> ResourceNotFoundException.of("User", email));
    }

    private boolean isAdmin() {
        return SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(i -> new OrderItemResponse(
                        i.getId(),
                        i.getProduct().getId(),
                        i.getProductName(),
                        i.getQuantity(),
                        i.getUnitPrice(),
                        i.lineTotal()))
                .toList();
        return new OrderResponse(
                order.getId(),
                order.getUser().getId(),
                order.getOrderDate(),
                order.getStatus(),
                order.getTotalAmount(),
                items
        );
    }
}
