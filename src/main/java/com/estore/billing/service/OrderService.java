package com.estore.billing.service;

import com.estore.billing.dto.OrderItemResponse;
import com.estore.billing.dto.OrderResponse;
import com.estore.billing.dto.UpdateOrderItemRequest;
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
    public PageResponse<OrderResponse> allOrders(Pageable pageable) {
        Pageable safe = sanitizeSort(pageable);
        Page<Order> page = orderRepository.findAll(safe);
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

    @Transactional
    public OrderResponse updateItem(Long orderId, Long itemId, UpdateOrderItemRequest request) {
        Order order = loadAllowedOrder(orderId);
        ensureEditable(order);

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> ResourceNotFoundException.of("Order item", itemId));

        int delta = request.quantity() - item.getQuantity();
        if (delta > 0) {
            inventoryService.reserve(item.getProduct().getId(), delta);
        } else if (delta < 0) {
            inventoryService.release(item.getProduct().getId(), -delta);
        }

        item.setQuantity(request.quantity());
        recalculateTotal(order);
        return toResponse(order);
    }

    @Transactional
    public OrderResponse cancel(Long orderId) {
        Order order = loadAllowedOrder(orderId);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return toResponse(order);
        }

        for (OrderItem item : order.getItems()) {
            inventoryService.release(item.getProduct().getId(), item.getQuantity());
        }
        order.setStatus(OrderStatus.CANCELLED);
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

    private Order loadAllowedOrder(Long orderId) {
        Order order = orderRepository.findWithItemsById(orderId)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", orderId));
        User user = currentUser();
        if (!order.getUser().getId().equals(user.getId()) && !isAdmin()) {
            throw new BusinessException("Not allowed to modify this order");
        }
        return order;
    }

    private void ensureEditable(Order order) {
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BusinessException("Cancelled orders cannot be modified");
        }
    }

    private void recalculateTotal(Order order) {
        BigDecimal total = order.getItems().stream()
                .map(OrderItem::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmount(total);
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
