package com.estore.catalog.mapper;

import com.estore.catalog.dto.CategoryRequest;
import com.estore.catalog.dto.CategoryResponse;
import com.estore.catalog.entity.Category;
import org.springframework.stereotype.Component;

@Component
public class CategoryMapper {

    public CategoryResponse toResponse(Category category) {
        if (category == null) {
            return null;
        }
        return new CategoryResponse(category.getId(), category.getName(), category.getDescription());
    }

    public Category toEntity(CategoryRequest request) {
        if (request == null) {
            return null;
        }
        return Category.builder()
                .name(request.name())
                .description(request.description())
                .build();
    }

    public void update(CategoryRequest request, Category category) {
        if (request == null || category == null) {
            return;
        }
        if (request.name() != null) {
            category.setName(request.name());
        }
        if (request.description() != null) {
            category.setDescription(request.description());
        }
    }
}
