-- E-Store relational schema (MySQL 8 / MariaDB)
-- Mirrors the JPA entities under com.estore.*.entity.
-- Hibernate creates this automatically with `ddl-auto: update`; this file is provided
-- for the deliverable "Scripts BD" (cahier des charges § 17).
--
-- Usage:
--   mysql -u root -p < scripts/schema.sql

DROP DATABASE IF EXISTS estore;
CREATE DATABASE estore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE estore;

-- ---------------------------------------------------------------- Customer
CREATE TABLE users (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP    NULL,
    first_name  VARCHAR(255) NOT NULL,
    last_name   VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE profiles (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP    NULL,
    phone       VARCHAR(255) NULL,
    address     VARCHAR(255) NULL,
    city        VARCHAR(255) NULL,
    country     VARCHAR(255) NULL,
    user_id     BIGINT       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_profiles_user UNIQUE (user_id),
    CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------- Catalog
CREATE TABLE categories (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    created_at  TIMESTAMP    NOT NULL,
    updated_at  TIMESTAMP    NULL,
    name        VARCHAR(80)  NOT NULL,
    description VARCHAR(500) NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_categories_name UNIQUE (name)
) ENGINE=InnoDB;

CREATE TABLE products (
    id          BIGINT         NOT NULL AUTO_INCREMENT,
    created_at  TIMESTAMP      NOT NULL,
    updated_at  TIMESTAMP      NULL,
    name        VARCHAR(150)   NOT NULL,
    description VARCHAR(2000)  NULL,
    price       DECIMAL(12, 2) NOT NULL,
    image_url   VARCHAR(500)   NULL,
    category_id BIGINT         NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_products_name     (name),
    INDEX idx_products_category (category_id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------- Inventory
CREATE TABLE inventories (
    id         BIGINT    NOT NULL AUTO_INCREMENT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NULL,
    quantity   INT       NOT NULL,
    product_id BIGINT    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_inventories_product UNIQUE (product_id),
    CONSTRAINT fk_inventories_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------- Shopping
CREATE TABLE carts (
    id         BIGINT    NOT NULL AUTO_INCREMENT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NULL,
    user_id    BIGINT    NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_carts_user UNIQUE (user_id),
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE cart_items (
    id         BIGINT         NOT NULL AUTO_INCREMENT,
    created_at TIMESTAMP      NOT NULL,
    updated_at TIMESTAMP      NULL,
    cart_id    BIGINT         NOT NULL,
    product_id BIGINT         NOT NULL,
    quantity   INT            NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cart_items_cart_product UNIQUE (cart_id, product_id),
    CONSTRAINT fk_cart_items_cart    FOREIGN KEY (cart_id)    REFERENCES carts (id),
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------- Billing
CREATE TABLE orders (
    id           BIGINT         NOT NULL AUTO_INCREMENT,
    created_at   TIMESTAMP      NOT NULL,
    updated_at   TIMESTAMP      NULL,
    user_id      BIGINT         NOT NULL,
    order_date   TIMESTAMP      NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    status       VARCHAR(20)    NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_orders_user (user_id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB;

CREATE TABLE order_items (
    id           BIGINT         NOT NULL AUTO_INCREMENT,
    created_at   TIMESTAMP      NOT NULL,
    updated_at   TIMESTAMP      NULL,
    order_id     BIGINT         NOT NULL,
    product_id   BIGINT         NOT NULL,
    product_name VARCHAR(150)   NOT NULL,
    quantity     INT            NOT NULL,
    unit_price   DECIMAL(12, 2) NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_order_items_order (order_id),
    CONSTRAINT fk_order_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id),
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB;
