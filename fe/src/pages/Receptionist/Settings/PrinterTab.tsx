import { useState, useEffect } from "react";
import userSettingsService from "../../../services/userSettingsService";
import type { PrinterSettings } from "../../../services/userSettingsService";

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"}`}
      >
        <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

const defaultSettings: PrinterSettings = {
  receiptPrinter: null,
  a4Printer: null,
  autoPrintReceipt: false,
  autoPrintAppointmentSlip: false,
  paperSize: "A4",
  printCopies: 1,
};

export default function PrinterTab() {
  const [settings, setSettings] = useState<PrinterSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await userSettingsService.getPrinterSettings();
      setSettings(data);
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = await userSettingsService.updatePrinterSettings(settings);
      setSettings(data);
      setMessage({ type: "success", text: "Printer settings saved" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to save" });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleTestPrint = async () => {
    try {
      setTesting(true);
      const res = await userSettingsService.testPrint();
      setMessage({ type: "success", text: res.message });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Test print failed" });
    } finally {
      setTesting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === "success" ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-6 text-base font-medium text-gray-800 dark:text-white/90">Printer Configuration</h3>

        <div className="space-y-5 max-w-lg">
          {/* Receipt Printer */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Receipt Printer</label>
            <input
              type="text"
              value={settings.receiptPrinter || ""}
              onChange={(e) => setSettings({ ...settings, receiptPrinter: e.target.value })}
              placeholder="e.g. Epson TM-T88V (Thermal 80mm)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Used for payment receipts and appointment slips</p>
          </div>

          {/* A4 Printer */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">A4 Printer</label>
            <input
              type="text"
              value={settings.a4Printer || ""}
              onChange={(e) => setSettings({ ...settings, a4Printer: e.target.value })}
              placeholder="e.g. HP LaserJet Pro M404n"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Used for reports and invoices (A4 format)</p>
          </div>

          {/* Print Copies */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Print Copies</label>
            <input
              type="number"
              min={1}
              max={10}
              value={settings.printCopies}
              onChange={(e) => setSettings({ ...settings, printCopies: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })}
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Auto Print */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-2 text-base font-medium text-gray-800 dark:text-white/90">Auto Print</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Automatically print documents after specific actions.</p>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          <Toggle
            checked={settings.autoPrintReceipt}
            onChange={(v) => setSettings({ ...settings, autoPrintReceipt: v })}
            label="Receipt after Payment"
            description="Automatically print receipt when a payment is completed"
          />
          <Toggle
            checked={settings.autoPrintAppointmentSlip}
            onChange={(v) => setSettings({ ...settings, autoPrintAppointmentSlip: v })}
            label="Appointment Slip on Check-in"
            description="Automatically print appointment slip when patient checks in"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 className="mb-4 text-base font-medium text-gray-800 dark:text-white/90">Test</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Printer Settings"}
          </button>
          <button
            onClick={handleTestPrint}
            disabled={testing || (!settings.receiptPrinter && !settings.a4Printer)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {testing ? "Printing..." : "Print Test Page"}
          </button>
        </div>
      </div>
    </div>
  );
}
