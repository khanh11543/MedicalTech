-- Optional migration: add doctor_id and image_urls to testimonials
-- If you use spring.jpa.hibernate.ddl-auto=update, Hibernate will add these columns automatically.

-- ALTER TABLE testimonials ADD COLUMN doctor_id BIGINT NULL;
-- ALTER TABLE testimonials ADD CONSTRAINT fk_testimonials_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id);
-- ALTER TABLE testimonials ADD COLUMN image_urls TEXT NULL;

-- Drop old unique constraint if you had one testimonial per user (now we allow multiple: one per doctor or general)
-- ALTER TABLE testimonials DROP INDEX uk_testimonials_user_id;
