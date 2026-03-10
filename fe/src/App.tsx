import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";

// Layouts — keep eager (needed immediately on auth)
import AppLayout from "./layout/AppLayout";
import LandingLayout from "./pages/Landing/LandingLayout";

// Route-level lazy loading — each page is a separate chunk
const SignIn = lazy(() => import("./pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("./pages/AuthPages/SignUp"));
const VerifyOtp = lazy(() => import("./pages/AuthPages/VerifyOtp"));
const VerifyAccount = lazy(() => import("./pages/AuthPages/VerifyAccount"));
const NotFound = lazy(() => import("./pages/OtherPage/NotFound"));

// Admin Pages
const Home = lazy(() => import("./pages/Dashboard/Home"));
const UserList = lazy(() => import("./pages/UserManagement/UserList"));
const CreateUser = lazy(() => import("./pages/UserManagement/CreateUser"));
const DoctorVerification = lazy(() => import("./pages/DoctorVerification/DoctorVerification"));
const VerificationDetail = lazy(() => import("./pages/DoctorVerification/VerificationDetail"));
const AppointmentList = lazy(() => import("./pages/AppointmentManagement/AppointmentList"));
const AppointmentDetail = lazy(() => import("./pages/AppointmentManagement/AppointmentDetail"));
const AppointmentStatistics = lazy(() => import("./pages/AppointmentManagement/AppointmentStatistics"));
const PrescriptionList = lazy(() => import("./pages/PrescriptionManagement/PrescriptionList"));
const PrescriptionDetail = lazy(() => import("./pages/PrescriptionManagement/PrescriptionDetail"));
const PrescriptionTemplates = lazy(() => import("./pages/PrescriptionManagement/PrescriptionTemplates"));
const PaymentList = lazy(() => import("./pages/PaymentManagement/PaymentList"));
const PaymentDetail = lazy(() => import("./pages/PaymentManagement/PaymentDetail"));
const RefundList = lazy(() => import("./pages/PaymentManagement/RefundList"));
const RefundDetail = lazy(() => import("./pages/PaymentManagement/RefundDetail"));
const ReviewList = lazy(() => import("./pages/ReviewManagement/ReviewList"));
const ContentList = lazy(() => import("./pages/ContentManagement/ContentList"));
const SecurityAudit = lazy(() => import("./pages/SecurityAudit/SecurityAudit"));
const ReportsAnalytics = lazy(() => import("./pages/ReportsAnalytics/ReportsAnalytics"));
const RevenueReports = lazy(() => import("./pages/RevenueReports/RevenueReports"));
const GDPRCompliance = lazy(() => import("./pages/GDPRCompliance/GDPRCompliance"));
const BackupMaintenance = lazy(() => import("./pages/BackupMaintenance/BackupMaintenance"));
const BackupDashboard = lazy(() => import("./pages/BackupMaintenance/BackupDashboard"));
const BackupHistory = lazy(() => import("./pages/BackupMaintenance/BackupHistory"));
const ManualBackup = lazy(() => import("./pages/BackupMaintenance/ManualBackup"));
const RestoreBackup = lazy(() => import("./pages/BackupMaintenance/RestoreBackup"));
const ScheduledMaintenance = lazy(() => import("./pages/BackupMaintenance/ScheduledMaintenance"));
const SystemOptimization = lazy(() => import("./pages/BackupMaintenance/SystemOptimization"));
const NotificationCenter = lazy(() => import("./pages/Notifications/NotificationCenter"));
const TimeSlotCalendar = lazy(() => import("./pages/TimeSlotManagement/TimeSlotCalendar"));
const TimeSlotList = lazy(() => import("./pages/TimeSlotManagement/TimeSlotList"));
const TimeSlotBulkCreate = lazy(() => import("./pages/TimeSlotManagement/TimeSlotBulkCreate"));
const TimeSlotTemplates = lazy(() => import("./pages/TimeSlotManagement/TimeSlotTemplates"));
const TimeSlotRules = lazy(() => import("./pages/TimeSlotManagement/TimeSlotRules"));
const AdminSettings = lazy(() => import("./pages/AdminSettings/AdminSettings"));

// Receptionist Pages
const ReceptionistDashboard = lazy(() => import("./pages/Receptionist/ReceptionistDashboard"));
const ReceptionistAppointments = lazy(() => import("./pages/Receptionist/ReceptionistAppointments"));
const ReceptionistAppointmentDetail = lazy(() => import("./pages/Receptionist/Appointments/AppointmentDetail"));
const ReceptionistPatients = lazy(() => import("./pages/Receptionist/ReceptionistPatients"));
const ReceptionistQueue = lazy(() => import("./pages/Receptionist/ReceptionistQueue"));
const ReceptionistPayments = lazy(() => import("./pages/Receptionist/ReceptionistPayments"));
const ReceptionistReports = lazy(() => import("./pages/Receptionist/ReceptionistReports"));
const ReceptionistSettings = lazy(() => import("./pages/Receptionist/ReceptionistSettings"));

// Landing Pages (Public)
const HomePage = lazy(() => import("./pages/Landing/HomePage"));
const AboutPage = lazy(() => import("./pages/Landing/AboutPage"));
const DepartmentsPage = lazy(() => import("./pages/Landing/DepartmentsPage"));
const DepartmentDetailPage = lazy(() => import("./pages/Landing/DepartmentDetailPage"));
const ServicesPage = lazy(() => import("./pages/Landing/ServicesPage"));
const DoctorsPage = lazy(() => import("./pages/Landing/DoctorsPage"));
const AppointmentPage = lazy(() => import("./pages/Landing/AppointmentPage"));
const ContactPage = lazy(() => import("./pages/Landing/ContactPage"));
const TestimonialsPage = lazy(() => import("./pages/Landing/TestimonialsPage"));
const FAQPage = lazy(() => import("./pages/Landing/FAQPage"));
const GalleryPage = lazy(() => import("./pages/Landing/GalleryPage"));
const TermsPage = lazy(() => import("./pages/Landing/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/Landing/PrivacyPage"));
const ServiceDetailPage = lazy(() => import("./pages/Landing/ServiceDetailPage"));

// Patient Portal Pages
const PatientAccount = lazy(() => import("./pages/Landing/PatientAccount"));
const PatientProfile = lazy(() => import("./pages/Landing/PatientProfile"));
const PatientAppointments = lazy(() => import("./pages/Landing/PatientAppointments"));
const PatientPayments = lazy(() => import("./pages/Landing/PatientPayments"));
import { PatientPortal } from "./pages/Landing/components/PatientNav";

// Patient Pages
import PatientLayout from "./pages/Patient/PatientLayout";
const PatientDashboard = lazy(() => import("./pages/Patient/PatientDashboard"));
const MyAppointments = lazy(() => import("./pages/Patient/MyAppointments"));
const DoctorSearch = lazy(() => import("./pages/Patient/DoctorSearch"));
const DoctorDetailPage = lazy(() => import("./pages/Patient/DoctorDetailPage"));
const MedicalRecords = lazy(() => import("./pages/Patient/MedicalRecords"));
const MyPrescriptions = lazy(() => import("./pages/Patient/MyPrescriptions"));
const PaymentHistory = lazy(() => import("./pages/Patient/PaymentHistory"));

// Doctor Pages
import DoctorLayout from "./layout/DoctorLayout";
const DoctorDashboard = lazy(() => import("./pages/Doctor/DoctorDashboard"));
const DoctorToday = lazy(() => import("./pages/Doctor/DoctorToday"));
const DoctorAppointments = lazy(() => import("./pages/Doctor/DoctorAppointments"));
const DoctorSchedule = lazy(() => import("./pages/Doctor/DoctorSchedule"));
const DoctorConsultation = lazy(() => import("./pages/Doctor/DoctorConsultation"));
const DoctorPrescriptions = lazy(() => import("./pages/Doctor/DoctorPrescriptions"));
const DoctorPatients = lazy(() => import("./pages/Doctor/DoctorPatients"));
const DoctorReviews = lazy(() => import("./pages/Doctor/DoctorReviews"));
const DoctorProfileSetup = lazy(() => import("./pages/Doctor/DoctorProfileSetup"));
const DoctorVerificationCenter = lazy(() => import("./pages/Doctor/DoctorVerificationCenter"));
const DoctorSettings = lazy(() => import("./pages/Doctor/DoctorSettings"));
import DoctorProtectedRoute from "./components/auth/DoctorProtectedRoute";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import DoctorToday from "./pages/Doctor/DoctorToday";
import DoctorAppointments from "./pages/Doctor/DoctorAppointments";
import DoctorAppointmentsUpcoming from "./pages/Doctor/DoctorAppointmentsUpcoming";
import DoctorAppointmentsPending from "./pages/Doctor/DoctorAppointmentsPending";
import DoctorAppointmentsHistory from "./pages/Doctor/DoctorAppointmentsHistory";
import DoctorSchedule from "./pages/Doctor/DoctorSchedule";
import DoctorScheduleWeekly from "./pages/Doctor/DoctorScheduleWeekly";
import DoctorScheduleTimeOff from "./pages/Doctor/DoctorScheduleTimeOff";
import DoctorScheduleTemplates from "./pages/Doctor/DoctorScheduleTemplates";
import DoctorScheduleBlockSlots from "./pages/Doctor/DoctorScheduleBlockSlots";
import DoctorConsultation from "./pages/Doctor/DoctorConsultation";
import DoctorPrescriptions from "./pages/Doctor/DoctorPrescriptions";
import DoctorPrescriptionsCreate from "./pages/Doctor/DoctorPrescriptionsCreate";
import DoctorPrescriptionsHistory from "./pages/Doctor/DoctorPrescriptionsHistory";
import DoctorPrescriptionsTemplates from "./pages/Doctor/DoctorPrescriptionsTemplates";
import DoctorPatients from "./pages/Doctor/DoctorPatients";
import DoctorPatientsMyPatients from "./pages/Doctor/DoctorPatientsMyPatients";
import DoctorPatientsRecent from "./pages/Doctor/DoctorPatientsRecent";
import DoctorPatientsChronic from "./pages/Doctor/DoctorPatientsChronic";
import DoctorReviews from "./pages/Doctor/DoctorReviews";

// Shared Pages
const EditProfile = lazy(() => import("./pages/EditProfile/EditProfile"));
const AccountSettings = lazy(() => import("./pages/AccountSettings/AccountSettings"));
const UserSupport = lazy(() => import("./pages/UserSupport/UserSupport"));

// Suspense fallback for lazy-loaded pages
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Landing Pages */}
          <Route element={<LandingLayout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/departments/:slug" element={<DepartmentDetailPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/:slug" element={<ServiceDetailPage />} />
            <Route path="/doctors" element={<DoctorsPage />} />
            <Route path="/appointment" element={<AppointmentPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />

            {/* Patient Portal */}
            <Route element={<PatientPortal />}>
              <Route path="/patient/appointments" element={<PatientAppointments />} />
              <Route path="/patient/payments" element={<PatientPayments />} />
              <Route path="/patient/profile" element={<PatientProfile />} />
              <Route path="/patient/account" element={<PatientAccount />} />
            </Route>
          </Route>

          {/* Protected Dashboard Layout - Admin */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<Home />} />

              {/* User Management */}
              <Route path="/admin/user-list" element={<UserList />} />
              <Route path="/admin/create-user" element={<CreateUser />} />

              {/* Doctor Verification */}
              <Route path="/admin/doctor-verification" element={<DoctorVerification />} />
              <Route path="/admin/doctor-verification/:doctorId" element={<VerificationDetail />} />

            {/* Appointment Management */}
            <Route path="/admin/appointment-list" element={<AppointmentList />} />
            <Route path="/admin/appointment-detail/:id" element={<AppointmentDetail />} />
            <Route path="/admin/appointment-statistics" element={<AppointmentStatistics />} />

            {/* Time Slot Management */}
            <Route path="/admin/timeslot-calendar" element={<TimeSlotCalendar />} />
            <Route path="/admin/timeslot-list" element={<TimeSlotList />} />
            <Route path="/admin/timeslot-bulk-create" element={<TimeSlotBulkCreate />} />
            <Route path="/admin/timeslot-templates" element={<TimeSlotTemplates />} />
            <Route path="/admin/timeslot-rules" element={<TimeSlotRules />} />

            {/* Prescription Management */}
            <Route path="/admin/prescription-list" element={<PrescriptionList />} />
            <Route path="/admin/prescription-list/:id" element={<PrescriptionDetail />} />
            <Route path="/admin/prescription-templates" element={<PrescriptionTemplates />} />

            {/* Payment Management */}
            <Route path="/admin/payment-list" element={<PaymentList />} />
            <Route path="/admin/payment-list/:id" element={<PaymentDetail />} />

            {/* Refund Management */}
            <Route path="/admin/refund-list" element={<RefundList />} />
            <Route path="/admin/refund-list/:id" element={<RefundDetail />} />

              {/* Review Management */}
              <Route path="/admin/review-list" element={<ReviewList />} />

              {/* Content Management */}
              <Route path="/admin/content-list" element={<ContentList />} />

              {/* Reports & Analytics */}
              <Route path="/admin/reports-analytics" element={<ReportsAnalytics />} />

            {/* Admin Personal Settings */}
            <Route path="/admin/settings" element={<AdminSettings />} />

              {/* Security & Audit */}
              <Route path="/admin/security-audit" element={<SecurityAudit />} />

            {/* Revenue Reports */}
            <Route path="/admin/revenue-reports" element={<RevenueReports />} />

            {/* GDPR & Compliance */}
            <Route path="/admin/gdpr-compliance" element={<GDPRCompliance />} />

            {/* Backup & Maintenance */}
            <Route path="/admin/backup-maintenance" element={<BackupMaintenance />} />
            <Route path="/admin/backup-dashboard" element={<BackupDashboard />} />
            <Route path="/admin/backup-history" element={<BackupHistory />} />
            <Route path="/admin/manual-backup" element={<ManualBackup />} />
            <Route path="/admin/restore-backup" element={<RestoreBackup />} />
            <Route path="/admin/scheduled-maintenance" element={<ScheduledMaintenance />} />
            <Route path="/admin/system-optimization" element={<SystemOptimization />} />

            {/* Notifications */}
            <Route path="/admin/notifications" element={<NotificationCenter />} />


            </Route>
          </Route>

          {/* Receptionist Routes - Role Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route element={<RoleProtectedRoute allowedRoles={["RECEPTIONIST"]} />}>
                <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
                <Route path="/receptionist/appointments" element={<ReceptionistAppointments />} />
                <Route path="/receptionist/appointments/:id" element={<ReceptionistAppointmentDetail />} />
                <Route path="/receptionist/patients" element={<ReceptionistPatients />} />
                <Route path="/receptionist/queue" element={<ReceptionistQueue />} />
                <Route path="/receptionist/payments" element={<ReceptionistPayments />} />
                <Route path="/receptionist/reports" element={<ReceptionistReports />} />
                <Route path="/receptionist/notifications" element={<NotificationCenter />} />
                <Route path="/receptionist/settings" element={<ReceptionistSettings />} />
              </Route>
            </Route>
          </Route>

          {/* Patient Routes - Protected but no ADMIN role required */}
          <Route element={<ProtectedRoute />}>
            <Route path="/patient" element={<PatientLayout />}>
              <Route index element={<PatientDashboard />} />
              <Route path="appointments" element={<MyAppointments />} />
              <Route path="doctors" element={<DoctorSearch />} />
              <Route path="doctors/:id" element={<DoctorDetailPage />} />
              <Route path="records" element={<MedicalRecords />} />
              <Route path="prescriptions" element={<MyPrescriptions />} />
              <Route path="payments" element={<PaymentHistory />} />
              <Route path="profile" element={<PatientProfile />} />
            </Route>
          </Route>

          {/* Doctor Routes - Protected with DOCTOR role check */}
          <Route element={<DoctorProtectedRoute />}>
            <Route path="/doctor" element={<DoctorLayout />}>
              <Route index element={<DoctorDashboard />} />
              <Route path="today" element={<DoctorToday />} />
              
              {/* Appointments Routes */}
              <Route path="appointments" element={<DoctorAppointments />} />
              <Route path="appointments/upcoming" element={<DoctorAppointmentsUpcoming />} />
              <Route path="appointments/pending" element={<DoctorAppointmentsPending />} />
              <Route path="appointments/history" element={<DoctorAppointmentsHistory />} />
              
              {/* Schedule Routes */}
              <Route path="schedule" element={<DoctorSchedule />} />
              <Route path="schedule/weekly" element={<DoctorScheduleWeekly />} />
              <Route path="schedule/time-off-breaks" element={<DoctorScheduleTimeOff />} />
              <Route path="schedule/templates" element={<DoctorScheduleTemplates />} />
              <Route path="schedule/block-slots" element={<DoctorScheduleBlockSlots />} />
              
              <Route path="consultation" element={<DoctorConsultation />} />
              
              {/* Prescriptions Routes */}
              <Route path="prescriptions" element={<DoctorPrescriptions />} />
              <Route path="prescriptions/create" element={<DoctorPrescriptionsCreate />} />
              <Route path="prescriptions/history" element={<DoctorPrescriptionsHistory />} />
              <Route path="prescriptions/templates" element={<DoctorPrescriptionsTemplates />} />
              
              {/* Patients Routes */}
              <Route path="patients" element={<DoctorPatients />} />
              <Route path="patients/my-patients" element={<DoctorPatientsMyPatients />} />
              <Route path="patients/recent" element={<DoctorPatientsRecent />} />
              <Route path="patients/chronic-allergy-flags" element={<DoctorPatientsChronic />} />
              
              <Route path="reviews" element={<DoctorReviews />} />
              <Route path="profile-setup" element={<DoctorProfileSetup />} />
              <Route path="verification-center" element={<DoctorVerificationCenter />} />
              <Route path="settings" element={<DoctorSettings />} />
              {/* Shared Pages */}
              <Route path="profile" element={<EditProfile />} />
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="account-settings" element={<AccountSettings />} />
              <Route path="support" element={<UserSupport />} />
            </Route>
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/verify-account" element={<VerifyAccount />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
