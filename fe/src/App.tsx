import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import VerifyOtp from "./pages/AuthPages/VerifyOtp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import UserList from "./pages/UserManagement/UserList";
import DoctorVerification from "./pages/DoctorVerification/DoctorVerification";
import AppointmentList from "./pages/AppointmentManagement/AppointmentList";
import PrescriptionList from "./pages/PrescriptionManagement/PrescriptionList";
import PaymentList from "./pages/PaymentManagement/PaymentList";
import ReviewList from "./pages/ReviewManagement/ReviewList";
import ContentList from "./pages/ContentManagement/ContentList";
import SystemSettings from "./pages/SystemSettings/SystemSettings";
import SecurityAudit from "./pages/SecurityAudit/SecurityAudit";
import ReportsAnalytics from "./pages/ReportsAnalytics/ReportsAnalytics";
import GDPRCompliance from "./pages/GDPRCompliance/GDPRCompliance";
import BackupMaintenance from "./pages/BackupMaintenance/BackupMaintenance";
import Announcements from "./pages/Announcements/Announcements";
import NotificationList from "./pages/NotificationManagement/NotificationList";
import SystemHealth from "./pages/SystemHealth/SystemHealth";
import EditProfile from "./pages/EditProfile/EditProfile";
import AccountSettings from "./pages/AccountSettings/AccountSettings";
import SupportList from "./pages/SupportManagement/SupportList";
import UserSupport from "./pages/UserSupport/UserSupport";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";
import DebugInfo from "./pages/Debug/DebugInfo";
import PatientLayout from "./layout/PatientLayout";
import PatientDashboard from "./pages/Patient/PatientDashboard";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Admin Routes - Protected with ADMIN role check */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AppLayout />}>
              <Route index element={<Home />} />

            {/* User Management */}
            <Route path="user-list" element={<UserList />} />

            {/* Doctor Verification */}
            <Route path="doctor-verification" element={<DoctorVerification />} />

            {/* Appointment Management */}
            <Route path="appointment-list" element={<AppointmentList />} />

            {/* Prescription Management */}
            <Route path="prescription-list" element={<PrescriptionList />} />

            {/* Payment Management */}
            <Route path="payment-list" element={<PaymentList />} />

            {/* Review Management */}
            <Route path="review-list" element={<ReviewList />} />

            {/* Content Management */}
            <Route path="content-list" element={<ContentList />} />

            {/* System Settings */}
            <Route path="system-settings" element={<SystemSettings />} />

            {/* Security & Audit */}
            <Route path="security-audit" element={<SecurityAudit />} />

            {/* Reports & Analytics */}
            <Route path="reports-analytics" element={<ReportsAnalytics />} />

            {/* GDPR & Compliance */}
            <Route path="gdpr-compliance" element={<GDPRCompliance />} />

            {/* Backup & Maintenance */}
            <Route path="backup-maintenance" element={<BackupMaintenance />} />

            {/* Announcements */}
            <Route path="announcements" element={<Announcements />} />

            {/* Notification Management */}
            <Route path="notification-list" element={<NotificationList />} />

            {/* System Health */}
            <Route path="system-health" element={<SystemHealth />} />

            {/* Support Tickets */}
            <Route path="support-tickets" element={<SupportList />} />
            
            {/* Debug Info */}
            <Route path="debug" element={<DebugInfo />} />

            {/* Others Page */}
            <Route path="profile" element={<UserProfiles />} />
            <Route path="edit-profile" element={<EditProfile />} />
            <Route path="account-settings" element={<AccountSettings />} />
            <Route path="support" element={<UserSupport />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="blank" element={<Blank />} />

            {/* Forms */}
            <Route path="form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            <Route path="alerts" element={<Alerts />} />
            <Route path="avatars" element={<Avatars />} />
            <Route path="badge" element={<Badges />} />
            <Route path="buttons" element={<Buttons />} />
            <Route path="images" element={<Images />} />
            <Route path="videos" element={<Videos />} />

            {/* Charts */}
            <Route path="line-chart" element={<LineChart />} />
            <Route path="bar-chart" element={<BarChart />} />
            </Route>
          </Route>

          {/* Patient Routes - Protected but no ADMIN role required */}
          <Route element={<ProtectedRoute />}>
            <Route path="/patient" element={<PatientLayout />}>
              <Route index element={<PatientDashboard />} />
              <Route path="appointments" element={<div className="p-6">Appointments - Coming Soon</div>} />
              <Route path="records" element={<div className="p-6">Medical Records - Coming Soon</div>} />
              <Route path="prescriptions" element={<div className="p-6">Prescriptions - Coming Soon</div>} />
              <Route path="profile" element={<div className="p-6">Profile Settings - Coming Soon</div>} />
            </Route>
          </Route>

          {/* Root redirect - protected by AdminProtectedRoute, will redirect non-admins to /patient */}
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
