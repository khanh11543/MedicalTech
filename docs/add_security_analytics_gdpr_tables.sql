-- =====================================================
-- Security, Analytics & GDPR Compliance Tables
-- =====================================================

-- Security Events Table (for security audit logging)
DROP TABLE IF EXISTS `security_events`;
CREATE TABLE `security_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint DEFAULT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'FAILED_LOGIN, LOCKOUT, PASSWORD_CHANGED, 2FA_ENABLED, etc.',
  `severity` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'INFO' COMMENT 'INFO, WARN, HIGH',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_security_events_user` (`user_id`),
  KEY `idx_security_events_type` (`event_type`),
  KEY `idx_security_events_created` (`created_at`),
  KEY `idx_security_events_severity` (`severity`),
  CONSTRAINT `fk_security_events_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Consents Table (for GDPR compliance)
DROP TABLE IF EXISTS `user_consents`;
CREATE TABLE `user_consents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `consent_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'DATA_PROCESSING, MARKETING, ANALYTICS, THIRD_PARTY_SHARING',
  `consent_given` tinyint(1) DEFAULT 0,
  `consent_text` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `granted_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_consents_user` (`user_id`),
  KEY `idx_user_consents_type` (`consent_type`),
  KEY `idx_user_consents_status` (`consent_given`),
  CONSTRAINT `fk_user_consents_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data Requests Table (for GDPR data portability and deletion requests)
DROP TABLE IF EXISTS `data_requests`;
CREATE TABLE `data_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `request_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'DATA_EXPORT, DATA_DELETION, DATA_RECTIFICATION',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT 'PENDING, IN_PROGRESS, COMPLETED, REJECTED',
  `request_reason` text COLLATE utf8mb4_unicode_ci,
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `processed_by` bigint DEFAULT NULL,
  `processed_at` datetime DEFAULT NULL,
  `data_file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Path to exported data file',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_data_requests_user` (`user_id`),
  KEY `idx_data_requests_type` (`request_type`),
  KEY `idx_data_requests_status` (`status`),
  KEY `idx_data_requests_created` (`created_at`),
  KEY `fk_data_requests_processor` (`processed_by`),
  CONSTRAINT `fk_data_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_data_requests_processor` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Data Processing Activities (GDPR Article 30 - Record of Processing Activities)
DROP TABLE IF EXISTS `data_processing_activities`;
CREATE TABLE `data_processing_activities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activity_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `purpose` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `legal_basis` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Consent, Contract, Legal obligation, etc.',
  `data_categories` json DEFAULT NULL COMMENT 'Array of data categories processed',
  `data_subjects` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Patients, Doctors, Staff, etc.',
  `recipients` text COLLATE utf8mb4_unicode_ci COMMENT 'Who receives the data',
  `transfer_countries` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retention_period` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `security_measures` text COLLATE utf8mb4_unicode_ci,
  `dpo_notes` text COLLATE utf8mb4_unicode_ci COMMENT 'Data Protection Officer notes',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data processing activities
INSERT INTO `data_processing_activities` 
(`activity_name`, `purpose`, `legal_basis`, `data_categories`, `data_subjects`, `recipients`, `retention_period`, `security_measures`, `is_active`) 
VALUES
('Patient Registration', 'To register patients in the system for medical services', 'Contract', 
 '["Personal Information", "Contact Details", "Medical History"]', 
 'Patients', 'Medical Staff, Administrators', '10 years after last visit', 
 'Encrypted database, Role-based access control, Regular backups', 1),
('Appointment Management', 'To schedule and manage medical appointments', 'Contract', 
 '["Personal Information", "Appointment Details", "Medical Specialty"]', 
 'Patients, Doctors', 'Receptionists, Doctors, Administrators', '5 years', 
 'Encrypted storage, Access logging, Two-factor authentication', 1),
('Payment Processing', 'To process payments for medical services', 'Contract', 
 '["Personal Information", "Payment Information", "Transaction Details"]', 
 'Patients', 'Payment processors (MoMo, VNPay), Finance team', '7 years', 
 'PCI-DSS compliant, Encrypted transactions, Tokenization', 1);
