import { Link, useLocation, Outlet } from "react-router-dom";
import { PageTitle } from "./SharedComponents";
import "../landing.css";

const patientLinks = [
  {
    path: "/patient/appointments",
    label: "Appointments",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: "/patient/payments",
    label: "Payment History",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    path: "/patient/profile",
    label: "Medical Profile",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    path: "/patient/account",
    label: "Account & Security",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

/* ─── Wrapper layout: left sidebar + right content ─── */
export function PatientPortal() {
  return (
    <>
      <PageTitle
        title="Patient Portal"
        description="Manage your appointments, payments, profiles, and account settings"
        breadcrumbs={[
          { label: "Home", to: "/home" },
          { label: "Patient Portal" },
        ]}
      />

      <section className="py-10 lg:py-14">
        <div className="patient-portal-container">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* ── Left Sidebar ── */}
            <PatientSidebar />

            {/* ── Right Content ── */}
            <main className="flex-1 min-w-0">
              <Outlet />
            </main>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── Sidebar component ─── */
function PatientSidebar() {
  const location = useLocation();

  return (
    <aside className="lg:w-[272px] shrink-0">
      <div className="lg:sticky lg:top-24 space-y-4">
        {/* User Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#049ebb] to-[#027a94] flex items-center justify-center text-white text-base font-bold shadow-md shadow-[#049ebb]/20">
              V
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">Do Ngoc Vinh</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">dv15@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-2">
          <ul className="space-y-0.5 list-none m-0 p-0">
            {patientLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium no-underline transition-all duration-200 group relative ${
                      isActive
                        ? "bg-[#049ebb]/8 text-[#049ebb]"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                    }`}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#049ebb] rounded-r-full" />
                    )}
                    <span className={`shrink-0 transition-colors duration-200 ${isActive ? "text-[#049ebb]" : "text-gray-400 group-hover:text-gray-500"}`}>
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-2">
          <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-medium text-red-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 bg-transparent border-none cursor-pointer">
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log out
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ─── Horizontal nav for mobile (exported, optional use in pages) ─── */
export default function PatientNav() {
  const location = useLocation();

  return (
    <div className="lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
      <div className="flex overflow-x-auto scrollbar-none">
        {patientLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap no-underline transition-all relative border-none ${
                isActive
                  ? "text-[#049ebb] bg-[#e6f7fb]/50"
                  : "text-gray-400 hover:text-[#049ebb] hover:bg-gray-50"
              }`}
            >
              {link.icon}
              {link.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#049ebb]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
