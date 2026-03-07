import { useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router";

import {
    GridIcon,
    CalenderIcon,
    CheckCircleIcon,
    TaskIcon,
    DocsIcon,
    GroupIcon,
    ShootingStarIcon,
    HorizontaLDots,
} from "../icons";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { useSidebar } from "../context/SidebarContext";
import { useDoctorVerificationContext } from "../context/DoctorVerificationContext";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
    name: string;
    icon: React.ReactNode;
    path: string;
};

// Full clinical menu — only for VERIFIED / APPROVED doctors
const clinicalNavItems: NavItem[] = [
    {
        icon: <GridIcon />,
        name: "Dashboard",
        path: "/doctor",
    },
    {
        icon: <CalenderIcon />,
        name: "Today",
        path: "/doctor/today",
    },
    {
        icon: <CheckCircleIcon />,
        name: "Appointments",
        path: "/doctor/appointments",
    },
    {
        icon: <TaskIcon />,
        name: "Schedule",
        path: "/doctor/schedule",
    },
    {
        icon: <DocsIcon />,
        name: "Consultation",
        path: "/doctor/consultation",
    },
    {
        icon: <DocsIcon />,
        name: "Prescriptions",
        path: "/doctor/prescriptions",
    },
    {
        icon: <GroupIcon />,
        name: "My Patients",
        path: "/doctor/patients",
    },
    {
        icon: <ShootingStarIcon />,
        name: "Reviews & Stats",
        path: "/doctor/reviews",
    },
    {
        icon: <Cog6ToothIcon className="w-6 h-6" />,
        name: "Settings",
        path: "/doctor/settings",
    },
];

// Items for non-verified doctors
const verificationNavItems: NavItem[] = [
    {
        icon: <GridIcon />,
        name: "Verification Center",
        path: "/doctor/verification-center",
    },
    {
        icon: <DocsIcon />,
        name: "Profile Setup",
        path: "/doctor/profile-setup",
    },
];

const DoctorSidebar: React.FC = () => {
    const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
    const { isVerified, verificationStatus } = useDoctorVerificationContext();
    const location = useLocation();

    const navItems = useMemo(() => {
        if (isVerified) return clinicalNavItems;

        // SUSPENDED or REVOKED — only verification center
        if (verificationStatus === "SUSPENDED" || verificationStatus === "REVOKED") {
            return [verificationNavItems[0]]; // only Verification Center
        }

        // AWAITING_DOCUMENTS, PENDING, REJECTED — verification center + profile setup
        return verificationNavItems;
    }, [isVerified, verificationStatus]);

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
                        className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                            }`}
                    >
                        <span
                            className={`menu-item-icon-size ${isActive(nav.path)
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
                <Link to="/doctor">
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
                                    "MEDITECH DOCTOR"
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

export default DoctorSidebar;
