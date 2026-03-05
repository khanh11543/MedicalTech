import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import VerifyOtp from "./pages/AuthPages/VerifyOtp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import UserList from "./pages/UserManagement/UserList";
import DoctorVerification from "./pages/DoctorVerification/DoctorVerification";
import AppointmentList from "./pages/AppointmentManagement/AppointmentList";
import AppointmentDetail from "./pages/AppointmentManagement/AppointmentDetail";
import AppointmentStatistics from "./pages/AppointmentManagement/AppointmentStatistics";
import PrescriptionList from "./pages/PrescriptionManagement/PrescriptionList";
import PrescriptionDetail from "./pages/PrescriptionManagement/PrescriptionDetail";
import PrescriptionTemplates from "./pages/PrescriptionManagement/PrescriptionTemplates";
import PaymentList from "./pages/PaymentManagement/PaymentList";
import PaymentDetail from "./pages/PaymentManagement/PaymentDetail";
import RefundList from "./pages/PaymentManagement/RefundList";
import RefundDetail from "./pages/PaymentManagement/RefundDetail";
import ReviewList from "./pages/ReviewManagement/ReviewList";
import ContentList from "./pages/ContentManagement/ContentList";
import SecurityAudit from "./pages/SecurityAudit/SecurityAudit";
import ReportsAnalytics from "./pages/ReportsAnalytics/ReportsAnalytics";
import RevenueReports from "./pages/RevenueReports/RevenueReports";
import GDPRCompliance from "./pages/GDPRCompliance/GDPRCompliance";
import BackupMaintenance from "./pages/BackupMaintenance/BackupMaintenance";
import BackupDashboard from "./pages/BackupMaintenance/BackupDashboard";
import BackupHistory from "./pages/BackupMaintenance/BackupHistory";
import ManualBackup from "./pages/BackupMaintenance/ManualBackup";
import RestoreBackup from "./pages/BackupMaintenance/RestoreBackup";
import ScheduledMaintenance from "./pages/BackupMaintenance/ScheduledMaintenance";
import SystemOptimization from "./pages/BackupMaintenance/SystemOptimization";
import NotificationCenter from "./pages/Notifications/NotificationCenter";
import TimeSlotCalendar from "./pages/TimeSlotManagement/TimeSlotCalendar";
import TimeSlotList from "./pages/TimeSlotManagement/TimeSlotList";
import TimeSlotBulkCreate from "./pages/TimeSlotManagement/TimeSlotBulkCreate";
import TimeSlotTemplates from "./pages/TimeSlotManagement/TimeSlotTemplates";
import TimeSlotRules from "./pages/TimeSlotManagement/TimeSlotRules";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";

// Receptionist Pages
import ReceptionistDashboard from "./pages/Receptionist/ReceptionistDashboard";
import ReceptionistAppointments from "./pages/Receptionist/ReceptionistAppointments";
import ReceptionistAppointmentDetail from "./pages/Receptionist/Appointments/AppointmentDetail";
import ReceptionistPatients from "./pages/Receptionist/ReceptionistPatients";
import ReceptionistQueue from "./pages/Receptionist/ReceptionistQueue";
import ReceptionistPayments from "./pages/Receptionist/ReceptionistPayments";
import ReceptionistReports from "./pages/Receptionist/ReceptionistReports";
import ReceptionistNotifications from "./pages/Receptionist/ReceptionistNotifications";
import ReceptionistSettings from "./pages/Receptionist/ReceptionistSettings";
import AdminSettings from "./pages/AdminSettings/AdminSettings";

// Landing Pages (Public)
import LandingLayout from "./pages/Landing/LandingLayout";
import HomePage from "./pages/Landing/HomePage";
import AboutPage from "./pages/Landing/AboutPage";
import DepartmentsPage from "./pages/Landing/DepartmentsPage";
import DepartmentDetailPage from "./pages/Landing/DepartmentDetailPage";
import ServicesPage from "./pages/Landing/ServicesPage";
import DoctorsPage from "./pages/Landing/DoctorsPage";
import AppointmentPage from "./pages/Landing/AppointmentPage";
import ContactPage from "./pages/Landing/ContactPage";
import TestimonialsPage from "./pages/Landing/TestimonialsPage";
import FAQPage from "./pages/Landing/FAQPage";
import GalleryPage from "./pages/Landing/GalleryPage";
import TermsPage from "./pages/Landing/TermsPage";
import PrivacyPage from "./pages/Landing/PrivacyPage";
import ServiceDetailPage from "./pages/Landing/ServiceDetailPage";

