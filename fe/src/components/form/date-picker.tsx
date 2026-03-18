import { useEffect, useRef } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import Label from "./Label";
import { CalenderIcon } from "../../icons";
import Hook = flatpickr.Options.Hook;
import DateOption = flatpickr.Options.DateOption;

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  onChange?: Hook | Hook[];
  defaultDate?: DateOption;
  value?: string;
  label?: string;
  placeholder?: string;
  minDate?: DateOption;
  maxDate?: DateOption;
  error?: boolean;
  hint?: string;
};

export default function DatePicker({
  id,
  mode,
  onChange,
  label,
  defaultDate,
  value,
  placeholder,
  minDate,
  maxDate,
  error,
  hint,
}: PropsType) {
  const fpRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
      const fp = flatpickr(`#${id}`, {
        mode: mode || "single",
        static: true,
        monthSelectorType: "static",
        dateFormat: "Y-m-d",
        defaultDate: value || defaultDate,
        minDate,
        maxDate,
        onChange,
        disableMobile: true,
        allowInput: true, // Allow manual typing
      });

      if (!Array.isArray(fp)) {
        fpRef.current = fp;
      }

      return () => {
        if (!Array.isArray(fp)) {
          fp.destroy();
        }
        fpRef.current = null;
      };
    }, [mode, id]); // eslint-disable-line react-hooks/exhaustive-deps

    // Sync value changes
    useEffect(() => {
      if (fpRef.current && value !== undefined) {
        fpRef.current.setDate(value, false);
      }
    }, [value]);

    // Sync minDate / maxDate changes
    useEffect(() => {
      if (fpRef.current) {
        if (minDate !== undefined) fpRef.current.set("minDate", minDate);
        if (maxDate !== undefined) fpRef.current.set("maxDate", maxDate);
      }
    }, [minDate, maxDate]);

    return (
      <div>
        {label && <Label htmlFor={id}>{label}</Label>}

        <div className="relative">
          <input
            id={id}
            placeholder={placeholder || "YYYY-MM-DD"}
            className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 bg-transparent text-gray-800 ${
              error
                ? "border-red-500 focus:border-red-300 focus:ring-red-500/20 dark:border-red-500"
                : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
            }`}
          />

          <span className="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400">
            <CalenderIcon className="size-6" />
          </span>
        </div>

      {hint && (
        <p className={`mt-1 text-xs ${error ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
