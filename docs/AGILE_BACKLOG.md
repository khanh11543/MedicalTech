# Agile Backlog - 1 Month Sprint (4 Weeks)

## 📅 Sprint Structure
- **Duration**: 4 weeks (20 working days)
- **Team**: 4-5 developers
- **Sprint Velocity Target**: 40-50 story points
- **Daily Standup**: 15 mins
- **Sprint Review/Retro**: End of week 4

---

## 🎯 SPRINT 1 (Week 1-2) - MVP 1: Authentication & Doctor Discovery

### **Epic 1: User Authentication & Authorization**

**Story 1.1**: User Registration (Patient & Doctor)
- Acceptance Criteria:
  - ✓ Patient đăng ký với email, password, tên, số điện thoại
  - ✓ Doctor đăng ký thêm thông tin chuyên khoa, bằng cấp
  - ✓ Validation email
  - ✓ Password hashing (bcrypt)
- Tasks:
  - BE: Create User model, AuthController, UserRepository
  - BE: Email verification endpoint
  - FE-Patient: Register form, validation
  - FE-Doctor: Extended register form
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 1.2**: User Login & JWT Authentication
- Acceptance Criteria:
  - ✓ Login với email + password
  - ✓ Phát hành JWT token (access + refresh)
  - ✓ Refresh token logic
  - ✓ Logout & token invalidation
- Tasks:
  - BE: JwtUtil, AuthService, LoginController
  - BE: Middleware authentication
  - FE-Patient: Login form, token storage (localStorage)
  - FE-Doctor: Login form
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 1.3**: Role-Based Access Control (RBAC)
- Acceptance Criteria:
  - ✓ 3 roles: PATIENT, DOCTOR, ADMIN
  - ✓ Authorization middleware
  - ✓ Protected endpoints
- Tasks:
  - BE: Role model, authorization decorators
  - BE: Update endpoints with role checks
- Story Points: **5**
- Time Estimate: 1 day

---

### **Epic 2: Doctor Discovery & Search**

**Story 2.1**: List All Doctors with Filters
- Acceptance Criteria:
  - ✓ API endpoint: GET /doctors
  - ✓ Filter by specialty (chuyên khoa)
  - ✓ Filter by availability
  - ✓ Pagination (10 doctors/page)
  - ✓ Sort by rating
- Tasks:
  - BE: DoctorRepository with query optimization
  - BE: DoctorController - list endpoint
  - FE-Patient: Doctor list page, filter UI
  - FE-Patient: Search bar component
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 2.2**: Doctor Detail View
- Acceptance Criteria:
  - ✓ GET /doctors/{id} endpoint
  - ✓ Display: bio, qualifications, specialties, rating
  - ✓ Available time slots
  - ✓ Patient reviews
- Tasks:
  - BE: DoctorDetail endpoint
  - FE-Patient: Doctor profile page
  - FE-Patient: Available slots display
- Story Points: **5**
- Time Estimate: 1-2 days

---

### **Epic 3: Appointment Booking (Basic)**

**Story 3.1**: Create Appointment
- Acceptance Criteria:
  - ✓ Patient selects doctor, date, time
  - ✓ Create appointment in DB
  - ✓ Validate slot availability
  - ✓ Return appointment confirmation
