import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';
import {
  verifyOwnerCredentials,
  verifyTwoFactorCode,
  OWNER_EMAIL,
} from '../../utils/portfolioStorage';

interface OwnerLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OwnerLoginModal: React.FC<OwnerLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'credentials' | 'two-factor'>('credentials');
  const [activeTab, setActiveTab] = useState<'authenticator' | 'backup'>('authenticator');
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [pin, setPin] = useState('');
  const [twoFactorInput, setTwoFactorInput] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [cycleSecondsRemaining, setCycleSecondsRemaining] = useState<number>(30);

  // Initialize or reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('credentials');
      setActiveTab('authenticator');
      setEmail(OWNER_EMAIL);
      setPin('');
      setTwoFactorInput('');
      setError('');
      setSuccessMsg('');
      setIsVerifying(false);
    }
  }, [isOpen]);

  // Neutral 30-second TOTP cycle timer (does not expose or calculate any secret/code)
  useEffect(() => {
    if (step !== 'two-factor' || !isOpen) return;

    const updateCycle = () => {
      const epoch = Math.floor(Date.now() / 1000);
      setCycleSecondsRemaining(30 - (epoch % 30));
    };

    updateCycle();
    const interval = setInterval(updateCycle, 1000);
    return () => clearInterval(interval);
  }, [step, isOpen]);

  if (!isOpen) return null;

  // Step 1: Verify Email + Passcode
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isValid = verifyOwnerCredentials(email, pin);
    if (isValid) {
      setStep('two-factor');
      setActiveTab('authenticator');
      setTwoFactorInput('');
    } else {
      setError('Invalid owner credentials. Please verify your email and passcode.');
    }
  };

  // Step 2: Verify 6-digit Authenticator App Code or Private Recovery Code
  const handleTwoFactorSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const cleanInput = twoFactorInput.trim().replace(/\s+/g, '');
    if (!cleanInput) {
      setError(
        activeTab === 'authenticator'
          ? 'Please enter the 6-digit code from your paired Authenticator app.'
          : 'Please enter your private emergency recovery code.'
      );
      return;
    }

    setIsVerifying(true);
    try {
      const isVerified = await verifyTwoFactorCode(cleanInput);
      if (isVerified) {
        setSuccessMsg('2FA Verified! Owner Portal Unlocked.');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 650);
      } else {
        setError(
          activeTab === 'authenticator'
            ? 'Invalid code. Enter the active 6-digit code from your paired Authenticator app.'
            : 'Invalid emergency recovery code.'
        );
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 text-zinc-200"
      >
        {/* Header with step progress indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center justify-center text-red-500 shadow-sm shadow-red-500/20">
              {step === 'credentials' ? (
                <Lock className="w-4.5 h-4.5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <div className="text-[10px] font-mono text-red-500 tracking-wider font-semibold">
                AUTHENTICATOR APP 2FA · RESTRICTED ACCESS
              </div>
              <h3 className="text-lg font-display font-bold text-zinc-100">
                {step === 'credentials' ? 'Owner Authentication' : 'Authenticator App Verification'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close owner login"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Badges */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] font-mono">
          <div
            className={`py-1.5 px-3 rounded-lg border text-center transition-all ${
              step === 'credentials'
                ? 'bg-red-950/40 border-red-800/80 text-red-300 font-semibold'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
            }`}
          >
            1. Email & Passcode
          </div>
          <div
            className={`py-1.5 px-3 rounded-lg border text-center transition-all ${
              step === 'two-factor'
                ? 'bg-red-950/40 border-red-800/80 text-red-300 font-semibold'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-500'
            }`}
          >
            2. Authenticator App (2FA)
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-800/70 rounded-xl text-xs text-red-200 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-950/50 border border-emerald-800/70 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= STEP 1: CREDENTIALS ================= */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="mt-5 space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed font-light">
              Enter your registered owner email and passcode to proceed to two-factor verification.
            </p>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Owner Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aviz.arts@gmail.com"
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">
                Passcode
              </label>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter passcode..."
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-500">
                Shortcut:{' '}
                <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">
                  Ctrl+Shift+E
                </kbd>
              </span>

              <button
                type="submit"
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs flex items-center gap-2 transition-all font-sans shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <span>Continue to 2FA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 2: AUTHENTICATOR APP (2FA) ================= */}
        {step === 'two-factor' && (
          <form onSubmit={handleTwoFactorSubmit} className="mt-5 space-y-4">
            {/* Method Tabs */}
            <div className="flex border-b border-zinc-800 gap-4 text-xs font-mono pb-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('authenticator');
                  setTwoFactorInput('');
                  setError('');
                }}
                className={`flex items-center gap-1.5 pb-1 transition-colors cursor-pointer ${
                  activeTab === 'authenticator'
                    ? 'text-red-400 font-bold border-b-2 border-red-500'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Authenticator App</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('backup');
                  setTwoFactorInput('');
                  setError('');
                }}
                className={`flex items-center gap-1.5 pb-1 transition-colors cursor-pointer ${
                  activeTab === 'backup'
                    ? 'text-red-400 font-bold border-b-2 border-red-500'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Recovery Code</span>
              </button>
            </div>

            {/* TAB 1: AUTHENTICATOR APP (QR & Secret hidden from login screen) */}
            {activeTab === 'authenticator' && (
              <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-200 font-medium">
                      Paired Authenticator Required
                    </p>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Open your paired Authenticator app and enter the active 6-digit code. For
                      security, your 2FA QR code and setup key are never displayed on this screen —
                      manage or pair new devices inside <strong>Owner Mode → 2FA &amp; Security</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-zinc-800/70">
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>
                      TOTP window refreshes in <strong>{cycleSecondsRemaining}s</strong>
                    </span>
                  </span>
                  <span className="text-zinc-500">QR Hidden</span>
                </div>
              </div>
            )}

            {/* TAB 2: EMERGENCY RECOVERY CODE (Input only, never displayed) */}
            {activeTab === 'backup' && (
              <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-zinc-200 text-xs font-mono font-semibold">
                  <Key className="w-4 h-4 text-red-400" />
                  <span>Private Emergency Recovery</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Lost access to your paired Authenticator device? Enter your private emergency
                  recovery code below to sign in, then re-pair or rotate your QR key inside{' '}
                  <strong>2FA &amp; Security</strong>.
                </p>
              </div>
            )}

            {/* Code Input */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                {activeTab === 'authenticator'
                  ? 'Enter 6-Digit Code from Your Authenticator App'
                  : 'Enter Private Recovery Code'}
              </label>
              <input
                type={activeTab === 'backup' ? 'password' : 'text'}
                inputMode={activeTab === 'authenticator' ? 'numeric' : 'text'}
                required
                maxLength={12}
                autoFocus
                autoComplete="one-time-code"
                value={twoFactorInput}
                onChange={(e) => setTwoFactorInput(e.target.value.replace(/[^0-9A-Za-z-]/g, ''))}
                placeholder="••••••"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-center font-mono text-2xl tracking-[0.3em] font-bold text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-red-500 transition-colors shadow-inner"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setError('');
                  setTwoFactorInput('');
                }}
                className="px-3 py-2 text-zinc-400 hover:text-white rounded-xl text-xs font-mono flex items-center gap-1.5 hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="submit"
                disabled={isVerifying}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-xl text-xs flex items-center gap-2 transition-all font-sans shadow-lg shadow-red-600/30 cursor-pointer"
              >
                {isVerifying ? (
                  <span>Verifying Code...</span>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Verify &amp; Unlock Portal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
