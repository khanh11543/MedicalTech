import React, { createContext, useContext } from "react";
import { useDoctorVerification } from "../hooks/useDoctorVerification";
import type { DoctorProfile } from "../services/doctorService";

interface DoctorVerificationContextType {
  verificationStatus: string | null;
  isLoading: boolean;
  isVerified: boolean;
  profile: DoctorProfile | null;
  refetch: () => void;
}

const DoctorVerificationContext = createContext<DoctorVerificationContextType | undefined>(undefined);

export function DoctorVerificationProvider({ children }: { children: React.ReactNode }) {
  const verification = useDoctorVerification();

  return (
    <DoctorVerificationContext.Provider value={verification}>
      {children}
    </DoctorVerificationContext.Provider>
  );
}

export function useDoctorVerificationContext(): DoctorVerificationContextType {
  const context = useContext(DoctorVerificationContext);
  if (!context) {
    throw new Error("useDoctorVerificationContext must be used within DoctorVerificationProvider");
  }
  return context;
}
