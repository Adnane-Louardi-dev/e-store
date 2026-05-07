package com.estore.billing.repository;

import com.estore.billing.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Override
    @EntityGraph(attributePaths = "items")
    Page<Order> findAll(Pageable pageable);

    @EntityGraph(attributePaths = "items")
    Page<Order> findByUserId(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = "items")
    Optional<Order> findWithItemsById(Long id);
}
