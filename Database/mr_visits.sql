-- =========================================================
-- MR DOCTOR VISITS
-- =========================================================

USE mk_animal_health;


CREATE TABLE mr_visits (
    visit_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    mr_id INT NOT NULL,

    doctor_id INT NOT NULL,

    area_id INT NOT NULL,

    visit_date DATE NOT NULL,

    check_in_time DATETIME,

    check_out_time DATETIME,

    latitude DECIMAL(10,7),

    longitude DECIMAL(10,7),

    location_accuracy DECIMAL(10,2),

    status ENUM(
        'PLANNED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED'
    ) DEFAULT 'PLANNED',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_visit_mr
        FOREIGN KEY (mr_id)
        REFERENCES mr_profiles(mr_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_visit_doctor
        FOREIGN KEY (doctor_id)
        REFERENCES doctor_profiles(doctor_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_visit_area
        FOREIGN KEY (area_id)
        REFERENCES areas(area_id)
        ON DELETE CASCADE
);