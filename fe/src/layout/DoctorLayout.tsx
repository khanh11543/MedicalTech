import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { WorkstationProvider } from "../context/WorkstationContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import DoctorSidebar from "./DoctorSidebar";
import useAutoLock from "../hooks/useAutoLock";
import LockScreen from "../components/common/LockScreen";

const LayoutContent: React.FC = () => {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();
    const { isLocked, verifyPin } = useAutoLock();

    return (
        <div className="min-h-screen xl:flex">
            {isLocked && <LockScreen onVerify={verifyPin} />}
            <div>
                <DoctorSidebar />
                <Backdrop />
            </div>
            <div
                className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
                    } ${isMobileOpen ? "ml-0" : ""}`}
            >
                <AppHeader />
                <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

const DoctorLayout: React.FC = () => {
    return (
        <SidebarProvider>
            <WorkstationProvider>
                <LayoutContent />
            </WorkstationProvider>
        </SidebarProvider>
    );
};

export default DoctorLayout;
