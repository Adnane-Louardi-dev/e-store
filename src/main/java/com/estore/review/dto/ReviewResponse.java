package com.estore.review.dto;

import java.time.Instant;

public record ReviewResponse(
        String id,
        Long productId,
        Long userId,
        String authorName,
        int rating,
        String comment,
        Instant createdAt
) {}
