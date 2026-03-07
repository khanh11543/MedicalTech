import { useState, useEffect, useCallback } from "react";
import { getDoctorProfile, type DoctorProfile } from "../services/doctorService";

interface DoctorVerificationState {
  verificationStatus: string | null;
  isLoading: boolean;
  isVerified: boolean;
  profile: DoctorProfile | null;
  refetch: () => void;
}

/**
 * Hook to fetch and cache doctor's verification status.
 * Only call this for users with DOCTOR role.
 */
export function useDoctorVerification(): DoctorVerificationState {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = useCallback(() => {
    setIsLoading(true);
    getDoctorProfile()
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const verificationStatus = profile?.verificationStatus ?? null;
  const isVerified =
    verificationStatus === "VERIFIED" || verificationStatus === "APPROVED";

  return {
    verificationStatus,
    isLoading,
    isVerified,
    profile,
    refetch: fetchStatus,
  };
}
