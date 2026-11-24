-- =========================================================
-- MK ANIMAL HEALTH ERP
-- DATABASE SCHEMA
-- FOUNDATION / ADMIN MODULE
-- =========================================================

CREATE DATABASE IF NOT EXISTS mk_animal_health;

USE mk_animal_health;


-- =========================================================
-- 1. ROLES
-- =========================================================

CREATE TABLE roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. USERS
-- =========================================================

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    email VARCHAR(150) UNIQUE,

    phone VARCHAR(20),

    role_id INT NOT NULL,

    status ENUM('ACTIVE', 'INACTIVE', 'BLOCKED')
        DEFAULT 'ACTIVE',

    last_login DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
);


-- =========================================================
-- 3. ADMIN PROFILES
-- =========================================================

CREATE TABLE admin_profiles (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    full_name VARCHAR(150) NOT NULL,

    birth_date DATE,

    address TEXT,

    profile_photo VARCHAR(500),

    profile_completed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_admin_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- =========================================================
-- 4. PERMISSIONS
-- =========================================================

CREATE TABLE permissions (
    permission_id INT AUTO_INCREMENT PRIMARY KEY,

    permission_name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 5. ROLE PERMISSIONS
-- =========================================================

CREATE TABLE role_permissions (
    role_id INT NOT NULL,

    permission_id INT NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id)
        REFERENCES permissions(permission_id)
        ON DELETE CASCADE
);


-- =========================================================
-- 6. BRANCHES
-- =========================================================

CREATE TABLE branches (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,

    branch_name VARCHAR(150) NOT NULL,

    address TEXT,

    city VARCHAR(100),

    state VARCHAR(100),

    contact_no VARCHAR(20),

    email VARCHAR(150),

    status ENUM('ACTIVE', 'INACTIVE')
        DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 7. AREAS
-- =========================================================

CREATE TABLE areas (
    area_id INT AUTO_INCREMENT PRIMARY KEY,

    area_name VARCHAR(150) NOT NULL,

    city VARCHAR(100),

    district VARCHAR(100),

    state VARCHAR(100),

    status ENUM('ACTIVE', 'INACTIVE')
        DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(area_name, city, district)
);


-- =========================================================
-- 8. GROUPS
-- =========================================================

CREATE TABLE groups_master (
    group_id INT AUTO_INCREMENT PRIMARY KEY,

    group_name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255),

    status ENUM('ACTIVE', 'INACTIVE')
        DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 9. NOTIFICATIONS
-- =========================================================

CREATE TABLE notifications (
    notification_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    notification_type VARCHAR(50),

    is_read BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- =========================================================
-- 10. AUDIT LOGS
-- =========================================================

CREATE TABLE audit_logs (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NULL,

    action VARCHAR(100) NOT NULL,

    entity_type VARCHAR(100),

    entity_id VARCHAR(100),

    old_value JSON,

    new_value JSON,

    ip_address VARCHAR(45),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);
-- =========================================================
-- 9. PRODUCT CATEGORIES
-- =========================================================

CREATE TABLE product_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,

    category_name VARCHAR(100) NOT NULL UNIQUE,

    description VARCHAR(255),

    status ENUM('ACTIVE', 'INACTIVE')
        DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- =========================================================
-- 10. PRODUCTS
-- =========================================================

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,

    product_code VARCHAR(50) NOT NULL UNIQUE,

    product_name VARCHAR(150) NOT NULL,

    category_id INT NOT NULL,

    description TEXT,

    unit VARCHAR(30),

    mrp DECIMAL(10,2) NOT NULL,

    selling_price DECIMAL(10,2) NOT NULL,

    gst_rate DECIMAL(5,2) DEFAULT 0.00,

    reorder_level INT DEFAULT 0,

    status ENUM('ACTIVE', 'INACTIVE')
        DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id)
        REFERENCES product_categories(category_id)
);


-- =========================================================
-- 11. INVENTORY
-- =========================================================

CREATE TABLE inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,

    product_id INT NOT NULL,

    branch_id INT NOT NULL,

    quantity INT NOT NULL DEFAULT 0,

    reserved_quantity INT NOT NULL DEFAULT 0,

    available_quantity INT
        GENERATED ALWAYS AS
        (quantity - reserved_quantity) STORED,

    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_inventory_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
        ON DELETE CASCADE,

    UNIQUE(product_id, branch_id)
);


-- =========================================================
-- 12. STOCK TRANSACTIONS
-- =========================================================

CREATE TABLE stock_transactions (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    product_id INT NOT NULL,

    branch_id INT NOT NULL,

    employee_id INT NULL,

    transaction_type ENUM(
        'PURCHASE',
        'SALE',
        'ADJUSTMENT',
        'RETURN',
        'DAMAGE',
        'EXPIRY',
        'TRANSFER_IN',
        'TRANSFER_OUT'
    ) NOT NULL,

    quantity INT NOT NULL,

    previous_quantity INT NOT NULL,

    new_quantity INT NOT NULL,

    reason VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CONSTRAINT fk_stock_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id),

    CONSTRAINT fk_stock_employee
        FOREIGN KEY (employee_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);