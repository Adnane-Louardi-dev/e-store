package com.estore.catalog.mapper;

import com.estore.catalog.dto.ProductResponse;
import com.estore.catalog.entity.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ProductMapper {

    private final CategoryMapper categoryMapper;

    public ProductResponse toResponse(Product product, int quantityInStock) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getImageUrl(),
                categoryMapper.toResponse(product.getCategory()),
                quantityInStock
        );
    }
}
