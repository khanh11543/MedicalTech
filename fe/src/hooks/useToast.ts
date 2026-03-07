import { useState, useCallback } from "react";

export interface ToastState {
  message: string;
  type: "success" | "error" | "info";
}

export function useToast(autoDismissMs = 4000) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastState["type"] = "success") => {
      setToast({ message, type });
      if (autoDismissMs > 0) {
        setTimeout(() => setToast(null), autoDismissMs);
      }
    },
    [autoDismissMs]
  );

  const dismissToast = useCallback(() => setToast(null), []);

  return { toast, showToast, dismissToast };
}
