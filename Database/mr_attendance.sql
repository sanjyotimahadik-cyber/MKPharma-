-- =========================================================
-- MR ATTENDANCE
-- =========================================================

USE mk_animal_health;


CREATE TABLE mr_attendance (
    attendance_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    mr_id INT NOT NULL,

    attendance_date DATE NOT NULL,

    login_time DATETIME,

    logout_time DATETIME,

    status ENUM(
        'PRESENT',
        'ABSENT',
        'HALF_DAY',
        'LEAVE'
    ) DEFAULT 'PRESENT',

    latitude DECIMAL(10,7),

    longitude DECIMAL(10,7),

    location_accuracy DECIMAL(10,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_mr_attendance_mr
        FOREIGN KEY (mr_id)
        REFERENCES mr_profiles(mr_id)
        ON DELETE CASCADE,

    UNIQUE (mr_id, attendance_date)
);