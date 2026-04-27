package com.estore.config;

import com.estore.catalog.entity.Category;
import com.estore.catalog.entity.Product;
import com.estore.catalog.repository.CategoryRepository;
import com.estore.catalog.repository.ProductRepository;
import com.estore.customer.entity.Profile;
import com.estore.customer.entity.Role;
import com.estore.customer.entity.User;
import com.estore.customer.repository.UserRepository;
import com.estore.inventory.entity.Inventory;
import com.estore.inventory.repository.InventoryRepository;
import com.estore.review.entity.Review;
import com.estore.review.repository.ReviewRepository;
import com.mongodb.client.MongoClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;
    private final PlatformTransactionManager transactionManager;
    @Lazy private final MongoClient mongoClient;

    @Value("${estore.seed-on-startup:true}")
    private boolean seedOnStartup;

    @Value("${spring.data.mongodb.database:estore}")
    private String mongoDatabase;

    @Override
    public void run(String... args) {
        if (!seedOnStartup) {
            log.info("DataSeeder: estore.seed-on-startup=false, skipping");
            return;
        }
        if (userRepository.count() > 0) {
            log.info("DataSeeder: data already present, skipping seed");
            return;
        }

        log.info("DataSeeder: seeding sample data...");
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        List<Product> products = tx.execute(status -> seedJpa());
        log.info("DataSeeder: JPA seed complete ({} products)", products.size());

        seedReviewsIfMongoUp(products);
        log.info("DataSeeder: done. Login as admin@estore.com / admin123 or user@estore.com / password123");
    }

    private List<Product> seedJpa() {
        User admin = User.builder()
                .firstName("Admin")
                .lastName("Estore")
                .email("admin@estore.com")
                .password(passwordEncoder.encode("admin123"))
                .role(Role.ADMIN)
                .build();
        admin.attachProfile(Profile.builder().build());
        userRepository.save(admin);

        User user = User.builder()
                .firstName("John")
                .lastName("Doe")
                .email("user@estore.com")
                .password(passwordEncoder.encode("password123"))
                .role(Role.USER)
                .build();
        user.attachProfile(Profile.builder().build());
        userRepository.save(user);

        Category books = categoryRepository.save(Category.builder()
                .name("Books")
                .description("Books, ebooks, and reading material")
                .build());
        Category electronics = categoryRepository.save(Category.builder()
                .name("Electronics")
                .description("Phones, laptops, accessories")
                .build());
        Category clothing = categoryRepository.save(Category.builder()
                .name("Clothing")
                .description("Apparel for all seasons")
                .build());

        List<Product> products = List.of(
                product("Clean Code", "A handbook of agile software craftsmanship", "29.90", img("Clean+Code"), books),
                product("Effective Java", "Best practices for the Java platform", "34.50", img("Effective+Java"), books),
                product("Design Patterns", "Elements of reusable object-oriented software", "42.00", img("Design+Patterns"), books),
                product("The Pragmatic Programmer", "Your journey to mastery", "31.00", img("Pragmatic"), books),
                product("Wireless Headphones", "Over-ear, noise cancelling", "129.99", img("Headphones"), electronics),
                product("4K Monitor 27\"", "IPS panel, USB-C 65W", "319.00", img("Monitor"), electronics),
                product("Mechanical Keyboard", "Hot-swappable, RGB backlight", "89.50", img("Keyboard"), electronics),
                product("Smartphone Pro", "6.7\" OLED, 256GB", "899.00", img("Smartphone"), electronics),
                product("Laptop Stand", "Aluminium, ergonomic", "39.00", img("Stand"), electronics),
                product("Cotton T-Shirt", "Soft, breathable", "19.90", img("T-Shirt"), clothing),
                product("Denim Jeans", "Straight fit, dark blue", "49.00", img("Jeans"), clothing),
                product("Wool Sweater", "Warm winter sweater", "59.00", img("Sweater"), clothing),
                product("Running Shoes", "Lightweight, cushioned", "89.99", img("Shoes"), clothing),
                product("Baseball Cap", "Adjustable strap", "14.50", img("Cap"), clothing),
                product("Leather Wallet", "Genuine leather, RFID-blocking", "39.90", img("Wallet"), clothing)
        );
        productRepository.saveAll(products);

        for (Product p : products) {
            inventoryRepository.save(Inventory.builder().product(p).quantity(stockFor(p)).build());
        }
        return products;
    }

    /** Probe Mongo with a short timeout so we don't block startup if it's down. */
    private void seedReviewsIfMongoUp(List<Product> products) {
        if (!isMongoReachable()) {
            log.warn("DataSeeder: MongoDB unreachable, skipping review seed");
            return;
        }
        try {
            if (reviewRepository.count() > 0) return;
            Product first = products.get(0);
            Product headphones = products.stream()
                    .filter(p -> p.getName().startsWith("Wireless"))
                    .findFirst().orElse(products.get(4));

            reviewRepository.saveAll(List.of(
                    review(first.getId(), 5, "John Doe", "A must-read for every developer."),
                    review(first.getId(), 4, "John Doe", "Great content, dense but worth it."),
                    review(headphones.getId(), 5, "John Doe", "Excellent noise cancellation."),
                    review(headphones.getId(), 3, "John Doe", "Comfortable but battery drains fast."),
                    review(products.get(7).getId(), 5, "John Doe", "Best phone I've owned.")
            ));
            log.info("DataSeeder: 5 sample reviews seeded");
        } catch (RuntimeException ex) {
            log.warn("DataSeeder: review seed failed, continuing ({})", ex.getMessage());
        }
    }

    private boolean isMongoReachable() {
        try {
            return CompletableFuture.supplyAsync(() ->
                    mongoClient.getDatabase(mongoDatabase).runCommand(new Document("ping", 1)) != null
            ).get(2, TimeUnit.SECONDS);
        } catch (InterruptedException | ExecutionException | TimeoutException ex) {
            return false;
        }
    }

    private static Product product(String name, String desc, String price, String image, Category cat) {
        return Product.builder()
                .name(name)
                .description(desc)
                .price(new BigDecimal(price))
                .imageUrl(image)
                .category(cat)
                .build();
    }

    private static int stockFor(Product p) {
        return switch (p.getName()) {
            case "Clean Code" -> 25;
            case "Effective Java" -> 18;
            case "Design Patterns" -> 12;
            case "The Pragmatic Programmer" -> 30;
            case "Wireless Headphones" -> 40;
            case "4K Monitor 27\"" -> 8;
            case "Mechanical Keyboard" -> 22;
            case "Smartphone Pro" -> 5;
            case "Laptop Stand" -> 0;
            case "Cotton T-Shirt" -> 60;
            case "Denim Jeans" -> 35;
            case "Wool Sweater" -> 14;
            case "Running Shoes" -> 17;
            case "Baseball Cap" -> 50;
            case "Leather Wallet" -> 28;
            default -> 10;
        };
    }

    private static Review review(Long productId, int rating, String authorName, String comment) {
        return Review.builder()
                .productId(productId)
                .userId(2L)
                .authorName(authorName)
                .rating(rating)
                .comment(comment)
                .createdAt(Instant.now())
                .build();
    }

    private static String img(String label) {
        return "https://placehold.co/600x400?text=" + label;
    }
}
