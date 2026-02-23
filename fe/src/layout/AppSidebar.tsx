import { useCallback } from "react";
import { Link, useLocation } from "react-router";

// Icons
import {
  ArrowUpIcon,
  BoltIcon,
  ChatIcon,
  CheckCircleIcon,
  DocsIcon,
  DollarLineIcon,
  DownloadIcon,
  FileIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  InfoIcon,
  LockIcon,
  MailIcon,
  ShootingStarIcon,
  TaskIcon,
  UserCircleIcon,
  UserIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

// MediTech Admin Panel - 14 Main Modules
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/admin",
  },
  {
    icon: <GroupIcon />,
    name: "User Management",
    path: "/admin/user-list",
  },
  {
    icon: <UserCircleIcon />,
    name: "Patient Management",
    path: "/admin/patient-list",
  },
  {
    icon: <UserIcon />,
    name: "Receptionist Management",
    path: "/admin/receptionist-list",
  },
  {
    icon: <CheckCircleIcon />,
    name: "Doctor Verification",
    path: "/admin/doctor-verification",
  },
  {
    icon: <TaskIcon />,
    name: "Appointment Management",
    path: "/admin/appointment-list",
  },
  {
    icon: <DocsIcon />,
    name: "Prescription Management",
    path: "/admin/prescription-list",
  },
  {
    icon: <DollarLineIcon />,
    name: "Payment Management",
    path: "/admin/payment-list",
  },
  {
    icon: <ShootingStarIcon />,
    name: "Review Management",
    path: "/admin/review-list",
  },
  {
    icon: <FileIcon />,
    name: "Content Management",
    path: "/admin/content-list",
  },
  {
    icon: <BoltIcon />,
    name: "System Settings",
    path: "/admin/system-settings",
  },
  {
    icon: <LockIcon />,
    name: "Security & Audit",
    path: "/admin/security-audit",
  },
  {
    icon: <ArrowUpIcon />,
    name: "Reports & Analytics",
    path: "/admin/reports-analytics",
  },
  {
    icon: <InfoIcon />,
    name: "GDPR & Compliance",
    path: "/admin/gdpr-compliance",
  },
  {
    icon: <DownloadIcon />,
    name: "Backup & Maintenance",
    path: "/admin/backup-maintenance",
  },
  {
    icon: <MailIcon />,
    name: "Announcements",
    path: "/admin/announcements",
  },
  {
    icon: <HorizontaLDots />,
    name: "Notifications",
    path: "/admin/notification-list",
  },
  {
    icon: <ChatIcon />,
    name: "Support Tickets",
    path: "/admin/support-tickets",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav) => (
        <li key={nav.name}>
          <Link
            to={nav.path}
            className={`menu-item group ${
              isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
            }`}
          >
            <span
              className={`menu-item-icon-size ${
                isActive(nav.path)
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
              }`}
            >
              {nav.icon}
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="menu-item-text whitespace-nowrap">{nav.name}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden"
                src="/images/logo/logo.svg"
                alt="Logo"
                width={150}
                height={40}
              />
              <img
                className="hidden dark:block"
                src="/images/logo/logo-dark.svg"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <img
              src="/images/logo/logo-icon.svg"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "MEDITECH ADMIN"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems)}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
