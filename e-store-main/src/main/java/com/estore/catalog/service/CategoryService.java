package com.estore.catalog.service;

import com.estore.catalog.dto.CategoryRequest;
import com.estore.catalog.dto.CategoryResponse;
import com.estore.catalog.entity.Category;
import com.estore.catalog.mapper.CategoryMapper;
import com.estore.catalog.repository.CategoryRepository;
import com.estore.catalog.repository.ProductRepository;
import com.estore.exception.BusinessException;
import com.estore.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CategoryMapper categoryMapper;

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream()
                .map(categoryMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(Long id) {
        return categoryMapper.toResponse(loadOrFail(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new BusinessException("Category with this name already exists");
        }
        Category saved = categoryRepository.save(categoryMapper.toEntity(request));
        return categoryMapper.toResponse(saved);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = loadOrFail(id);
        categoryMapper.update(request, category);
        return categoryMapper.toResponse(category);
    }

    @Transactional
    public void delete(Long id) {
        Category category = loadOrFail(id);
        if (productRepository.existsByCategoryId(id)) {
            throw new BusinessException("Cannot delete a category that still has products");
        }
        categoryRepository.delete(category);
    }

    Category loadOrFail(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Category", id));
    }
}