- Tasks:
  - BE: Appointment model, AppointmentController
  - BE: Validate time slot logic
  - FE-Patient: Booking form with date/time picker
  - FE-Patient: Confirmation screen
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 3.2**: Doctor View Appointments
- Acceptance Criteria:
  - ✓ GET /appointments (doctor's appointments)
  - ✓ List with patient info, appointment time
  - ✓ Status: PENDING, CONFIRMED, COMPLETED
- Tasks:
  - BE: AppointmentService filtering by doctor
  - FE-Doctor: Appointments calendar/list view
- Story Points: **5**
- Time Estimate: 1-2 days

---

### **Epic 4: Database & Data Models**

**Story 4.1**: Database Schema Design
- Tables: User, Doctor, Patient, Appointment, Review, Specialty
- Tasks:
  - BE: Create SQL schema
  - BE: Create JPA entities
  - BE: Database migrations (Flyway/Liquibase)
- Story Points: **5**
- Time Estimate: 1 day

---

## 🎯 SPRINT 2 (Week 3-4) - MVP 2: Appointment Management & Doctor Dashboard

### **Epic 5: Doctor Schedule Management**

**Story 5.1**: Doctor Set Working Hours
- Acceptance Criteria:
  - ✓ Doctor defines working schedule (Mon-Fri, 9-5)
  - ✓ Set break times
  - ✓ Block dates/times
- Tasks:
  - BE: Schedule model, ScheduleController
  - FE-Doctor: Schedule configuration UI
  - FE-Doctor: Calendar view with blocks
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 5.2**: Doctor Set Consultation Fees
- Acceptance Criteria:
  - ✓ Set hourly/per-appointment rate
  - ✓ Update rates
- Tasks:
  - BE: Fee configuration endpoint
  - FE-Doctor: Fee management page
- Story Points: **3**
- Time Estimate: 1 day

---

### **Epic 6: Appointment Management**

**Story 6.1**: Cancel/Reschedule Appointment
- Acceptance Criteria:
  - ✓ Patient cancels appointment (24h before)
  - ✓ Doctor confirms cancellation
  - ✓ Reschedule to another slot
  - ✓ Refund logic (if applicable)
- Tasks:
  - BE: Cancel/Reschedule endpoints
  - FE-Patient: Cancel/Reschedule UI
  - FE-Doctor: Approve cancel requests
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 6.2**: Appointment Status Workflow
- Acceptance Criteria:
  - ✓ Status: BOOKED → CONFIRMED → COMPLETED/CANCELLED
  - ✓ Status change notifications
- Tasks:
  - BE: Status machine/state management
  - BE: Status update endpoints
- Story Points: **5**
- Time Estimate: 1-2 days

---

### **Epic 7: Notification System**

**Story 7.1**: Appointment Reminder (Email)
- Acceptance Criteria:
  - ✓ Send email 24h before appointment
  - ✓ Template: date, time, doctor/patient name
- Tasks:
  - BE: EmailService, ScheduledTask
  - BE: Email templates
  - BE: Configure SMTP
- Story Points: **5**
- Time Estimate: 1-2 days

**Story 7.2**: In-App Notifications
- Acceptance Criteria:
  - ✓ Notification model
  - ✓ Fetch unread notifications
  - ✓ Mark as read
- Tasks:
  - BE: Notification service
  - FE: Notification component
- Story Points: **5**
- Time Estimate: 1-2 days

---

### **Epic 8: Medical Profile**

**Story 8.1**: Patient Medical Profile
- Acceptance Criteria:
  - ✓ Store: medical history, allergies, medications
  - ✓ Upload documents (prescriptions, test results)
- Tasks:
  - BE: MedicalProfile model, FileUpload service
  - FE-Patient: Medical profile form
  - FE-Patient: File upload component
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 8.2**: Appointment History
- Acceptance Criteria:
  - ✓ Show past appointments with doctor notes
  - ✓ Download/Print history
- Tasks:
  - BE: Appointment history endpoint
  - FE-Patient: History page
  - FE-Patient: Export to PDF
- Story Points: **5**
- Time Estimate: 1-2 days

---

## �️ SECURITY & COMPLIANCE (Ongoing - Parallel to Sprints)

### **Epic 9: Authentication & Data Security**

**Story 9.1**: Implement HTTPS & TLS Encryption
- Acceptance Criteria:
  - ✓ All API endpoints use HTTPS/TLS 1.2+
  - ✓ SSL certificate configuration
  - ✓ HSTS headers enabled
  - ✓ Certificate renewal automation
- Tasks:
  - BE: SSL configuration in Spring Boot
  - DevOps: Certificate setup (Let's Encrypt/AWS Certificate Manager)
  - DevOps: Auto-renewal pipeline
- Story Points: **5**
- Time Estimate: 1-2 days

**Story 9.2**: Implement Two-Factor Authentication (2FA)
- Acceptance Criteria:
  - ✓ Support TOTP (Time-based One-Time Password)
  - ✓ Backup codes for account recovery
  - ✓ Optional for both Patient and Doctor
- Tasks:
  - BE: 2FA service, TOTP generation
  - BE: Backup code generation & validation
  - FE-Patient: 2FA setup wizard
  - FE-Doctor: 2FA setup wizard
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 9.3**: Secure Password Policies
- Acceptance Criteria:
  - ✓ Password minimum 12 characters with complexity rules
  - ✓ Password history (prevent reuse of last 5 passwords)
  - ✓ Password expiration (90 days)
  - ✓ Account lockout after 5 failed attempts
  - ✓ Secure password reset via email
- Tasks:
  - BE: Password validator service
  - BE: Account lockout mechanism
  - BE: Password expiration scheduler
  - FE: Password strength indicator
- Story Points: **5**
- Time Estimate: 1-2 days

**Story 9.4**: JWT Token Security Hardening
- Acceptance Criteria:
  - ✓ Token expiration: 15 minutes (access), 7 days (refresh)
  - ✓ Token rotation on every refresh
  - ✓ Blacklist revoked tokens
  - ✓ Secure storage of refresh tokens (httpOnly cookies)
  - ✓ CSRF protection
- Tasks:
  - BE: Token blacklist service (Redis)
  - BE: CSRF middleware
  - BE: Secure cookie configuration
- Story Points: **8**
- Time Estimate: 2-3 days

---

### **Epic 10: API Security & Input Validation**

**Story 10.1**: Input Validation & Sanitization
- Acceptance Criteria:
  - ✓ Server-side validation for all inputs
  - ✓ Sanitize user inputs to prevent XSS
  - ✓ SQL injection prevention (parameterized queries)
  - ✓ Email validation
  - ✓ Phone number validation
  - ✓ File upload validation (type, size, scanning)
- Tasks:
  - BE: Input validators for all DTOs
  - BE: Spring Security configuration
  - BE: File upload scanner (antivirus integration)
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 10.2**: Rate Limiting & DDoS Protection
- Acceptance Criteria:
  - ✓ Rate limit: 100 requests/minute per IP
  - ✓ Per-endpoint rate limits
  - ✓ DDoS protection enabled
  - ✓ IP blacklist management
- Tasks:
  - BE: Spring Cloud Gateway rate limiting
  - BE: Custom rate limit interceptor
  - DevOps: AWS Shield/WAF configuration
- Story Points: **5**
- Time Estimate: 1-2 days

**Story 10.3**: CORS & API Security Headers
- Acceptance Criteria:
  - ✓ CORS configured for frontend domains only
  - ✓ Security headers (X-Frame-Options, X-Content-Type-Options, CSP)
  - ✓ No sensitive info in error messages
  - ✓ API versioning for backward compatibility
- Tasks:
  - BE: CORS configuration
  - BE: Security headers filter
  - BE: Error handling standardization
- Story Points: **3**
- Time Estimate: 1 day

**Story 10.4**: API Documentation Security
- Acceptance Criteria:
  - ✓ Swagger UI secured (authentication required)
  - ✓ Sensitive endpoints marked in documentation
  - ✓ Rate limit documentation
  - ✓ Security best practices guide
- Tasks:
  - BE: Swagger authentication
  - BE: API security documentation
- Story Points: **2**
- Time Estimate: 0.5 day

---

### **Epic 11: Data Protection & Privacy (HIPAA/GDPR)**

**Story 11.1**: Data Encryption at Rest
- Acceptance Criteria:
  - ✓ Encrypt medical records in database
  - ✓ Encrypt PII (personally identifiable information)
  - ✓ Encrypt uploaded documents (medical files)
  - ✓ Encryption key management (AWS KMS/HashiCorp Vault)
  - ✓ Encryption key rotation policy
- Tasks:
  - BE: JPA encryption listener
  - BE: Encryption service implementation
  - DevOps: KMS setup & key rotation
- Story Points: **13**
- Time Estimate: 3-4 days

**Story 11.2**: HIPAA Compliance
- Acceptance Criteria:
  - ✓ PHI (Protected Health Information) access logging
  - ✓ Data audit trail (who accessed what and when)
  - ✓ Minimum necessary principle implementation
  - ✓ Business Associate Agreement (BAA) with third parties
  - ✓ HIPAA-compliant backup & disaster recovery
- Tasks:
  - BE: Audit logging service
  - BE: PHI access control
  - DevOps: HIPAA-compliant infrastructure
- Story Points: **13**
- Time Estimate: 3-4 days

**Story 11.3**: GDPR Data Privacy Compliance
- Acceptance Criteria:
  - ✓ Right to access (export user data)
  - ✓ Right to be forgotten (delete user data)
  - ✓ Data portability (export in standard format)
  - ✓ Consent management for data processing
  - ✓ Privacy policy & terms of service
  - ✓ Data Processing Agreement (DPA)
- Tasks:
  - BE: User data export endpoint
  - BE: User data deletion endpoint (GDPR compliant)
  - BE: Consent management service
  - FE: Privacy consent banner
- Story Points: **13**
- Time Estimate: 3-4 days

**Story 11.4**: Data Retention & Deletion Policy
- Acceptance Criteria:
  - ✓ Automatic deletion of deleted account data after 30 days
  - ✓ Archive old appointments (> 2 years)
  - ✓ Secure deletion (DBAN standards)
  - ✓ Retention policy logging
- Tasks:
  - BE: Data retention scheduler
  - BE: Secure deletion service
  - DevOps: Backup retention policy
- Story Points: **5**
- Time Estimate: 1-2 days

---

### **Epic 12: Security Testing & Vulnerability Management**

**Story 12.1**: Dependency Vulnerability Scanning
- Acceptance Criteria:
  - ✓ Automated OWASP Dependency Check
  - ✓ CVE database updates (daily)
  - ✓ Alerts for high/critical vulnerabilities
  - ✓ Patch management workflow
- Tasks:
  - DevOps: OWASP Dependency Check setup
  - DevOps: GitHub Actions/Jenkins pipeline
  - DevOps: Vulnerability alert notifications
- Story Points: **3**
- Time Estimate: 1 day

**Story 12.2**: Static Code Security Analysis (SAST)
- Acceptance Criteria:
  - ✓ SonarQube security analysis
  - ✓ Checkmarx/Fortify scanning (optional)
  - ✓ Code quality gates (Security A+ grade)
  - ✓ Security bug detection
- Tasks:
  - DevOps: SonarQube setup & integration
  - CI/CD: Automated SAST in pipeline
- Story Points: **5**
- Time Estimate: 1-2 days

**Story 12.3**: Penetration Testing
- Acceptance Criteria:
  - ✓ Black-box penetration testing
  - ✓ Authentication bypass testing
  - ✓ Authorization flaw testing
  - ✓ Vulnerability report & remediation
  - ✓ Quarterly penetration tests
- Tasks:
  - QA: Organize penetration testing (external vendor)
  - BE: Fix identified vulnerabilities
  - DevOps: Security monitoring enhancements
- Story Points: **13**
- Time Estimate: 2+ weeks (external vendor)

**Story 12.4**: Security Unit Tests
- Acceptance Criteria:
  - ✓ Test authentication mechanisms
  - ✓ Test authorization (role-based access)
  - ✓ Test input validation
  - ✓ Test encryption/decryption
  - ✓ >90% code coverage for security-critical paths
- Tasks:
  - BE: JUnit5 security tests
  - BE: MockMvc for endpoint security
  - QA: Security test automation
- Story Points: **8**
- Time Estimate: 2-3 days

---

### **Epic 13: Logging, Monitoring & Incident Response**

**Story 13.1**: Comprehensive Security Logging
- Acceptance Criteria:
  - ✓ Log all authentication attempts (success/failure)
  - ✓ Log all authorization failures
  - ✓ Log sensitive data access
  - ✓ Log administrative actions
  - ✓ Immutable audit logs (cannot be deleted)
  - ✓ Log retention: 1 year minimum
- Tasks:
  - BE: AuditLog entity & service
  - BE: Spring Security event listeners
  - BE: Immutable log storage (separate database)
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 13.2**: Security Monitoring & Alerting
- Acceptance Criteria:
  - ✓ Real-time alert on suspicious login attempts
  - ✓ Alert on multiple failed authentication
  - ✓ Alert on unusual API usage patterns
  - ✓ Alert on mass data access
  - ✓ Slack/Email notifications for security team
- Tasks:
  - DevOps: Prometheus + Grafana setup
  - DevOps: Custom security metrics
  - DevOps: Alert rules & escalation
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 13.3**: Incident Response Plan
- Acceptance Criteria:
  - ✓ Document incident response procedures
  - ✓ Define roles & responsibilities
  - ✓ Communication templates
  - ✓ Evidence preservation guidelines
  - ✓ Post-incident review process
- Tasks:
  - Security: Document incident response plan
  - Team: Training on incident response
  - DevOps: Automated response playbooks
- Story Points: **5**
- Time Estimate: 1-2 days

---

### **Epic 14: Infrastructure Security**

**Story 14.1**: Network Security
- Acceptance Criteria:
  - ✓ VPC with private subnets
  - ✓ Security groups configured (least privilege)
  - ✓ NACLs (Network Access Control Lists)
  - ✓ VPN for admin access
  - ✓ DDoS protection (AWS Shield Standard/Advanced)
- Tasks:
  - DevOps: AWS VPC architecture
  - DevOps: Security group rules
  - DevOps: VPN setup
- Story Points: **8**
- Time Estimate: 2-3 days

**Story 14.2**: Database Security
- Acceptance Criteria:
  - ✓ Database encryption enabled
  - ✓ Encrypted backups
  - ✓ DB access logs enabled
  - ✓ Minimal database user privileges
  - ✓ Automated backup to S3 (encrypted)
  - ✓ Multi-AZ deployment
- Tasks:
  - DevOps: RDS encryption & backup
  - DevOps: Database user role management
- Story Points: **5**
- Time Estimate: 1-2 days

**Story 14.3**: Secrets Management
- Acceptance Criteria:
  - ✓ No hardcoded secrets in code/config
  - ✓ Use HashiCorp Vault / AWS Secrets Manager
  - ✓ Automatic secret rotation
  - ✓ Audit trail for secret access
  - ✓ Database credentials, API keys secured
- Tasks:
  - DevOps: Vault/Secrets Manager setup
  - BE: Spring Cloud Vault integration
  - CI/CD: Secret injection in pipelines
- Story Points: **8**
- Time Estimate: 2-3 days

---

## 📊 Security Backlog Summary

| Epic | Stories | Total SP | Priority | Timeline |
|------|---------|----------|----------|----------|
| Epic 9: Authentication | 4 stories | 26 SP | **P0** | Sprint 1 |
| Epic 10: API Security | 4 stories | 18 SP | **P0** | Sprint 1-2 |
| Epic 11: Data Protection | 4 stories | 44 SP | **P0** | Sprint 2 + Phase 2 |
| Epic 12: Security Testing | 4 stories | 29 SP | **P1** | Ongoing |
| Epic 13: Logging & Monitoring | 3 stories | 21 SP | **P1** | Sprint 2 |
| Epic 14: Infrastructure | 3 stories | 21 SP | **P0** | Before Production |
| **Total Security** | **22 stories** | **159 SP** | - | **Ongoing** |

---

## 🎯 Security Integration into Sprints

### **Sprint 1 - Security Tasks**
- Story 9.1: HTTPS/TLS Setup (1-2 days)
- Story 10.1: Input Validation (2-3 days)
- Story 10.3: CORS & Security Headers (1 day)
- **Additional Security SP in Sprint 1**: ~10 SP

### **Sprint 2 - Security Tasks**
- Story 9.2: 2FA Implementation (2-3 days)
- Story 10.2: Rate Limiting (1-2 days)
- Story 13.1: Security Logging (2-3 days)
- Story 13.2: Security Monitoring (2-3 days)
- **Additional Security SP in Sprint 2**: ~15 SP

### **Phase 2 - Security Hardening**
- Epic 11: Data Encryption & HIPAA/GDPR
- Story 12.3: Penetration Testing
- Story 14: Infrastructure Security
- Story 9.4: JWT Hardening
- **Security SP in Phase 2**: 90+ SP

---

## 🔐 Security Checklist - Definition of Done

- [ ] OWASP Top 10 compliance verified
- [ ] Input validation implemented for all endpoints
- [ ] Authentication & authorization tested
- [ ] Encryption configured (TLS + data at rest)
- [ ] Security headers added
- [ ] Dependency vulnerabilities checked
- [ ] Static code analysis passed
- [ ] Security unit tests written
- [ ] Audit logging configured
- [ ] Security documentation updated
- [ ] Code reviewed by security champion
- [ ] Penetration testing passed (for production)

---

## 📊 Backlog Summary - 1 Month + Security

| Sprint | Week | Epics | Stories | Total Story Points | Focus |
|--------|------|-------|---------|-------------------|-------|
| 1 | 1-2 | 4 | 8 | 50 + 10 SP (Security) | Auth, Search, Booking, Security Basics |
| 2 | 3-4 | 4 | 8 | 50 + 15 SP (Security) | Doctor Dashboard, Notifications, Medical Profile, Security Monitoring |
| **Security Parallel** | **Ongoing** | **6** | **22** | **159 SP** | **HIPAA/GDPR, Encryption, Monitoring** |
| **Total MVP** | **4 weeks** | **8** | **16** | **100** | **MVP Complete** |
| **Total with Security** | **4+ weeks** | **14** | **38** | **259 SP** | **MVP + Secure Release** |

---

## 🚀 Velocity & Team Allocation

### Team (5 developers)
- **Backend Team**: 2 devs (Spring Boot API)
- **Frontend Team (Patient)**: 1.5 devs (React/Vue)
- **Frontend Team (Doctor)**: 1.5 devs (React/Vue)
- **QA/DevOps**: 0.5 dev

### Estimated Delivery
- **Week 2**: Sprint 1 complete + UAT
- **Week 4**: Sprint 2 complete + UAT → **Ready for Beta Release**

---

## 🔧 Blockers & Risks

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Email service setup | Medium | Use SendGrid/Mailgun early |
| Database schema complexity | Medium | Design review Week 1 |
| Payment integration | High | Plan for Phase 2 |
| 2FA implementation | Low | Phase 2 optional |
| File storage (medical docs) | Medium | Use AWS S3/Cloud storage |

---

## ✅ Definition of Done

- [ ] Code reviewed & merged
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests pass
- [ ] API documented in OpenAPI/Swagger
- [ ] No critical bugs in QA
- [ ] Performance tested
- [ ] Deployed to staging

