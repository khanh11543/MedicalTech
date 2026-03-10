import { useState, useEffect, useRef, useCallback } from "react";
import userSettingsService from "../services/userSettingsService";
import type { WorkstationSettings } from "../services/userSettingsService";

interface AutoLockState {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
  verifyPin: (pin: string) => Promise<boolean>;
  hasPinSet: boolean;
  autoLockEnabled: boolean;
  remainingSeconds: number;
}

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

export default function useAutoLock(): AutoLockState {
  const [isLocked, setIsLocked] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef(Date.now());
  const settingsLoadedRef = useRef(false);

  // Load settings
  const loadSettings = useCallback(async () => {
    try {
      const data: WorkstationSettings = await userSettingsService.getWorkstationSettings();
      setAutoLockEnabled(data.autoLockEnabled);
      setAutoLockMinutes(data.autoLockMinutes);
      setHasPinSet(data.hasPinSet);
      settingsLoadedRef.current = true;
    } catch {
      // If can't load settings, don't enable auto-lock
    }
  }, []);

  useEffect(() => {
    loadSettings();
    // Reload settings periodically (e.g. after user changes settings in another tab)
    const interval = setInterval(loadSettings, 60000);

    // Reload immediately when workstation settings are updated (e.g. user saves settings / sets PIN)
    const handleSettingsUpdated = () => {
      loadSettings();
    };
    window.addEventListener("workstation-settings-updated", handleSettingsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener("workstation-settings-updated", handleSettingsUpdated);
    };
  }, [loadSettings]);

  // Reset idle timer
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    if (!autoLockEnabled || !hasPinSet || isLocked) return;

    const ms = autoLockMinutes * 60 * 1000;
    setRemainingSeconds(autoLockMinutes * 60);

    // Countdown ticker
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = Math.max(0, Math.ceil((ms - elapsed) / 1000));
      setRemainingSeconds(remaining);
    }, 1000);

    // Lock after idle timeout
    timerRef.current = setTimeout(() => {
      setIsLocked(true);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setRemainingSeconds(0);
    }, ms);
  }, [autoLockEnabled, hasPinSet, autoLockMinutes, isLocked]);

  // Listen for user activity
  useEffect(() => {
    if (!autoLockEnabled || !hasPinSet) return;

    const handleActivity = () => {
      if (!isLocked) resetTimer();
    };

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    resetTimer();

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoLockEnabled, hasPinSet, isLocked, resetTimer]);

  const lock = useCallback(() => {
    setIsLocked(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const unlock = useCallback(() => {
    setIsLocked(false);
    lastActivityRef.current = Date.now();
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      await userSettingsService.verifyPin({ pin });
      unlock();
      return true;
    } catch {
      return false;
    }
  }, [unlock]);

  return {
    isLocked,
    lock,
    unlock,
    verifyPin,
    hasPinSet,
    autoLockEnabled,
    remainingSeconds,
  };
}
