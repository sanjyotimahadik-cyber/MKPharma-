-- =========================================================
-- MR GEO-TAGGED VISIT PHOTOS
-- =========================================================

USE mk_animal_health;


CREATE TABLE mr_visit_photos (
    photo_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    visit_id BIGINT NOT NULL,

    photo_path VARCHAR(500) NOT NULL,

    latitude DECIMAL(10,7),

    longitude DECIMAL(10,7),

    location_accuracy DECIMAL(10,2),

    captured_at DATETIME,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_photo_visit
        FOREIGN KEY (visit_id)
        REFERENCES mr_visits(visit_id)
        ON DELETE CASCADE
);