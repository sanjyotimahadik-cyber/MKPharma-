-- =========================================================
-- MK ANIMAL HEALTH ERP
-- DOCTOR MODULE
-- =========================================================

USE mk_animal_health;


-- =========================================================
-- 1. DOCTOR PROFILES
-- =========================================================

CREATE TABLE doctor_profiles (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    full_name VARCHAR(150) NOT NULL,

    birth_date DATE,

    address TEXT,

    area_id INT,

    group_id INT,

    phone_no VARCHAR(20),

    email VARCHAR(150),

    clinic_name VARCHAR(150),

    profile_photo VARCHAR(500),

    profile_completed BOOLEAN DEFAULT FALSE,

    status ENUM('ACTIVE', 'INACTIVE')
        DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_doctor_area
        FOREIGN KEY (area_id)
        REFERENCES areas(area_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_doctor_group
        FOREIGN KEY (group_id)
        REFERENCES groups_master(group_id)
        ON DELETE SET NULL
);