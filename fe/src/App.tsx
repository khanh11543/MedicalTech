import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import VerifyOtp from "./pages/AuthPages/VerifyOtp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import UserList from "./pages/UserManagement/UserList";
import DoctorVerification from "./pages/DoctorVerification/DoctorVerification";

import ReviewList from "./pages/ReviewManagement/ReviewList";
import ContentList from "./pages/ContentManagement/ContentList";
import ReportsAnalytics from "./pages/ReportsAnalytics/ReportsAnalytics";
import Announcements from "./pages/Announcements/Announcements";
import NotificationList from "./pages/NotificationManagement/NotificationList";

import EditProfile from "./pages/EditProfile/EditProfile";
import AccountSettings from "./pages/AccountSettings/AccountSettings";

import UserSupport from "./pages/UserSupport/UserSupport";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";
import DebugInfo from "./pages/Debug/DebugInfo";

import PatientLayout from "./layout/PatientLayout";
import DoctorLayout from "./layout/DoctorLayout";
import PatientDashboard from "./pages/Patient/PatientDashboard";
import DoctorSearch from "./pages/Patient/DoctorSearch";
import DoctorDetailPage from "./pages/Patient/DoctorDetailPage";
import MyAppointments from "./pages/Patient/MyAppointments";
import MedicalRecords from "./pages/Patient/MedicalRecords";
import MyPrescriptions from "./pages/Patient/MyPrescriptions";
import PaymentHistory from "./pages/Patient/PaymentHistory";
import PatientProfile from "./pages/Patient/PatientProfile";
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

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
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
        <Routes>
          {/* Admin Routes - Protected with ADMIN role check */}
          <Route element={<AdminProtectedRoute />}>
            <Route path="/admin" element={<AppLayout />}>
              <Route index element={<Home />} />

              {/* User Management */}
              <Route path="user-list" element={<UserList />} />



              {/* Doctor Verification */}
              <Route path="doctor-verification" element={<DoctorVerification />} />



              {/* Review Management */}
              <Route path="review-list" element={<ReviewList />} />

              {/* Content Management */}
              <Route path="content-list" element={<ContentList />} />

              {/* Reports & Analytics */}
              <Route path="reports-analytics" element={<ReportsAnalytics />} />

              {/* Announcements */}
              <Route path="announcements" element={<Announcements />} />

              {/* Notification Management */}
              <Route path="notification-list" element={<NotificationList />} />





              {/* Debug Info */}
              <Route path="debug" element={<DebugInfo />} />

              {/* Others Page */}
              <Route path="profile" element={<UserProfiles />} />
              <Route path="edit-profile" element={<EditProfile />} />
              <Route path="account-settings" element={<AccountSettings />} />
              <Route path="support" element={<UserSupport />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="blank" element={<Blank />} />


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
