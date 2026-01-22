# Online Medical Appointment System - Architecture Document

## 📐 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├──────────────────────────────────┬──────────────────────────────┤
│   Frontend-Patient (React/Vue)   │  Frontend-Doctor (React/Vue) │
│  - Patient Dashboard             │  - Doctor Dashboard          │
│  - Doctor Search & Discovery     │  - Schedule Management       │
│  - Appointment Booking           │  - Appointment Management    │
│  - Medical Profile               │  - Consultation Interface    │
│  - Reviews                       │  - Ratings                   │
│  - Notifications                 │  - Patient List              │
└──────────────────────────┬───────┴──────────────────────────────┘
                           │
                    HTTP/REST (JSON)
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        │    LOAD BALANCER / API GATEWAY      │
        │    (Optional - Nginx/Kong)          │
        │                                     │
        └──────────────────┬──────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                      BACKEND LAYER                              │
│                  (Spring Boot API v1.0)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           REST Controllers / API Layer                   │   │
│  │  - AuthController                                        │   │
│  │  - DoctorController                                      │   │
│  │  - AppointmentController                                 │   │
│  │  - PatientController                                     │   │
│  │  - ReviewController                                      │   │
│  │  - NotificationController                                │   │
│  └─────────────────┬───────────────────────────────────────┘   │
│                    │                                            │
│  ┌─────────────────▼───────────────────────────────────────┐   │
│  │       Business Logic / Service Layer                     │   │
│  │  - AuthService                                           │   │
│  │  - DoctorService                                         │   │
│  │  - AppointmentService                                    │   │
│  │  - PatientService                                        │   │
│  │  - ScheduleService                                       │   │
│  │  - NotificationService                                   │   │
│  │  - EmailService                                          │   │
│  └─────────────────┬───────────────────────────────────────┘   │
│                    │                                            │
│  ┌─────────────────▼───────────────────────────────────────┐   │
│  │    Data Access Layer / Repository Layer                  │   │
│  │  - UserRepository                                        │   │
│  │  - DoctorRepository                                      │   │
│  │  - AppointmentRepository                                 │   │
│  │  - PatientRepository                                     │   │
│  │  - ScheduleRepository                                    │   │
│  │  - ReviewRepository                                      │   │
│  │  - NotificationRepository                                │   │
│  └─────────────────┬───────────────────────────────────────┘   │
│                    │                                            │
│  ┌─────────────────┴───────────────────────────────────────┐   │
│  │    Middleware & Cross-Cutting Concerns                   │   │
│  │  - JWT Authentication Filter                             │   │
│  │  - CORS Handler                                          │   │
│  │  - Exception Handler                                     │   │
│  │  - Request Logging                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────┬───────────────────────────────┬──────────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────┐      ┌───────────────────────────┐
│    DATA ACCESS LAYER     │      │   EXTERNAL SERVICES       │
├──────────────────────────┤      ├───────────────────────────┤
│   RDBMS (MySQL)                 │  - Email Service          │
│   - Tables:                     │    (SendGrid/Mailgun)     │
│     • users                     │  - SMS Service (Twilio)   │
│     • doctors                   │  - Payment Gateway        │
│     • patients                  │    (Stripe/PayPal)        │
│     • appointments              │  - File Storage (AWS S3)  │
│     • schedules                 │  - Push Notification      │
│     • reviews                   │    (Firebase FCM)         │
│     • notifications             │                           │
│     • medical_profiles          │                           │
│                                 │                           │
└──────────────────────────┘      └───────────────────────────┘

         Cache Layer (Optional)      Message Queue (Optional)
         - Redis                     - RabbitMQ/Kafka
         - Query Cache               - Email Queue
         - Session Cache             - Notification Queue
