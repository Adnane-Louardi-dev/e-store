package com.estore.review.service;

import com.estore.catalog.service.ProductService;
import com.estore.customer.entity.User;
import com.estore.customer.repository.UserRepository;
import com.estore.exception.ResourceNotFoundException;
import com.estore.review.dto.ReviewRequest;
import com.estore.review.dto.ReviewResponse;
import com.estore.review.entity.Review;
import com.estore.review.repository.ReviewRepository;
import com.estore.shared.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    private static final Set<String> SORTABLE_FIELDS = Set.of("createdAt", "rating");

    public ReviewResponse create(ReviewRequest request) {
        productService.loadOrFail(request.productId());
        User user = currentUser();

        Review review = Review.builder()
                .productId(request.productId())
                .userId(user.getId())
                .authorName(user.getFirstName() + " " + user.getLastName())
                .rating(request.rating())
                .comment(request.comment())
                .createdAt(Instant.now())
                .build();
        return toResponse(reviewRepository.save(review));
    }

    public PageResponse<ReviewResponse> forProduct(Long productId, Pageable pageable) {
        productService.loadOrFail(productId);
        Pageable safe = sanitizeSort(pageable);
        Page<Review> page = reviewRepository.findByProductId(productId, safe);
        return PageResponse.of(page.map(this::toResponse));
    }

    private Pageable sanitizeSort(Pageable pageable) {
        Sort sort = Sort.by(pageable.getSort().stream()
                .filter(o -> SORTABLE_FIELDS.contains(o.getProperty()))
                .toList());
        if (sort.isEmpty()) {
            sort = Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> ResourceNotFoundException.of("User", email));
    }

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getProductId(),
                r.getUserId(),
                r.getAuthorName(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt()
        );
    }
}
