-- =========================================================
-- MR VISIT FEEDBACK
-- =========================================================

USE mk_animal_health;


CREATE TABLE mr_visit_feedback (
    feedback_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    visit_id BIGINT NOT NULL UNIQUE,

    feedback_text TEXT,

    product_interest TEXT,

    sample_requested BOOLEAN DEFAULT FALSE,

    follow_up_required BOOLEAN DEFAULT FALSE,

    follow_up_date DATE NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_visit
        FOREIGN KEY (visit_id)
        REFERENCES mr_visits(visit_id)
        ON DELETE CASCADE
);