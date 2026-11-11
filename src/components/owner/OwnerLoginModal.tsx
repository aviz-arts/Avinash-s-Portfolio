import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Lock,
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Smartphone,
  QrCode,
  Sparkles,
  HelpCircle,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import {
  verifyOwnerCredentials,
  verifyTwoFactorCode,
  calculateTotpCode,
  getStoredTotpSecret,
  saveStoredTotpSecret,
  generateRandomTotpSecret,
  getOtpAuthUri,
  OWNER_EMAIL,
  DEFAULT_OWNER_PIN,
  MASTER_2FA_BACKUP_CODE,
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
  const [showDefaultHint, setShowDefaultHint] = useState(false);
  const [showQrDetails, setShowQrDetails] = useState(true);

  // Authenticator TOTP State
  const [totpSecret, setTotpSecret] = useState<string>(() => getStoredTotpSecret());
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [syncedCode, setSyncedCode] = useState<string>('');
  const [showSyncedPreview, setShowSyncedPreview] = useState(false);
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
      setShowDefaultHint(false);
      setCopiedKey(false);
      setShowSyncedPreview(false);
      const secret = getStoredTotpSecret();
      setTotpSecret(secret);
      generateQr(secret);
    }
  }, [isOpen]);

  // Generate QR Code data URL whenever secret changes
  const generateQr = async (secret: string) => {
    try {
      const uri = getOtpAuthUri(secret);
      const url = await QRCode.toDataURL(uri, {
        width: 240,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(url);
    } catch (err) {
      console.error('Failed to generate QR code', err);
    }
  };

  // 30-Second TOTP Cycle Clock & Live Preview
  useEffect(() => {
    let interval: any;
    if (step === 'two-factor' && isOpen) {
      const updateCycle = async () => {
        const epoch = Math.floor(Date.now() / 1000);
        const remaining = 30 - (epoch % 30);
        setCycleSecondsRemaining(remaining);

        // Update live synced code
        try {
          const code = await calculateTotpCode(totpSecret);
          setSyncedCode(code);
        } catch {
          // ignore
        }
      };

      updateCycle();
      interval = setInterval(updateCycle, 1000);
    }
    return () => clearInterval(interval);
  }, [step, isOpen, totpSecret]);

  if (!isOpen) return null;

  // Step 1: Verify Email + Passcode (5904)
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isValid = verifyOwnerCredentials(email, pin);
    if (isValid) {
      setStep('two-factor');
      setTwoFactorInput('');
      generateQr(totpSecret);
    } else {
      setError('Invalid owner credentials. Please verify your email and passcode.');
    }
  };

  // Step 2: Verify 6-digit Authenticator App Code
  const handleTwoFactorSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');

    const cleanInput = twoFactorInput.trim().replace(/\s+/g, '');
    if (!cleanInput) {
      setError('Please enter the 6-digit code from your authenticator app.');
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
        }, 750);
      } else {
        setError(
          'Invalid code. Please enter the current 6-digit code shown in your Authenticator app, or use backup key 590426.'
        );
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Copy Secret Key for manual entry
  const handleCopySecretKey = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Generate new TOTP setup key and QR code
  const handleRegenerateSecret = () => {
    if (
      window.confirm(
        'Generate a new Authenticator Secret Key? You will need to scan the new QR code in your authenticator app.'
      )
    ) {
      const newSecret = generateRandomTotpSecret();
      saveStoredTotpSecret(newSecret);
      setTotpSecret(newSecret);
      generateQr(newSecret);
      setError('');
    }
  };

  // Quick autofill for live test or emergency backup
  const handleAutofillLive = () => {
    if (syncedCode) {
      setTwoFactorInput(syncedCode);
      setError('');
    }
  };

  const handleAutofillBackup = () => {
    setTwoFactorInput(MASTER_2FA_BACKUP_CODE);
    setError('');
  };

  const handleUseDefault = () => {
    setEmail(OWNER_EMAIL);
    setPin(DEFAULT_OWNER_PIN);
    setError('');
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
              Enter your registered owner email and master passcode to proceed to your Authenticator App verification.
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-mono text-zinc-400">
                  Passcode (5904)
                </label>
                <button
                  type="button"
                  onClick={() => setShowDefaultHint(!showDefaultHint)}
                  className="text-[10px] text-red-400 hover:underline font-mono cursor-pointer"
                >
                  {showDefaultHint ? 'Hide hint' : 'Passcode reminder?'}
                </button>
              </div>
              <input
                type="password"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter passcode (5904)..."
                className="w-full px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
              />

              {showDefaultHint && (
                <div className="mt-2 p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                  <span>
                    Owner Passcode: <strong className="text-red-400 font-bold">5904</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleUseDefault}
                    className="px-2 py-0.5 bg-red-950/60 text-red-300 hover:bg-red-900/60 border border-red-800/60 rounded text-[10px] cursor-pointer"
                  >
                    Autofill (aviz.arts@gmail.com / 5904)
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-500">
                Shortcut: <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-400">Ctrl+Shift+E</kbd>
              </span>

              <button
                type="submit"
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs flex items-center gap-2 transition-all font-sans shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <span>Continue to Authenticator</span>
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
                onClick={() => setActiveTab('authenticator')}
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
                onClick={() => setActiveTab('backup')}
                className={`flex items-center gap-1.5 pb-1 transition-colors cursor-pointer ${
                  activeTab === 'backup'
                    ? 'text-red-400 font-bold border-b-2 border-red-500'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Emergency Backup Key</span>
              </button>
            </div>

            {/* TAB 1: AUTHENTICATOR APP (Google Authenticator, Microsoft Authenticator, Authy, Apple Passwords) */}
            {activeTab === 'authenticator' && (
              <div className="space-y-3.5">
                {/* QR Code & App Instructions Accordion/Card */}
                <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-mono font-semibold text-zinc-200">
                        Pair Authenticator App
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowQrDetails(!showQrDetails)}
                      className="text-[10px] font-mono text-zinc-400 hover:text-white underline cursor-pointer"
                    >
                      {showQrDetails ? 'Minimize QR' : 'Show QR & Setup Key'}
                    </button>
                  </div>

                  {showQrDetails && (
                    <div className="pt-1 space-y-3">
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/60 p-3 rounded-xl border border-zinc-800/80">
                        {/* QR Code Display */}
                        {qrDataUrl ? (
                          <div className="shrink-0 p-1.5 bg-white rounded-lg shadow-md">
                            <img
                              src={qrDataUrl}
                              alt="Scan in Authenticator App"
                              className="w-28 h-28 object-contain block"
                            />
                          </div>
                        ) : (
                          <div className="w-28 h-28 bg-zinc-800 animate-pulse rounded-lg flex items-center justify-center text-xs font-mono text-zinc-500">
                            Loading QR...
                          </div>
                        )}

                        {/* Setup details */}
                        <div className="flex-1 text-left space-y-1.5">
                          <p className="text-[11px] text-zinc-300 leading-snug">
                            1. Open <strong>Google Authenticator</strong>, <strong>Microsoft Authenticator</strong>, or <strong>Authy</strong> on your phone.
                          </p>
                          <p className="text-[11px] text-zinc-300 leading-snug">
                            2. Tap <strong>+</strong> and choose <strong>Scan a QR code</strong>.
                          </p>
                          <p className="text-[11px] text-zinc-400 leading-snug">
                            Or enter setup key manually:
                          </p>

                          <div className="flex items-center gap-1.5 pt-0.5">
                            <code className="px-2 py-1 bg-zinc-950 border border-zinc-800 text-red-400 font-mono text-[11px] font-semibold tracking-wider rounded select-all">
                              {totpSecret}
                            </code>
                            <button
                              type="button"
                              onClick={handleCopySecretKey}
                              className="p-1 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded transition-colors cursor-pointer"
                              title="Copy setup key"
                            >
                              {copiedKey ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Supported Authenticator Apps Pill List */}
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-0.5">
                        <span>Works with: Google Authenticator · Microsoft Authenticator · Authy · 1Password · Apple Passwords</span>
                        <button
                          type="button"
                          onClick={handleRegenerateSecret}
                          className="hover:text-red-400 flex items-center gap-1 cursor-pointer"
                          title="Generate a fresh secret key"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Reset Key</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 30s Live Sync Indicator */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>App code cycle: <strong>{cycleSecondsRemaining}s remaining</strong></span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setShowSyncedPreview(!showSyncedPreview)}
                      className="text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
                    >
                      {showSyncedPreview ? 'Hide Preview' : 'Show Synced Preview'}
                    </button>
                  </div>

                  {showSyncedPreview && syncedCode && (
                    <div className="p-2.5 bg-black/60 border border-zinc-800 rounded-xl flex items-center justify-between animate-in fade-in">
                      <span className="text-[11px] font-mono text-zinc-400">
                        Current App Code: <strong className="text-white font-mono tracking-widest text-sm">{syncedCode}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleAutofillLive}
                        className="px-2 py-0.5 bg-red-950/60 border border-red-800 text-red-300 hover:bg-red-900 rounded text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Autofill</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: EMERGENCY BACKUP KEY */}
            {activeTab === 'backup' && (
              <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-zinc-200 text-xs font-mono font-semibold">
                  <Key className="w-4 h-4 text-red-400" />
                  <span>Master Emergency Recovery Key</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-light">
                  If you lost your phone or cannot open your Authenticator app, use your permanent master recovery key:
                </p>
                <div className="flex items-center justify-between p-3 bg-black/60 border border-zinc-800 rounded-xl font-mono">
                  <span className="text-lg font-bold tracking-[0.2em] text-red-400 pl-2">
                    {MASTER_2FA_BACKUP_CODE}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutofillBackup}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-sans font-medium transition-colors cursor-pointer"
                  >
                    Autofill Backup Key
                  </button>
                </div>
                <p className="text-[10px] font-mono text-zinc-500">
                  Note: Your owner passcode <code className="text-zinc-400">5904</code> also functions as an emergency key.
                </p>
              </div>
            )}

            {/* 6-Digit Code Input */}
            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                Enter 6-Digit Code from your Authenticator App
              </label>
              <input
                type="text"
                required
                maxLength={8}
                autoFocus
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
                    <span>Verify & Unlock Portal</span>
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
