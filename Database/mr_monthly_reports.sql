-- =========================================================
-- MR MONTHLY REPORTS
-- =========================================================

USE mk_animal_health;


CREATE TABLE mr_monthly_reports (
    report_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    mr_id INT NOT NULL,

    report_month DATE NOT NULL,

    total_visits INT DEFAULT 0,

    completed_visits INT DEFAULT 0,

    doctors_visited INT DEFAULT 0,

    attendance_days INT DEFAULT 0,

    total_feedback INT DEFAULT 0,

    samples_requested INT DEFAULT 0,

    report_file_path VARCHAR(500),

    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    status ENUM(
        'GENERATED',
        'SENT_TO_ADMIN',
        'REVIEWED'
    ) DEFAULT 'GENERATED',

    CONSTRAINT fk_monthly_report_mr
        FOREIGN KEY (mr_id)
        REFERENCES mr_profiles(mr_id)
        ON DELETE CASCADE,

    UNIQUE (mr_id, report_month)
);