package com.estore.shopping.service;

import com.estore.catalog.entity.Product;
import com.estore.catalog.service.ProductService;
import com.estore.customer.entity.User;
import com.estore.customer.repository.UserRepository;
import com.estore.exception.BusinessException;
import com.estore.exception.ResourceNotFoundException;
import com.estore.inventory.service.InventoryService;
import com.estore.shopping.dto.AddCartItemRequest;
import com.estore.shopping.dto.CartItemResponse;
import com.estore.shopping.dto.CartResponse;
import com.estore.shopping.dto.UpdateCartItemRequest;
import com.estore.shopping.entity.Cart;
import com.estore.shopping.entity.CartItem;
import com.estore.shopping.repository.CartItemRepository;
import com.estore.shopping.repository.CartRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductService productService;
    private final InventoryService inventoryService;

    @Transactional
    public CartResponse currentCart() {
        return toResponse(loadOrCreateCart());
    }

    @Transactional
    public CartResponse addItem(AddCartItemRequest request) {
        Cart cart = loadOrCreateCart();
        Product product = productService.loadOrFail(request.productId());

        CartItem existing = findItem(cart, product.getId());
        int newQuantity = (existing != null ? existing.getQuantity() : 0) + request.quantity();
        ensureStockAvailable(product.getId(), newQuantity);

        if (existing != null) {
            existing.setQuantity(newQuantity);
        } else {
            CartItem item = CartItem.builder()
                    .product(product)
                    .quantity(request.quantity())
                    .unitPrice(product.getPrice())
                    .build();
            cart.addItem(item);
            cartItemRepository.save(item);
        }

        return toResponse(cart);
    }

    @Transactional
    public CartResponse updateItem(Long itemId, UpdateCartItemRequest request) {
        Cart cart = loadOrCreateCart();
        CartItem item = requireItemInCart(cart, itemId);
        ensureStockAvailable(item.getProduct().getId(), request.quantity());
        item.setQuantity(request.quantity());
        return toResponse(cart);
    }

    @Transactional
    public CartResponse removeItem(Long itemId) {
        Cart cart = loadOrCreateCart();
        CartItem item = requireItemInCart(cart, itemId);
        cart.removeItem(item);
        cartItemRepository.delete(item);
        return toResponse(cart);
    }

    @Transactional
    public CartResponse clear() {
        Cart cart = loadOrCreateCart();
        cart.getItems().clear();
        return toResponse(cart);
    }

    /** Used by the billing module to drain a cart after an order is validated. */
    @Transactional
    public Cart loadCurrentForCheckout() {
        return loadOrCreateCart();
    }

    private Cart loadOrCreateCart() {
        User user = currentUser();
        return cartRepository.findByUserIdWithItems(user.getId())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> ResourceNotFoundException.of("User", email));
    }

    private CartItem findItem(Cart cart, Long productId) {
        return cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .findFirst()
                .orElse(null);
    }

    private CartItem requireItemInCart(Cart cart, Long itemId) {
        return cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> ResourceNotFoundException.of("Cart item", itemId));
    }

    private void ensureStockAvailable(Long productId, int requestedQuantity) {
        int available = inventoryService.quantityFor(productId);
        if (available < requestedQuantity) {
            throw new BusinessException(
                    "Insufficient stock for product %d (requested %d, available %d)"
                            .formatted(productId, requestedQuantity, available));
        }
    }

    private CartResponse toResponse(Cart cart) {
        var items = cart.getItems().stream()
                .map(i -> new CartItemResponse(
                        i.getId(),
                        i.getProduct().getId(),
                        i.getProduct().getName(),
                        i.getProduct().getImageUrl(),
                        i.getQuantity(),
                        i.getUnitPrice(),
                        i.lineTotal()))
                .toList();
        return new CartResponse(
                cart.getId(),
                cart.getUser().getId(),
                items,
                items.stream().mapToInt(CartItemResponse::quantity).sum(),
                cart.total()
        );
    }
}