// Patient Portal Pages
import PatientAccount from "./pages/Landing/PatientAccount";
import PatientProfile from "./pages/Landing/PatientProfile";
import PatientAppointments from "./pages/Landing/PatientAppointments";
import PatientPayments from "./pages/Landing/PatientPayments";
import { PatientPortal } from "./pages/Landing/components/PatientNav";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
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

          {/* Protected Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />



              {/* Doctor Verification */}
              <Route path="doctor-verification" element={<DoctorVerification />} />


            {/* Appointment Management */}
            <Route path="/appointment-list" element={<AppointmentList />} />
            <Route path="/appointment-detail/:id" element={<AppointmentDetail />} />
            <Route path="/appointment-statistics" element={<AppointmentStatistics />} />

            {/* Time Slot Management */}
            <Route path="/timeslot-calendar" element={<TimeSlotCalendar />} />
            <Route path="/timeslot-list" element={<TimeSlotList />} />
            <Route path="/timeslot-bulk-create" element={<TimeSlotBulkCreate />} />
            <Route path="/timeslot-templates" element={<TimeSlotTemplates />} />
            <Route path="/timeslot-rules" element={<TimeSlotRules />} />

            {/* Prescription Management */}
            <Route path="/prescription-list" element={<PrescriptionList />} />
            <Route path="/prescription-list/:id" element={<PrescriptionDetail />} />
            <Route path="/prescription-templates" element={<PrescriptionTemplates />} />

            {/* Payment Management */}
            <Route path="/payment-list" element={<PaymentList />} />
            <Route path="/payment-list/:id" element={<PaymentDetail />} />

            {/* Refund Management */}
            <Route path="/refund-list" element={<RefundList />} />
            <Route path="/refund-list/:id" element={<RefundDetail />} />

              {/* Reports & Analytics */}
              <Route path="reports-analytics" element={<ReportsAnalytics />} />

              {/* Announcements */}
              <Route path="announcements" element={<Announcements />} />

            {/* Admin Personal Settings */}
            <Route path="/admin/settings" element={<AdminSettings />} />



            {/* Revenue Reports */}
            <Route path="/revenue-reports" element={<RevenueReports />} />

            {/* GDPR & Compliance */}
            <Route path="/gdpr-compliance" element={<GDPRCompliance />} />

            {/* Backup & Maintenance */}
            <Route path="/backup-maintenance" element={<BackupMaintenance />} />
            <Route path="/backup-dashboard" element={<BackupDashboard />} />
            <Route path="/backup-history" element={<BackupHistory />} />
            <Route path="/manual-backup" element={<ManualBackup />} />
            <Route path="/restore-backup" element={<RestoreBackup />} />
            <Route path="/scheduled-maintenance" element={<ScheduledMaintenance />} />
            <Route path="/system-optimization" element={<SystemOptimization />} />

            {/* Notifications */}
            <Route path="/notifications" element={<NotificationCenter />} />


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
              <Route path="appointments" element={<DoctorAppointments />} />
              <Route path="schedule" element={<DoctorSchedule />} />
              <Route path="consultation" element={<DoctorConsultation />} />
              <Route path="prescriptions" element={<DoctorPrescriptions />} />
              <Route path="patients" element={<DoctorPatients />} />
              <Route path="reviews" element={<DoctorReviews />} />
              {/* Shared Pages */}
              <Route path="profile" element={<UserProfiles />} />
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="account-settings" element={<AccountSettings />} />
              <Route path="support" element={<UserSupport />} />
            </Route>
          </Route>

          {/* Root redirect — checks role and redirects */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
