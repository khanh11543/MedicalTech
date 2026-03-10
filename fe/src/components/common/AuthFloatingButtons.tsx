import { Link, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

const landingPaths = [
  "/home", "/about", "/departments", "/services", "/doctors",
  "/appointment", "/contact", "/testimonials", "/faq", "/gallery",
  "/terms", "/privacy",
];

export default function AuthFloatingButtons() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Only show on landing pages and when not authenticated
  const isLandingPage = landingPaths.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/")
  );

  if (isAuthenticated || !isLandingPage) return null;

  return (
    <div className="fixed top-5 left-6 z-[9999] flex items-center">
      <Link
        to="/signin"
        className="text-sm px-5 py-2 font-medium text-white bg-[#049ebb] border-2 border-[#049ebb] rounded-full no-underline flex items-center gap-1.5 transition-all hover:bg-[#037a94] hover:border-[#037a94] shadow-md"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Login
      </Link>
    </div>
  );
}
