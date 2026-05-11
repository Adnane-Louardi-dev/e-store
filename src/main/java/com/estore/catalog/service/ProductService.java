package com.estore.catalog.service;

import com.estore.catalog.dto.ProductRequest;
import com.estore.catalog.dto.ProductResponse;
import com.estore.catalog.entity.Category;
import com.estore.catalog.entity.Product;
import com.estore.catalog.mapper.ProductMapper;
import com.estore.catalog.repository.ProductRepository;
import com.estore.exception.ResourceNotFoundException;
import com.estore.inventory.service.InventoryService;
import com.estore.shared.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final InventoryService inventoryService;
    private final ProductMapper productMapper;

    private static final Set<String> SORTABLE_FIELDS = Set.of("id", "name", "price", "createdAt");

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(String q, Long categoryId, Pageable pageable) {
        Pageable safe = sanitizeSort(pageable);
        Page<Product> page = productRepository.search(emptyToNull(q), categoryId, safe);
        Map<Long, Integer> stockByProduct = inventoryService.quantitiesFor(
                page.getContent().stream().map(Product::getId).toList()
        );
        return PageResponse.of(page.map(p -> productMapper.toResponse(p, stockByProduct.getOrDefault(p.getId(), 0))));
    }

    private Pageable sanitizeSort(Pageable pageable) {
        Sort sort = Sort.by(pageable.getSort().stream()
                .filter(o -> SORTABLE_FIELDS.contains(o.getProperty()))
                .toList());
        if (sort.isEmpty()) {
            sort = Sort.by(Sort.Direction.DESC, "id");
        }
        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        Product product = loadOrFail(id);
        return productMapper.toResponse(product, inventoryService.quantityFor(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Category category = categoryService.loadOrFail(request.categoryId());
        Product product = Product.builder()
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .imageUrl(request.imageUrl())
                .category(category)
                .build();
        Product saved = productRepository.save(product);
        inventoryService.createFor(saved, 0);
        return productMapper.toResponse(saved, 0);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = loadOrFail(id);
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setImageUrl(request.imageUrl());
        if (!product.getCategory().getId().equals(request.categoryId())) {
            product.setCategory(categoryService.loadOrFail(request.categoryId()));
        }
        return productMapper.toResponse(product, inventoryService.quantityFor(id));
    }

    @Transactional
    public void delete(Long id) {
        Product product = loadOrFail(id);
        inventoryService.deleteByProduct(id);
        productRepository.delete(product);
    }

    public Product loadOrFail(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Product", id));
    }

    private static String emptyToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
