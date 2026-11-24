-- =========================================================
-- MK ANIMAL HEALTH ERP
-- BILLING & ORDER MODULE
-- =========================================================

USE mk_animal_health;


-- =========================================================
-- 1. ORDERS
-- =========================================================

CREATE TABLE orders (
    order_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    order_number VARCHAR(50) NOT NULL UNIQUE,

    buyer_user_id INT NOT NULL,

    buyer_type ENUM(
        'PHARMACY',
        'DOCTOR',
        'MR'
    ) NOT NULL,

    branch_id INT NOT NULL,

    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    order_status ENUM(
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'COMPLETED',
        'CANCELLED'
    ) DEFAULT 'PENDING',

    subtotal DECIMAL(12,2) DEFAULT 0.00,

    discount_amount DECIMAL(12,2) DEFAULT 0.00,

    tax_amount DECIMAL(12,2) DEFAULT 0.00,

    grand_total DECIMAL(12,2) DEFAULT 0.00,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_buyer
        FOREIGN KEY (buyer_user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_order_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
);


-- =========================================================
-- 2. ORDER ITEMS
-- =========================================================

CREATE TABLE order_items (
    order_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    order_id BIGINT NOT NULL,

    product_id INT NOT NULL,

    quantity INT NOT NULL,

    unit_price DECIMAL(10,2) NOT NULL,

    discount_amount DECIMAL(10,2) DEFAULT 0.00,

    gst_rate DECIMAL(5,2) DEFAULT 0.00,

    tax_amount DECIMAL(10,2) DEFAULT 0.00,

    total_amount DECIMAL(12,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);


-- =========================================================
-- 3. INVOICES
-- =========================================================

CREATE TABLE invoices (
    invoice_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    invoice_number VARCHAR(50) NOT NULL UNIQUE,

    order_id BIGINT NOT NULL UNIQUE,

    buyer_user_id INT NOT NULL,

    branch_id INT NOT NULL,

    invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    buyer_name VARCHAR(150) NOT NULL,

    buyer_address TEXT,

    buyer_phone VARCHAR(20),

    buyer_email VARCHAR(150),

    buyer_gst_number VARCHAR(30),

    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    taxable_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    cgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    sgst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    igst_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    total_tax DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    payment_status ENUM(
        'UNPAID',
        'PARTIAL',
        'PAID',
        'REFUNDED'
    ) DEFAULT 'UNPAID',

    invoice_status ENUM(
        'DRAFT',
        'GENERATED',
        'CANCELLED'
    ) DEFAULT 'DRAFT',

    pdf_path VARCHAR(500),

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoice_order
        FOREIGN KEY (order_id)
        REFERENCES orders(order_id),

    CONSTRAINT fk_invoice_buyer
        FOREIGN KEY (buyer_user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_invoice_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(branch_id)
);


-- =========================================================
-- 4. INVOICE ITEMS
-- =========================================================

CREATE TABLE invoice_items (
    invoice_item_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    invoice_id BIGINT NOT NULL,

    product_id INT NOT NULL,

    product_name VARCHAR(150) NOT NULL,

    product_code VARCHAR(50),

    quantity INT NOT NULL,

    unit_price DECIMAL(10,2) NOT NULL,

    discount_amount DECIMAL(10,2) DEFAULT 0.00,

    taxable_amount DECIMAL(12,2) DEFAULT 0.00,

    gst_rate DECIMAL(5,2) DEFAULT 0.00,

    cgst_amount DECIMAL(10,2) DEFAULT 0.00,

    sgst_amount DECIMAL(10,2) DEFAULT 0.00,

    igst_amount DECIMAL(10,2) DEFAULT 0.00,

    total_amount DECIMAL(12,2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoice_item_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(invoice_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_invoice_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);


-- =========================================================
-- 5. PAYMENTS
-- =========================================================

CREATE TABLE payments (
    payment_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    invoice_id BIGINT NOT NULL,

    payment_reference VARCHAR(100),

    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    amount DECIMAL(12,2) NOT NULL,

    payment_method ENUM(
        'CASH',
        'UPI',
        'BANK_TRANSFER',
        'CHEQUE',
        'CARD',
        'OTHER'
    ) NOT NULL,

    payment_status ENUM(
        'PENDING',
        'SUCCESS',
        'FAILED',
        'REFUNDED'
    ) DEFAULT 'SUCCESS',

    transaction_note VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(invoice_id)
        ON DELETE CASCADE
);