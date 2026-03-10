import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import userSettingsService from "../services/userSettingsService";
import type { WorkstationSettings } from "../services/userSettingsService";

interface WorkstationContextType {
  settings: WorkstationSettings;
  loading: boolean;
  reload: () => Promise<void>;
}

const defaultSettings: WorkstationSettings = {
  hidePhoneNumber: false,
  hideEmail: false,
  hidePatientNameWhenIdle: false,
  largeQueueDisplay: false,
  autoLockEnabled: false,
  autoLockMinutes: 5,
  hasPinSet: false,
};

const WorkstationContext = createContext<WorkstationContextType>({
  settings: defaultSettings,
  loading: true,
  reload: async () => {},
});

export function WorkstationProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<WorkstationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await userSettingsService.getWorkstationSettings();
      setSettings(data);
    } catch {
      // Keep defaults on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Listen for settings updates from the WorkstationTab save action
  useEffect(() => {
    const handler = () => {
      reload();
    };
    window.addEventListener("workstation-settings-updated", handler);
    return () => window.removeEventListener("workstation-settings-updated", handler);
  }, [reload]);

  return (
    <WorkstationContext.Provider value={{ settings, loading, reload }}>
      {children}
    </WorkstationContext.Provider>
  );
}

export function useWorkstation(): WorkstationContextType {
  return useContext(WorkstationContext);
}

export default WorkstationContext;
