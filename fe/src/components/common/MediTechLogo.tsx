import { Link } from "react-router-dom";

/** MediTech logo icon (hospital/building) - same as LandingLayout */
export function LogoIcon({
  className = "h-8",
  dark = false,
}: { className?: string; dark?: boolean }) {
  return (
    <svg
      className={`logo-icon ${dark ? "text-white" : "text-[#049ebb]"} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
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

type MediTechLogoProps = {
  /** Show only icon (e.g. collapsed sidebar) */
  iconOnly?: boolean;
  /** Link URL (omit for no link) */
  to?: string;
  /** Optional class for wrapper */
  className?: string;
  /** Text size for "MediTech" */
  textSize?: "sm" | "base" | "xl" | "2xl";
  /** Dark background (e.g. auth left panel) - white icon and text */
  variant?: "light" | "dark";
};

const brandTextClass = "font-bold text-[#18444c] dark:text-gray-100";
const brandTextClassDark = "font-bold text-white";

/**
 * MediTech logo: icon + "MediTech" text, same as user/landing.
 * Use in AppHeader, AppSidebar, auth pages, etc.
 */
export default function MediTechLogo({
  iconOnly = false,
  to,
  className = "",
  textSize = "2xl",
  variant = "light",
}: MediTechLogoProps) {
  const isDark = variant === "dark";
  const textSizeClass =
    textSize === "sm"
      ? "text-sm"
      : textSize === "base"
        ? "text-base"
        : textSize === "xl"
          ? "text-xl"
          : "text-2xl";

  const content = (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <LogoIcon className={iconOnly ? "h-8 w-8" : "h-8"} dark={isDark} />
      {!iconOnly && (
        <span className={`${isDark ? brandTextClassDark : brandTextClass} ${textSizeClass} m-0`}>
          MediTech
        </span>
      )}
    </span>
  );

  if (to != null) {
    return (
      <Link to={to} className="no-underline flex items-center">
        {content}
      </Link>
    );
  }
  return content;
}
