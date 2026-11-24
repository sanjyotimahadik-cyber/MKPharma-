-- =========================================================
-- MK ANIMAL HEALTH ERP
-- MR PROFILE
-- =========================================================

USE mk_animal_health;


CREATE TABLE mr_profiles (
    mr_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    full_name VARCHAR(150) NOT NULL,

    birth_date DATE,

    address TEXT,

    area_id INT,

    group_id INT,

    employee_code VARCHAR(50) UNIQUE,

    joining_date DATE,

    profile_photo VARCHAR(500),

    profile_completed BOOLEAN DEFAULT FALSE,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_mr_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_mr_area
        FOREIGN KEY (area_id)
        REFERENCES areas(area_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_mr_group
        FOREIGN KEY (group_id)
        REFERENCES groups_master(group_id)
        ON DELETE SET NULL
);