```

---

## 🔧 Technology Stack

### Frontend
| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React / Vue.js | 18+ / 3+ |
| State Management | Redux / Pinia | Latest |
| HTTP Client | Axios / Fetch | Latest |
| UI Components | Material-UI / Bootstrap | Latest |
| Styling | CSS3 / Tailwind CSS | Latest |
| Build Tool | Vite | 4+ |
| Package Manager | npm / yarn | Latest |

### Backend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Spring Boot | 3.0+ |
| Language | Java | 17+ |
| ORM | Spring Data JPA | Latest |
| Database | MySQL / PostgreSQL | 8+ |
| Security | Spring Security + JWT | Latest |
| API Documentation | Springdoc OpenAPI | 2+ |
| Build Tool | Maven / Gradle | Latest |
| Testing | JUnit 5, Mockito | Latest |

### DevOps & Deployment
| Service | Technology |
|---------|-----------|
| Containerization | Docker |
| Orchestration | Kubernetes / Docker Compose |
| CI/CD | GitHub Actions / Jenkins |
| Monitoring | Prometheus + Grafana |
| Logging | ELK Stack (Elasticsearch, Logstash, Kibana) |
| Cloud Provider | AWS / Google Cloud / Azure |

---

## 📦 Backend Package Structure

```
src/main/java/com/q2k/meditech/
├── BeApplication.java                    # Main entry point
│
├── config/
│   ├── JwtConfig.java                    # JWT configuration
│   ├── SecurityConfig.java               # Spring Security config
│   ├── CorsConfig.java                   # CORS configuration
│   └── DatabaseConfig.java               # Database configuration
│
├── controller/
│   ├── AuthController.java               # Authentication endpoints
│   ├── DoctorController.java             # Doctor endpoints
│   ├── AppointmentController.java        # Appointment endpoints
│   ├── PatientController.java            # Patient endpoints
│   ├── ReviewController.java             # Review endpoints
│   └── NotificationController.java       # Notification endpoints
│
├── service/
│   ├── AuthService.java                  # Authentication logic
│   ├── DoctorService.java                # Doctor business logic
│   ├── AppointmentService.java           # Appointment management
│   ├── PatientService.java               # Patient management
│   ├── ScheduleService.java              # Schedule logic
│   ├── NotificationService.java          # Notification handling
│   ├── EmailService.java                 # Email sending
│   └── PaymentService.java               # Payment processing
│
├── repository/
│   ├── UserRepository.java               # User data access
│   ├── DoctorRepository.java             # Doctor data access
│   ├── AppointmentRepository.java        # Appointment data access
│   ├── PatientRepository.java            # Patient data access
│   ├── ScheduleRepository.java           # Schedule data access
│   ├── ReviewRepository.java             # Review data access
│   └── NotificationRepository.java       # Notification data access
│
├── entity/
│   ├── User.java                         # User entity (Base)
│   ├── Doctor.java                       # Doctor entity
│   ├── Patient.java                      # Patient entity
│   ├── Appointment.java                  # Appointment entity
│   ├── Schedule.java                     # Schedule entity
│   ├── MedicalProfile.java               # Medical profile entity
│   ├── Review.java                       # Review entity
│   └── Notification.java                 # Notification entity
│
├── dto/
│   ├── AuthDTO.java                      # Auth request/response DTOs
│   ├── DoctorDTO.java                    # Doctor DTOs
│   ├── AppointmentDTO.java               # Appointment DTOs
│   ├── PatientDTO.java                   # Patient DTOs
│   └── ReviewDTO.java                    # Review DTOs
│
├── exception/
│   ├── ResourceNotFoundException.java     # 404 exception
│   ├── UnauthorizedException.java        # 401 exception
│   ├── ValidationException.java          # 400 exception
│   └── GlobalExceptionHandler.java       # Global exception handler
│
├── filter/
│   └── JwtAuthenticationFilter.java      # JWT authentication filter
│
├── util/
│   ├── JwtUtil.java                      # JWT utilities
│   ├── DateUtil.java                     # Date utilities
│   ├── ValidationUtil.java               # Validation utilities
│   └── EmailUtil.java                    # Email utilities
│
└── resources/
    ├── application.properties             # Application config
    ├── application-dev.properties        # Development config
    ├── application-prod.properties       # Production config
    └── db/migration/
        ├── V1__Initial_Schema.sql        # Initial schema
        └── V2__Add_Tables.sql            # Additional tables
