import { useCallback, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';

import MediTechLogo from '../components/common/MediTechLogo';
import {
  GridIcon,
  CalenderIcon,
  CheckCircleIcon,
  TaskIcon,
  DocsIcon,
  GroupIcon,
  ShootingStarIcon,
  HorizontaLDots,
} from '../icons';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useSidebar } from '../context/SidebarContext';
import { useDoctorVerificationContext } from '../context/DoctorVerificationContext';
import SidebarWidget from './SidebarWidget';

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

// Full clinical menu — only for VERIFIED / APPROVED doctors
const clinicalNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: 'Dashboard',
    path: '/doctor',
  },
  {
    icon: <CalenderIcon />,
    name: 'Today',
    path: '/doctor/today',
  },
  {
    icon: <CheckCircleIcon />,
    name: 'Appointments',
    path: '/doctor/appointments',
    subItems: [
      { name: 'Upcomming', path: '/doctor/appointments/upcoming' },
      { name: 'Pending Confirm', path: '/doctor/appointments/pending' },
      { name: 'History', path: '/doctor/appointments/history' },
    ],
  },
  {
    icon: <TaskIcon />,
    name: 'Schedule',
    path: '/doctor/schedule',
    subItems: [
      { name: 'Weekly Schedule', path: '/doctor/schedule/weekly' },
      // { name: 'Time Off & Breaks', path: '/doctor/schedule/time-off-breaks' },
      { name: 'Block slots', path: '/doctor/schedule/block-slots' },
    ],
  },
  {
    icon: <DocsIcon />,
    name: 'Consultation',
    path: '/doctor/consultation',
  },
  {
    icon: <DocsIcon />,
    name: 'Prescriptions',
    path: '/doctor/prescriptions',
    subItems: [
      { name: 'Create Prescription', path: '/doctor/prescriptions/create' },
      { name: 'Prescription History', path: '/doctor/prescriptions/history' },
      { name: 'Templates', path: '/doctor/prescriptions/templates' },
    ],
  },
  {
    icon: <GroupIcon />,
    name: 'My Patients',
    path: '/doctor/patients',
    subItems: [
      { name: 'My Patients', path: '/doctor/patients/my-patients' },
      { name: 'Recent', path: '/doctor/patients/recent' },
      {
        name: 'Chronic/Allergy Flags',
        path: '/doctor/patients/chronic-allergy-flags',
      },
    ],
  },
  {
    icon: <ShootingStarIcon />,
    name: 'Reviews & Stats',
    path: '/doctor/reviews',
  },
  {
    icon: <Cog6ToothIcon className='w-6 h-6' />,
    name: 'Settings',
    path: '/doctor/settings',
  },
];

// Items for non-verified doctors
const verificationNavItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: 'Verification Center',
    path: '/doctor/verification-center',
  },
  {
    icon: <DocsIcon />,
    name: 'Profile Setup',
    path: '/doctor/profile-setup',
  },
];

const DoctorSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { isVerified, verificationStatus } = useDoctorVerificationContext();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const navItems = useMemo(() => {
    if (isVerified) return clinicalNavItems;

    // SUSPENDED or REVOKED — only verification center
    if (
      verificationStatus === 'SUSPENDED' ||
      verificationStatus === 'REVOKED'
    ) {
      return [verificationNavItems[0]]; // only Verification Center
    }

    // AWAITING_DOCUMENTS, PENDING, REJECTED — verification center + profile setup
    return verificationNavItems;
  }, [isVerified, verificationStatus]);

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
    <ul className='flex flex-col gap-4'>
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
                  className={`menu-item group w-full ${
                    parentActive ? 'menu-item-active' : 'menu-item-inactive'
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      parentActive
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive'
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <>
                      <span className='menu-item-text whitespace-nowrap flex-1 text-left'>
                        {nav.name}
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${
                          expanded ? 'rotate-180' : ''
                        }`}
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 9l-7 7-7-7'
                        />
                      </svg>
                    </>
                  )}
                </button>
                {expanded && (isExpanded || isHovered || isMobileOpen) && (
                  <ul className='ml-12 mt-2 flex flex-col gap-2'>
                    {nav.subItems?.map((subItem) => (
                      <li key={subItem.path}>
                        <Link
                          to={subItem.path}
                          className={`block px-4 py-2 rounded-lg text-sm transition-colors ${
                            isActive(subItem.path)
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
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
                className={`menu-item group ${
                  isActive(nav.path!)
                    ? 'menu-item-active'
                    : 'menu-item-inactive'
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path!)
                      ? 'menu-item-icon-active'
                      : 'menu-item-icon-inactive'
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className='menu-item-text whitespace-nowrap'>
                    {nav.name}
                  </span>
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
        ${
          isExpanded || isMobileOpen
            ? 'w-[290px]'
            : isHovered
              ? 'w-[290px]'
              : 'w-[90px]'
        }
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'
        }`}
      >
        <MediTechLogo
          to='/doctor'
          iconOnly={!isExpanded && !isHovered && !isMobileOpen}
          textSize={isExpanded || isHovered || isMobileOpen ? 'xl' : '2xl'}
        />
      </div>
      <div className='flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar'>
        <nav className='mb-6'>
          <div className='flex flex-col gap-4'>
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? 'lg:justify-center'
                    : 'justify-start'
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  'MEDITECH DOCTOR'
                ) : (
                  <HorizontaLDots className='size-6' />
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
