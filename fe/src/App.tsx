import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
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
import SystemHealth from "./pages/SystemHealth/SystemHealth";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* User Management */}
            <Route path="/user-list" element={<UserList />} />

            {/* Doctor Verification */}
            <Route path="/doctor-verification" element={<DoctorVerification />} />

            {/* Appointment Management */}
            <Route path="/appointment-list" element={<AppointmentList />} />

            {/* Prescription Management */}
            <Route path="/prescription-list" element={<PrescriptionList />} />

            {/* Payment Management */}
            <Route path="/payment-list" element={<PaymentList />} />

            {/* Review Management */}
            <Route path="/review-list" element={<ReviewList />} />

            {/* Content Management */}
            <Route path="/content-list" element={<ContentList />} />

            {/* System Settings */}
            <Route path="/system-settings" element={<SystemSettings />} />

            {/* Security & Audit */}
            <Route path="/security-audit" element={<SecurityAudit />} />

            {/* Reports & Analytics */}
            <Route path="/reports-analytics" element={<ReportsAnalytics />} />

            {/* GDPR & Compliance */}
            <Route path="/gdpr-compliance" element={<GDPRCompliance />} />

            {/* Backup & Maintenance */}
            <Route path="/backup-maintenance" element={<BackupMaintenance />} />

            {/* Announcements */}
            <Route path="/announcements" element={<Announcements />} />

            {/* System Health */}
            <Route path="/system-health" element={<SystemHealth />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
