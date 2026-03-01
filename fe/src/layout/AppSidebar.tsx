import { useCallback, useState } from "react";
import { Link, useLocation } from "react-router";

// Icons
import {
  ArrowUpIcon,
  CheckCircleIcon,
  FileIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  MailIcon,
  ShootingStarIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

type SubItem = {
  name: string;
  path: string;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
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
    icon: <CheckCircleIcon />,
    name: "Doctor Verification",
    path: "/admin/doctor-verification",
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
    icon: <ArrowUpIcon />,
    name: "Reports & Analytics",
    path: "/admin/reports-analytics",
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
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const isParentActive = useCallback(
    (subItems?: SubItem[]) => {
      if (!subItems) return false;
      return subItems.some((item) => location.pathname === item.path);
    },
    [location.pathname]
  );

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isItemExpanded = (itemName: string) => expandedItems.includes(itemName);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav) => {
        const hasSubItems = nav.subItems && nav.subItems.length > 0;
        const expanded = isItemExpanded(nav.name);
        const parentActive = isParentActive(nav.subItems);

        return (
          <li key={nav.name}>
            {hasSubItems ? (
              <>
                <button
                  onClick={() => toggleExpanded(nav.name)}
                  className={`menu-item group w-full ${parentActive ? "menu-item-active" : "menu-item-inactive"
                    }`}
                >
                  <span
                    className={`menu-item-icon-size ${parentActive
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                      }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <>
                      <span className="menu-item-text whitespace-nowrap flex-1 text-left">
                        {nav.name}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""
                          }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
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
                {expanded && (isExpanded || isHovered || isMobileOpen) && (
                  <ul className="ml-12 mt-2 flex flex-col gap-2">
                    {nav.subItems?.map((subItem) => (
                      <li key={subItem.path}>
                        <Link
                          to={subItem.path}
                          className={`block px-4 py-2 rounded-lg text-sm transition-colors ${isActive(subItem.path)
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                            }`}
                        >
                          {subItem.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <Link
                to={nav.path!}
                className={`menu-item group ${isActive(nav.path!) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path!)
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
            )}
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
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered
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
