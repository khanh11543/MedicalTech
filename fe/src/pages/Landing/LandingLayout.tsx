import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAvatarUrl } from "../../utils/avatar";

// MediTrust Logo SVG
function LogoIcon() {
  return (
    <svg className="logo-icon h-8 text-[#049ebb]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 22L2 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 22V6C17 4.11438 17 3.17157 16.4142 2.58579C15.8284 2 14.8856 2 13 2H11C9.11438 2 8.17157 2 7.58579 2.58579C7 3.17157 7 4.11438 7 6V22" stroke="currentColor" strokeWidth="1.5" />
      <path opacity="0.5" d="M21 22V8.5C21 7.09554 21 6.39331 20.6629 5.88886C20.517 5.67048 20.3295 5.48298 20.1111 5.33706C19.6067 5 18.9045 5 17.5 5" stroke="currentColor" strokeWidth="1.5" />
      <path opacity="0.5" d="M3 22V8.5C3 7.09554 3 6.39331 3.33706 5.88886C3.48298 5.67048 3.67048 5.48298 3.88886 5.33706C4.39331 5 5.09554 5 6.5 5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 22V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M10 12H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M5.5 11H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M5.5 14H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M17 11H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M17 14H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M5.5 8H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M17 8H18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path opacity="0.5" d="M10 15H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 9V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 7L10 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Navigation Links Data
const navLinks = [
  { path: "/home", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/departments", label: "Departments" },
  { path: "/services", label: "Services" },
  { path: "/doctors", label: "Doctors" },
  { path: "/contact", label: "Contact" },
];

const morePages = [
  { path: "/testimonials", label: "Testimonials" },
  { path: "/faq", label: "FAQ" },
  { path: "/gallery", label: "Gallery" },
  { path: "/terms", label: "Terms" },
  { path: "/privacy", label: "Privacy" },
];

export default function LandingLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const displayName = user?.fullName || user?.email?.split("@")[0] || "User";
  const userRoles = user?.roles || [];

  const getWorkspaceLink = (): { path: string; label: string; icon: string } | null => {
    if (userRoles.includes("ADMIN"))
      return { path: "/admin", label: "Admin Dashboard", icon: "bi bi-shield-lock" };
    if (userRoles.includes("DOCTOR"))
      return { path: "/doctor", label: "Doctor Dashboard", icon: "bi bi-heart-pulse" };
    if (userRoles.includes("RECEPTIONIST"))
      return { path: "/receptionist/dashboard", label: "Receptionist Dashboard", icon: "bi bi-clipboard2-pulse" };
    return null;
  };

  const workspaceLink = getWorkspaceLink();

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate("/home");
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  // Set browser tab title based on current route
  useEffect(() => {
    const titleMap: Record<string, string> = {
      "/home": "Home | MediTech",
      "/about": "About | MediTech",
      "/departments": "Departments | MediTech",
      "/services": "Services | MediTech",
      "/doctors": "Our Doctors | MediTech",
      "/appointment": "Book Appointment | MediTech",
      "/contact": "Contact Us | MediTech",
      "/testimonials": "Testimonials | MediTech",
      "/faq": "FAQ | MediTech",
      "/gallery": "Gallery | MediTech",
      "/terms": "Terms of Service | MediTech",
      "/privacy": "Privacy Policy | MediTech",
      "/patient/settings": "Patient Portal | MediTech",
      "/patient/settings/profile": "Medical Profile | MediTech",
      "/patient/settings/appointments": "Appointments | MediTech",
      "/patient/settings/payments": "Payment History | MediTech",
      "/patient/settings/records": "Medical Records | MediTech",
      "/patient/settings/prescriptions": "Prescriptions | MediTech",
      "/patient/settings/account": "Account Settings | MediTech",
    };
    const path = location.pathname;
    // exact match first, then check dynamic routes
    if (titleMap[path]) {
      document.title = titleMap[path];
    } else if (path.startsWith("/departments/")) {
      document.title = "Department Details | MediTech";
    } else if (path.startsWith("/services/")) {
      document.title = "Service Details | MediTech";
    } else {
      document.title = "MediTech";
    }
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = morePages.some((p) => isActive(p.path));

  return (
    <div className="landing-page min-h-screen">
      {/* ========== HEADER ========== */}
      <header
        className={`landing-header fixed top-0 left-0 right-0 flex items-center py-5 transition-all ${
          scrolled ? "scrolled py-2.5" : ""
        }`}
        style={{ zIndex: 997 }}
      >
        <div className="header-container container mx-auto max-w-7xl flex items-center justify-between px-6">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-1 no-underline">
            <LogoIcon />
            <h1 className="text-2xl font-bold text-[#18444c] m-0">MediTrust</h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-0">
            <ul className="flex items-center gap-0 list-none m-0 p-0">
              {navLinks.map((link) => (
                <li key={link.path} className="px-3 py-4">
                  <Link
                    to={link.path}
                    className={`nav-link-landing no-underline ${isActive(link.path) ? "active" : ""}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}

              {/* More Pages Dropdown */}
              <li
                className="px-3 py-4 relative"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  className={`nav-link-landing no-underline flex items-center gap-1 bg-transparent border-none cursor-pointer ${
                    isMoreActive ? "active" : ""
                  }`}
                >
                  More Pages
                  <svg className="w-3 h-3 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <ul className="absolute top-full left-0 bg-white rounded-lg shadow-xl py-2 min-w-[200px] list-none m-0 z-50">
                    {morePages.map((page) => (
                      <li key={page.path}>
                        <Link
                          to={page.path}
                          className={`block px-5 py-2.5 text-sm text-[#496268] hover:text-[#049ebb] no-underline transition-colors ${
                            isActive(page.path) ? "text-[#049ebb] font-semibold" : ""
                          }`}
                        >
                          {page.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            </ul>
          </nav>

          {/* CTA Button + Login/User + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              to="/appointment"
              className="btn-mt-primary text-sm px-5 py-2 no-underline hidden sm:inline-flex"
            >
              Appointment
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 transition-colors bg-transparent border-none cursor-pointer"
                >
                  {getAvatarUrl(user?.avatarUrl) ? (
                    <img
                      src={getAvatarUrl(user?.avatarUrl)!}
                      alt={displayName}
                      className="w-8 h-8 rounded-full object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#049ebb] to-[#027a94] flex items-center justify-center text-white text-sm font-semibold shadow-md">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-medium text-[#496268] max-w-[120px] truncate">
                    {displayName}
                  </span>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        {workspaceLink && (
                          <Link
                            to={workspaceLink.path}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#049ebb] hover:bg-[#e6f7fb] no-underline border-b border-gray-100"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <i className={`${workspaceLink.icon} text-base`}></i>
                            {workspaceLink.label}
                          </Link>
                        )}
                        <Link to="/patient/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 no-underline" onClick={() => setShowUserMenu(false)}>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          Patient Portal
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 bg-transparent border-none cursor-pointer border-t border-gray-100"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Log out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/signin"
                className="text-sm px-5 py-2 font-medium text-[#FF3366] border-2 border-[#FF3366] rounded-full no-underline hidden sm:inline-flex items-center gap-1.5 transition-all hover:bg-[#FF3366] hover:text-white bg-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Login
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="xl:hidden text-[#496268] text-2xl p-2 bg-transparent border-none cursor-pointer"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-[998] xl:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-16 left-4 right-4 bg-white rounded-xl shadow-2xl p-4 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ul className="list-none m-0 p-0 space-y-1">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`block px-4 py-3 rounded-lg text-[#496268] no-underline font-medium transition-colors ${
                      isActive(link.path)
                        ? "bg-[#e6f7fb] text-[#049ebb]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="border-t border-gray-100 pt-2 mt-2">
                <p className="px-4 py-1 text-xs text-gray-400 uppercase font-semibold">More Pages</p>
              </li>
              {morePages.map((page) => (
                <li key={page.path}>
                  <Link
                    to={page.path}
                    className={`block px-4 py-3 rounded-lg text-[#496268] no-underline font-medium transition-colors ${
                      isActive(page.path)
                        ? "bg-[#e6f7fb] text-[#049ebb]"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
              <li className="pt-2">
                <Link
                  to="/appointment"
                  className="btn-mt-primary w-full justify-center no-underline"
                >
                  Book Appointment
                </Link>
              </li>
              {!isAuthenticated && (
                <li className="pt-2">
                  <Link
                    to="/signin"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-[#FF3366] border-2 border-[#FF3366] no-underline font-medium transition-colors hover:bg-[#FF3366] hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Login
                  </Link>
                </li>
              )}
              {isAuthenticated && workspaceLink && (
                <li className="pt-2 border-t border-gray-100">
                  <Link
                    to={workspaceLink.path}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-[#049ebb] font-medium no-underline hover:bg-[#e6f7fb] transition-colors"
                  >
                    <i className={`${workspaceLink.icon} text-base`}></i>
                    {workspaceLink.label}
                  </Link>
                </li>
              )}
              {isAuthenticated && (
                <li className="pt-2 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-red-500 font-medium bg-transparent border-none cursor-pointer hover:bg-red-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <main>
        <Outlet />
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="landing-footer py-12">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            {/* About */}
            <div className="lg:col-span-2">
              <Link to="/home" className="flex items-center gap-1 no-underline mb-4">
                <LogoIcon />
                <span className="text-xl font-bold text-[#18444c]">MediTrust</span>
              </Link>
              <div className="text-sm text-gray-500 space-y-1">
                <p>11/7 Tang nhan phu A</p>
                <p>Quan 9_Tp Ho CHi Minh_Vietnam</p>
                <p className="mt-3"><strong className="text-gray-700">Phone:</strong> +84 952123456</p>
                <p><strong className="text-gray-700">Email:</strong> khanh115432@gmail.com</p>
              </div>
              <div className="flex gap-2 mt-4">
                {["twitter-x", "facebook", "instagram", "linkedin"].map((social) => (
                  <a key={social} href="#" className="social-link-circle">
                    <i className={`bi bi-${social}`}></i>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4>Quick Links</h4>
              <ul className="list-none p-0 m-0 space-y-2.5">
                {[
                  { to: "/home", label: "Home" },
                  { to: "/about", label: "About" },
                  { to: "/services", label: "Services" },
                  { to: "/departments", label: "Departments" },
                  { to: "/contact", label: "Contact" },
                ].map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm no-underline hover:text-[#049ebb]">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Our Services */}
            <div>
              <h4>Our Services</h4>
              <ul className="list-none p-0 m-0 space-y-2.5">
                {["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Emergency Care"].map((s) => (
                  <li key={s}>
                    <Link to="/services" className="text-sm no-underline hover:text-[#049ebb]">{s}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4>Support</h4>
              <ul className="list-none p-0 m-0 space-y-2.5">
                {[
                  { to: "/faq", label: "FAQ" },
                  { to: "/appointment", label: "Book Appointment" },
                  { to: "/testimonials", label: "Testimonials" },
                  { to: "/gallery", label: "Gallery" },
                  { to: "/contact", label: "Contact Us" },
                ].map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm no-underline hover:text-[#049ebb]">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 mt-10 pt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} <strong className="text-[#18444c]">MediTrust</strong>. All Rights Reserved.</p>
        </div>
      </footer>

      {/* Scroll To Top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`scroll-top-landing ${showScrollTop ? "visible" : ""}`}
        aria-label="Scroll to top"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
