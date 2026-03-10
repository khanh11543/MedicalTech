import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Icons
import {
  ArrowUpIcon,
  BoltIcon,
  CalenderIcon,
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
  TimeIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import SidebarWidget from "./SidebarWidget";

type SubItem = {
  name: string;
  path: string;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: string[]; // If undefined, visible to all roles
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

// Receptionist navigation items
const receptionistNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/receptionist/dashboard",
    roles: ["RECEPTIONIST"],
  },
  {
    icon: <CalenderIcon />,
    name: "Appointments",
    path: "/receptionist/appointments",
    roles: ["RECEPTIONIST"],
  },
  {
    icon: <GroupIcon />,
    name: "Patients",
    path: "/receptionist/patients",
    roles: ["RECEPTIONIST"],
  },
  {
    icon: <TimeIcon />,
    name: "Queue Management",
    path: "/receptionist/queue",
    roles: ["RECEPTIONIST"],
  },
  {
    icon: <DollarLineIcon />,
    name: "Payments",
    path: "/receptionist/payments",
    roles: ["RECEPTIONIST"],
  },
  {
    icon: <DocsIcon />,
    name: "Reports",
    path: "/receptionist/reports",
    roles: ["RECEPTIONIST"],
  },
  {
    icon: <MailIcon />,
    name: "Notifications",
    path: "/receptionist/notifications",
    roles: ["RECEPTIONIST"],
  },
  {
    icon: <BoltIcon />,
    name: "Settings",
    path: "/receptionist/settings",
    roles: ["RECEPTIONIST"],
  },
];

// Admin/default navigation items
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Overview", path: "/admin", pro: false }],
  },
  {
    icon: <GroupIcon />,
    name: "User Management",
    path: "/admin/user-list",
  },
  {
    icon: <CheckCircleIcon />,
    name: "Doctor Verification",
    path: "/admin/doctor-verification",
  },
  {
    icon: <TaskIcon />,
    name: "Appointment Management",
    subItems: [
      { name: "Appointment List", path: "/admin/appointment-list", pro: false },
      { name: "Appointment Statistics", path: "/admin/appointment-statistics", pro: false },
    ],
  },
  {
    icon: <TimeIcon />,
    name: "Time Slot Management",
    subItems: [
      { name: "Calendar View", path: "/admin/timeslot-calendar", pro: false },
      { name: "Slot List", path: "/admin/timeslot-list", pro: false },
      { name: "Bulk Create", path: "/admin/timeslot-bulk-create", pro: false },
      { name: "Templates", path: "/admin/timeslot-templates", pro: false },
      { name: "Rules & Holidays", path: "/admin/timeslot-rules", pro: false },
    ],
  },
  {
    icon: <DocsIcon />,
    name: "Prescription Management",
    subItems: [
      { name: "All Prescriptions", path: "/admin/prescription-list", pro: false },
      { name: "Templates Overview", path: "/admin/prescription-templates", pro: false },
    ],
  },
  {
    icon: <DollarLineIcon />,
    name: "Payment Management",
    subItems: [
      { name: "Payment List", path: "/admin/payment-list", pro: false },
      { name: "Refund Management", path: "/admin/refund-list", pro: false },
      { name: "Revenue Reports", path: "/admin/revenue-reports", pro: false },
    ],
  },
  {
    icon: <ShootingStarIcon />,
    name: "Review Management",
    path: "/admin/review-list",
  },
  {
    icon: <FileIcon />,
    name: "Content Management",
    subItems: [{ name: "Content List", path: "/admin/content-list", pro: false }],
  },
  {
    icon: <UserCircleIcon />,
    name: "Settings",
    path: "/admin/settings",
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
    subItems: [
      { name: "Dashboard", path: "/admin/backup-dashboard", pro: false },
      { name: "History", path: "/admin/backup-history", pro: false },
      { name: "Manual Backup", path: "/admin/manual-backup", pro: false },
      { name: "Restore", path: "/admin/restore-backup", pro: false },
      { name: "Maintenance", path: "/admin/scheduled-maintenance", pro: false },
      { name: "Optimization", path: "/admin/system-optimization", pro: false },
    ],
  },
  {
    icon: <MailIcon />,
    name: "Notifications",
    path: "/admin/notifications",
  },
];



const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();

  // Determine which nav items to show based on user roles
  const userRoles = user?.roles || [];
  const isReceptionist = userRoles.includes("RECEPTIONIST") && !userRoles.includes("ADMIN");

  // If user is RECEPTIONIST (and not ADMIN), show receptionist menu; otherwise show admin/default menu
  const activeNavItems = isReceptionist ? receptionistNavItems : navItems;


  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        // Check if any sub-item is active
        const hasSubItems = nav.subItems && nav.subItems.length > 0;
        const isSubmenuOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;
        const isSubItemActive = hasSubItems
          ? nav.subItems!.some((sub) => isActive(sub.path))
          : false;

        if (hasSubItems) {
          return (
            <li key={nav.name}>
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group w-full ${
                  isSubItemActive ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size shrink-0 ${
                    isSubItemActive
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <>
                    <span className="menu-item-text flex-1 min-w-0 text-left whitespace-nowrap">
                      {nav.name}
                    </span>
                    <svg
                      className={`shrink-0 h-5 w-5 transition-transform duration-200 ${
                        isSubmenuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </>
                )}
              </button>
              {(isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[`${menuType}-${index}`] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height: isSubmenuOpen
                      ? `${subMenuHeight[`${menuType}-${index}`] || "auto"}px`
                      : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9">
                    {nav.subItems!.map((sub) => (
                      <li key={sub.name}>
                        <Link
                          to={sub.path}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                            isActive(sub.path)
                              ? "text-brand-500 bg-brand-50 dark:bg-brand-500/10 font-medium"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/5"
                          }`}
                        >
                          {sub.name}
                          {sub.new && (
                            <span className="ml-2 inline-block rounded bg-brand-500 px-1.5 py-0.5 text-[10px] text-white">
                              new
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        }

        return (
          <li key={nav.name}>
            <Link
              to={nav.path ?? "#"}
              className={`menu-item group ${
                nav.path && isActive(nav.path)
                  ? "menu-item-active"
                  : "menu-item-inactive"
              }`}
            >
              <span
                className={`menu-item-icon-size shrink-0 ${
                  nav.path && isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text flex-1 min-w-0 text-left whitespace-nowrap">
                  {nav.name}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen
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
        className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to={isReceptionist ? "/receptionist/dashboard" : "/"}>
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
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  isReceptionist ? "Receptionist" : "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(activeNavItems, "main")}
            </div>

          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
