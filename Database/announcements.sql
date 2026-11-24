-- =========================================================
-- MK ANIMAL HEALTH ERP
-- ANNOUNCEMENT MODULE
-- =========================================================

USE mk_animal_health;


-- =========================================================
-- 1. ANNOUNCEMENTS
-- =========================================================

CREATE TABLE announcements (
    announcement_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    announcement_type VARCHAR(50),

    created_by INT NOT NULL,

    publish_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    expiry_date DATETIME NULL,

    status ENUM(
        'DRAFT',
        'PUBLISHED',
        'EXPIRED',
        'CANCELLED'
    ) DEFAULT 'DRAFT',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_announcement_creator
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE RESTRICT
);


-- =========================================================
-- 2. ANNOUNCEMENT RECIPIENTS
-- =========================================================

CREATE TABLE announcement_recipients (
    recipient_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    announcement_id BIGINT NOT NULL,

    user_id INT NOT NULL,

    is_read BOOLEAN DEFAULT FALSE,

    read_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recipient_announcement
        FOREIGN KEY (announcement_id)
        REFERENCES announcements(announcement_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recipient_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    UNIQUE (announcement_id, user_id)
);