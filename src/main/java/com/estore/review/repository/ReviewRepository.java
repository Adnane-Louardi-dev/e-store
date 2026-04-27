package com.estore.review.repository;

import com.estore.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReviewRepository extends MongoRepository<Review, String> {

    Page<Review> findByProductId(Long productId, Pageable pageable);

    long countByProductId(Long productId);
}
