import { useState, useRef, useEffect } from "react";

interface LockScreenProps {
  onVerify: (pin: string) => Promise<boolean>;
}

export default function LockScreen({ onVerify }: LockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits");
      return;
    }
    setVerifying(true);
    setError("");
    const ok = await onVerify(pin);
    if (!ok) {
      setError("Incorrect PIN");
      setPin("");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      inputRef.current?.focus();
    }
    setVerifying(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const addDigit = (d: number) => {
    if (pin.length < 6) {
      setPin((p) => p + d);
      setError("");
    }
  };

  return (
    <>
      {/* Blur overlay — covers everything including header/sidebar */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 999999 }}
        className="bg-gray-900/60 backdrop-blur-xl"
      />

      {/* PIN panel — centered on top of blur */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9999999 }}
        className="flex items-center justify-center"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Hidden input for keyboard typing */}
        <input
          ref={inputRef}
          type="password"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          onKeyDown={handleKeyDown}
          className="sr-only"
          autoFocus
        />

        {/* Glass card */}
        <div
          className={`w-[340px] rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/[0.12] shadow-2xl p-8 ${
            shake ? "animate-shake" : ""
          }`}
        >
          {/* Lock icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/20 ring-2 ring-brand-500/30">
            <svg className="h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>

          <h2 className="text-center text-lg font-semibold text-white mb-1">
            Workstation Locked
          </h2>
          <p className="text-center text-xs text-gray-400 mb-6">
            Enter your PIN to unlock
          </p>

          {/* PIN dots */}
          <div className="flex justify-center gap-3 mb-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? "bg-brand-500 scale-110 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                    : "bg-white/10 ring-1 ring-white/20"
                }`}
              />
            ))}
          </div>

          {/* Error */}
          <div className="h-6 flex items-center justify-center mb-1">
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => addDigit(n)}
                className="h-14 rounded-xl bg-white/[0.08] text-white text-lg font-medium hover:bg-white/[0.15] active:bg-brand-500/30 active:scale-95 transition-all duration-100 border border-white/[0.1]"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => { setPin(""); setError(""); }}
              className="h-14 rounded-xl bg-white/[0.04] text-gray-500 text-[11px] font-medium hover:bg-white/[0.1] transition-all border border-white/[0.06]"
            >
              Clear
            </button>
            <button
              onClick={() => addDigit(0)}
              className="h-14 rounded-xl bg-white/[0.08] text-white text-lg font-medium hover:bg-white/[0.15] active:bg-brand-500/30 active:scale-95 transition-all duration-100 border border-white/[0.1]"
            >
              0
            </button>
            <button
              onClick={() => { setPin((p) => p.slice(0, -1)); setError(""); }}
              className="h-14 rounded-xl bg-white/[0.04] text-gray-500 hover:bg-white/[0.1] transition-all border border-white/[0.06] flex items-center justify-center"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58-4.92l-6.374 6.375a1.125 1.125 0 00-.329.796v.41c0 .598.487 1.084 1.084 1.084h11.297a1.125 1.125 0 001.125-1.125V8.625a1.125 1.125 0 00-1.125-1.125H10.49a1.125 1.125 0 00-.796.329z" />
              </svg>
            </button>
          </div>

          {/* Unlock button */}
          <button
            onClick={handleSubmit}
            disabled={verifying || pin.length < 4}
            className="w-full py-3 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {verifying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Verifying…
              </span>
            ) : (
              "Unlock"
            )}
          </button>

          {/* Footer inside card */}
          <p className="mt-4 text-center text-[11px] text-gray-500 select-none">
            Screen locked due to inactivity
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.35s ease-in-out; }
      `}</style>
    </>
  );
}
