-- =========================================================
-- MR AREA ASSIGNMENTS
-- =========================================================

USE mk_animal_health;


CREATE TABLE mr_area_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    mr_id INT NOT NULL,

    area_id INT NOT NULL,

    assigned_date DATE NOT NULL,

    end_date DATE NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    assigned_by INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_mr_area_mr
        FOREIGN KEY (mr_id)
        REFERENCES mr_profiles(mr_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_mr_area
        FOREIGN KEY (area_id)
        REFERENCES areas(area_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_mr_area_admin
        FOREIGN KEY (assigned_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);