```

---

## 🗄️ Database Schema (Simplified)

```sql
-- Users (Base table)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    role ENUM('PATIENT', 'DOCTOR', 'ADMIN') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Doctors
CREATE TABLE doctors (
    id INT PRIMARY KEY,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    experience INT,
    bio TEXT,
    rating DECIMAL(3,2),
    consultation_fee DECIMAL(10,2),
    profile_image VARCHAR(255),
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Doctor Specialties
CREATE TABLE doctor_specialties (
    doctor_id INT,
    specialty VARCHAR(100),
    PRIMARY KEY (doctor_id, specialty),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Patients
CREATE TABLE patients (
    id INT PRIMARY KEY,
    date_of_birth DATE,
    gender ENUM('MALE', 'FEMALE', 'OTHER'),
    blood_type VARCHAR(5),
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Medical Profiles
CREATE TABLE medical_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL UNIQUE,
    allergies TEXT,
    medical_history TEXT,
    current_medications TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Schedules
CREATE TABLE schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    working_days VARCHAR(255),
    start_time TIME,
    end_time TIME,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- Appointments
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('BOOKED', 'CONFIRMED', 'COMPLETED', 'CANCELLED') DEFAULT 'BOOKED',
    reason VARCHAR(500),
    notes TEXT,
    doctor_notes TEXT,
    cancellation_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_appointment (doctor_id, appointment_date, appointment_time)
);

-- Reviews
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT NOT NULL,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255),
    message TEXT,
    type ENUM('APPOINTMENT_REMINDER', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'REVIEW', 'SYSTEM'),
    related_entity_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔐 Security Architecture

### Authentication Flow
```
1. User Registration
   └─> Email Verification
   └─> Password Hashing (bcrypt)
   └─> User saved to DB

2. User Login
   └─> Email + Password validation
   └─> Generate JWT token (access + refresh)
   └─> Return tokens to client

3. API Requests
   └─> Send JWT in Authorization header
   └─> JwtAuthenticationFilter validates token
   └─> Grant access if valid
   └─> Return 401 if expired/invalid

4. Token Refresh
   └─> Send refresh token
   └─> Generate new access token
   └─> Update client
```

### Authorization Strategy
- **Role-Based Access Control (RBAC)**
  - PATIENT: Can view own appointments, profile, reviews
  - DOCTOR: Can manage schedule, view appointments, add notes
  - ADMIN: Full access to all data

---

## 📱 Frontend Architecture

### Patient App Routes
```
/                          # Home/Dashboard
├── /auth
│   ├── /register         # Patient registration
│   └── /login            # Login page
├── /doctors
│   ├── /                 # Doctor list with filters
│   └── /:id              # Doctor detail
├── /appointments
│   ├── /                 # My appointments
│   ├── /new              # Book appointment
│   └── /:id              # Appointment detail
├── /profile
│   ├── /medical          # Medical profile
│   └── /edit             # Edit profile
├── /history              # Appointment history
├── /favorites            # Favorite doctors
└── /notifications        # Notifications
```

### Doctor App Routes
```
/                          # Dashboard
├── /auth
│   ├── /register         # Doctor registration
│   └── /login            # Login page
├── /appointments
│   ├── /                 # My appointments
│   ├── /:id              # Appointment detail
│   └── /calendar         # Calendar view
├── /schedule
│   ├── /working-hours    # Set working hours
│   └── /blocks           # Block dates/times
├── /profile
│   ├── /                 # My profile
│   ├── /edit             # Edit profile
│   └── /fee              # Set consultation fee
├── /reviews              # View reviews
└── /patients             # Patient list
```

---

## 🚀 Deployment Strategy

### Development
- Local: Docker Compose (Frontend + Backend + MySQL)
- Development Server: AWS EC2 / GCP Compute Engine

### Staging
- AWS ECS / Kubernetes cluster
- MySQL RDS
- CloudFront CDN

### Production
- Kubernetes on AWS EKS / GCP GKE
- MySQL RDS with Multi-AZ
- CloudFront CDN
- Auto-scaling enabled
- Load balancing (ALB/NLB)

---

## 📊 API Gateway Integration (Optional)

```
Client Requests
       │
       ▼
┌─────────────────┐
│  API Gateway    │
│  (Kong/AWS API  │
│   Gateway)      │
├─────────────────┤
│ - Rate Limiting │
│ - Authentication│
│ - Caching       │
│ - Logging       │
│ - Load Balancing│
└────────┬────────┘
         │
         ▼
   Backend Service
```

---

## 📈 Scalability Considerations

1. **Database**: Use read replicas for scaling read operations
2. **Caching**: Redis for session & query caching
3. **Message Queue**: RabbitMQ/Kafka for async operations (emails, notifications)
4. **CDN**: Serve static assets from CDN
5. **Microservices**: Future - split into separate services (auth, appointment, notification)

---

## 🔍 Monitoring & Logging

- **Application Monitoring**: Prometheus + Grafana
- **Log Aggregation**: ELK Stack
- **Error Tracking**: Sentry
- **APM**: New Relic / Datadog
- **Metrics**: JVM metrics, HTTP metrics, DB metrics

