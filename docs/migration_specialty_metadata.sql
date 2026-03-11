-- Migration: Add slug, subtitle, highlights columns to specialties table
-- Date: 2026-03-09

ALTER TABLE specialties ADD COLUMN slug VARCHAR(100) UNIQUE AFTER image_url;
ALTER TABLE specialties ADD COLUMN subtitle VARCHAR(200) AFTER slug;
ALTER TABLE specialties ADD COLUMN highlights TEXT AFTER subtitle;

-- Populate metadata for existing specialties
UPDATE specialties SET
  icon_url   = 'bi bi-heart-pulse',
  image_url  = '/images/landing/cardiology-2.webp',
  slug       = 'internal-medicine',
  subtitle   = 'Internal Medicine',
  highlights = '["General Checkup", "Chronic Disease", "Internal Cardiology"]'
WHERE LOWER(name) = 'nội khoa';

UPDATE specialties SET
  icon_url   = 'bi bi-bandaid',
  image_url  = '/images/landing/orthopedics-4.webp',
  slug       = 'orthopedics',
  subtitle   = 'Surgery & Surgical Care',
  highlights = '["General Surgery", "Laparoscopic Surgery", "Orthopedic Trauma"]'
WHERE LOWER(name) = 'ngoại khoa';

UPDATE specialties SET
  icon_url   = 'bi bi-emoji-smile',
  image_url  = '/images/landing/pediatrics-2.webp',
  slug       = 'pediatrics',
  subtitle   = 'Children''s Health',
  highlights = '["Pediatric Exam", "Vaccination", "Child Nutrition"]'
WHERE LOWER(name) = 'nhi khoa';

UPDATE specialties SET
  icon_url   = 'bi bi-gender-female',
  image_url  = '/images/landing/facilities-1.webp',
  slug       = 'obstetrics',
  subtitle   = 'Women''s Health',
  highlights = '["Maternity Care", "Gynecology", "Family Planning"]'
WHERE LOWER(name) = 'sản phụ khoa';

UPDATE specialties SET
  icon_url   = 'bi bi-shield-plus',
  image_url  = '/images/landing/dermatology-3.webp',
  slug       = 'dermatology',
  subtitle   = 'Skin Health Experts',
  highlights = '["Skin Treatment", "Cosmetic Dermatology", "Laser Therapy"]'
WHERE LOWER(name) = 'da liễu';

UPDATE specialties SET
  icon_url   = 'bi bi-heart-fill',
  image_url  = '/images/landing/cardiology-3.webp',
  slug       = 'cardiology',
  subtitle   = 'Heart & Vascular Care',
  highlights = '["Echocardiogram", "Interventional Cardiology", "Cardiac Surgery"]'
WHERE LOWER(name) = 'tim mạch';

UPDATE specialties SET
  icon_url   = 'bi bi-lightning-fill',
  image_url  = '/images/landing/neurology-4.webp',
  slug       = 'neurology',
  subtitle   = 'Brain & Nervous System',
  highlights = '["Stroke Treatment", "Parkinson Care", "Chronic Headache"]'
WHERE LOWER(name) = 'thần kinh';

UPDATE specialties SET
  icon_url   = 'bi bi-eye',
  image_url  = '/images/landing/showcase-1.webp',
  slug       = 'ophthalmology',
  subtitle   = 'Eye Care Specialists',
  highlights = '["Lasik Surgery", "Cataract Treatment", "Eye Examination"]'
WHERE LOWER(name) = 'mắt';

UPDATE specialties SET
  icon_url   = 'bi bi-ear-fill',
  image_url  = '/images/landing/facilities-1.webp',
  slug       = 'ent',
  subtitle   = 'ENT Specialists',
  highlights = '["Sinusitis", "Tonsillitis", "Hearing Treatment"]'
WHERE LOWER(name) = 'tai mũi họng';

UPDATE specialties SET
  icon_url   = 'bi bi-emoji-laughing',
  image_url  = '/images/landing/showcase-1.webp',
  slug       = 'dental',
  subtitle   = 'Dental & Maxillofacial',
  highlights = '["Tooth Extraction", "Orthodontics", "Maxillofacial Surgery"]'
WHERE LOWER(name) = 'răng hàm mặt';
