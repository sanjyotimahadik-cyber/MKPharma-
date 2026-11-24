-- =========================================================
-- MK ANIMAL HEALTH ERP
-- DOCTOR MANAGEMENT
-- =========================================================

USE mk_animal_health;


-- =========================================================
-- 1. DOCTOR TARGETS
-- =========================================================

CREATE TABLE doctor_targets (
    target_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    doctor_id INT NOT NULL,

    target_type VARCHAR(50) NOT NULL,

    target_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    achieved_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status ENUM(
        'PENDING',
        'IN_PROGRESS',
        'ACHIEVED',
        'MISSED',
        'CANCELLED'
    ) DEFAULT 'PENDING',

    assigned_by INT,

    notes VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_doctor_target_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctor_profiles(doctor_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_doctor_target_admin
        FOREIGN KEY (assigned_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);


-- =========================================================
-- 2. DOCTOR - MR ASSIGNMENTS
-- =========================================================

CREATE TABLE doctor_mr_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    doctor_id INT NOT NULL,

    mr_user_id INT NOT NULL,

    assigned_date DATE NOT NULL,

    end_date DATE NULL,

    status ENUM(
        'ACTIVE',
        'INACTIVE'
    ) DEFAULT 'ACTIVE',

    assigned_by INT,

    notes VARCHAR(500),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_assignment_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctor_profiles(doctor_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_mr
        FOREIGN KEY (mr_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_admin
        FOREIGN KEY (assigned_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);