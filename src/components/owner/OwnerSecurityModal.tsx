import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  ShieldCheck,
  QrCode,
  Lock,
  Key,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Smartphone,
} from 'lucide-react';
import {
  verifyOwnerPasscode,
  getStoredTotpSecret,
  saveStoredTotpSecret,
  generateRandomTotpSecret,
  getOtpAuthUri,
  verifyAuthenticatorAppCode,
  isCustomTotpSecretConfigured,
  updateOwnerPin,
} from '../../utils/portfolioStorage';

interface OwnerSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusMessage?: (msg: string) => void;
}

export const OwnerSecurityModal: React.FC<OwnerSecurityModalProps> = ({
  isOpen,
  onClose,
  onStatusMessage,
}) => {
  // Always require explicit passcode re-verification whenever opened
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // TOTP & QR Pairing State (only populated AFTER passcode verification)
  const [activeSecret, setActiveSecret] = useState<string>('');
  const [pendingSecret, setPendingSecret] = useState<string | null>(null);
  const [isCustomConfigured, setIsCustomConfigured] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showManualKey, setShowManualKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyFeedback, setVerifyFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [cycleSecondsRemaining, setCycleSecondsRemaining] = useState<number>(30);

  // Passcode update form
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Clear all sensitive state immediately when closed or opened
  useEffect(() => {
    if (!isOpen) {
      setIsPasscodeUnlocked(false);
      setPasscodeInput('');
      setUnlockError('');
      setActiveSecret('');
      setPendingSecret(null);
      setQrDataUrl('');
      setShowManualKey(false);
      setCopiedKey(false);
      setVerifyCodeInput('');
      setVerifyFeedback(null);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setPinFeedback(null);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Update QR when unlocked secret or pending secret changes
  useEffect(() => {
    if (!isOpen || !isPasscodeUnlocked) return;
    const secretToDisplay = pendingSecret || activeSecret;
    if (!secretToDisplay) return;

    let cancelled = false;
    QRCode.toDataURL(getOtpAuthUri(secretToDisplay), {
      width: 240,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, isPasscodeUnlocked, activeSecret, pendingSecret]);

  // 30s countdown when unlocked
  useEffect(() => {
    if (!isOpen || !isPasscodeUnlocked) return;
    const tick = () => {
      const epoch = Math.floor(Date.now() / 1000);
      setCycleSecondsRemaining(30 - (epoch % 30));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [isOpen, isPasscodeUnlocked]);

  if (!isOpen) return null;

  const displayedSecret = pendingSecret || activeSecret;

  const handleUnlockSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    if (!verifyOwnerPasscode(passcodeInput)) {
      setUnlockError('Incorrect owner passcode. Access to 2FA QR settings denied.');
      return;
    }
    setActiveSecret(getStoredTotpSecret());
    setIsCustomConfigured(isCustomTotpSecretConfigured());
    setIsPasscodeUnlocked(true);
    setPasscodeInput('');
  };

  const handleGenerateNewSecret = () => {
    const fresh = generateRandomTotpSecret(32);
    setPendingSecret(fresh);
    setVerifyCodeInput('');
    setVerifyFeedback(null);
  };

  const handleVerifyAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = verifyCodeInput.trim().replace(/\s+/g, '');
    if (clean.length < 6) {
      setVerifyFeedback({ type: 'err', text: 'Enter the 6-digit code shown in your Authenticator app.' });
      return;
    }

    const secretToTest = pendingSecret || activeSecret;
    const ok = await verifyAuthenticatorAppCode(clean, secretToTest);
    if (!ok) {
      setVerifyFeedback({
        type: 'err',
        text: 'Code did not match. Scan the QR code above and enter the current 6-digit code.',
      });
      return;
    }

    if (pendingSecret) {
      saveStoredTotpSecret(pendingSecret);
      setActiveSecret(pendingSecret);
      setPendingSecret(null);
      setIsCustomConfigured(true);
      setVerifyCodeInput('');
      setVerifyFeedback({
        type: 'ok',
        text: 'Verified! Your new private 2FA secret key is now active.',
      });
      onStatusMessage?.('Private 2FA Authenticator key rotated and verified.');
    } else {
      if (!isCustomConfigured) {
        saveStoredTotpSecret(activeSecret);
        setIsCustomConfigured(true);
      }
      setVerifyCodeInput('');
      setVerifyFeedback({
        type: 'ok',
        text: 'Authenticator app sync confirmed! Your device is properly paired.',
      });
    }
  };

  const handleCopyKey = () => {
    if (!displayedSecret) return;
    navigator.clipboard.writeText(displayedSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleUpdatePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinFeedback(null);
    if (newPin.trim().length < 4) {
      setPinFeedback({ type: 'err', text: 'New passcode must be at least 4 characters.' });
      return;
    }
    if (newPin !== confirmPin) {
      setPinFeedback({ type: 'err', text: 'New passcodes do not match.' });
      return;
    }
    const ok = updateOwnerPin(currentPin, newPin);
    if (!ok) {
      setPinFeedback({ type: 'err', text: 'Current passcode is incorrect.' });
      return;
    }
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinFeedback({ type: 'ok', text: 'Owner passcode updated successfully.' });
    onStatusMessage?.('Owner passcode updated.');
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-security-modal-title"
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden text-zinc-200 my-8"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-zinc-900/70 border-b border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center justify-center text-red-400">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-red-500 uppercase tracking-wider font-semibold">
                Owner-Only Security Vault
              </div>
              <h3
                id="owner-security-modal-title"
                className="text-base font-display font-bold text-white"
              >
                2FA QR Pairing &amp; Access Security
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close security settings"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {!isPasscodeUnlocked ? (
            /* Passcode Re-Verification Gate */
            <form onSubmit={handleUnlockSecurity} className="space-y-4">
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-100">
                  <Lock className="w-4 h-4 text-red-400" />
                  <span>Confirm Your Identity to Reveal 2FA QR Code</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your 2FA QR code and secret key remain locked until you confirm your Owner
                  Passcode. Closing this window automatically re-locks the QR vault.
                </p>
              </div>

              {unlockError && (
                <div className="p-3 bg-red-950/50 border border-red-800/70 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{unlockError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1.5">
                  Owner Passcode
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter owner passcode..."
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-sans font-semibold rounded-xl text-xs transition-colors shadow-lg shadow-red-600/25 flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Unlock QR &amp; Security Settings</span>
                </button>
              </div>
            </form>
          ) : (
            /* Unlocked Owner-Only 2FA Pairing & Passcode Controls */
            <>
              {/* Key Status Banner */}
              {!isCustomConfigured && !pendingSecret ? (
                <div className="p-3.5 bg-amber-950/35 border border-amber-700/60 rounded-2xl flex items-start justify-between gap-3">
                  <div className="text-xs text-amber-200 leading-relaxed">
                    <strong className="font-mono text-amber-300 block mb-0.5">
                      Action Recommended: Rotate to Your Private Key
                    </strong>
                    Generate a brand-new 160-bit secret key so only your phone&apos;s Authenticator
                    app is linked to Owner Mode.
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateNewSecret}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-lg text-[11px] font-sans whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Generate Private QR
                  </button>
                </div>
              ) : pendingSecret ? (
                <div className="p-3.5 bg-red-950/35 border border-red-700/60 rounded-2xl flex items-center justify-between gap-3">
                  <div className="text-xs text-red-200 leading-relaxed">
                    <strong className="font-mono text-red-300 block mb-0.5">
                      New Pending 2FA Secret Ready
                    </strong>
                    Scan this new QR code in your Authenticator app, then enter a 6-digit code
                    below to activate it.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingSecret(null);
                      setVerifyCodeInput('');
                      setVerifyFeedback(null);
                    }}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-[11px] font-mono shrink-0 cursor-pointer"
                  >
                    Discard New
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-200">
                  <span className="flex items-center gap-2 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Custom private 2FA secret key active</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateNewSecret}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-red-400" />
                    <span>Rotate Key</span>
                  </button>
                </div>
              )}

              {/* Private QR & Setup Key Panel */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-red-400" />
                    <span className="text-xs font-mono font-semibold text-white">
                      {pendingSecret ? 'New Private Pairing QR Code' : 'Your Private 2FA QR Code'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Refresh cycle: {cycleSecondsRemaining}s
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-black/50 p-3.5 rounded-xl border border-zinc-800/80">
                  {qrDataUrl ? (
                    <div className="shrink-0 p-2 bg-white rounded-xl shadow-md">
                      <img
                        src={qrDataUrl}
                        alt="Private 2FA Authenticator QR Code"
                        className="w-32 h-32 object-contain block"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-zinc-800 animate-pulse rounded-xl flex items-center justify-center text-xs font-mono text-zinc-500">
                      Generating...
                    </div>
                  )}

                  <div className="flex-1 space-y-2 text-left">
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Scan with <strong>Google Authenticator</strong>,{' '}
                      <strong>Microsoft Authenticator</strong>, <strong>Authy</strong>, or{' '}
                      <strong>Apple Passwords</strong>.
                    </p>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span>Manual Setup Key</span>
                        <button
                          type="button"
                          onClick={() => setShowManualKey(!showManualKey)}
                          className="text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {showManualKey ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Reveal Key</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <code className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 text-red-400 font-mono text-[11px] font-semibold tracking-wider rounded-lg overflow-x-auto select-all">
                          {showManualKey ? displayedSecret : '••••••••••••••••••••••••••••••••'}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Copy secret key"
                        >
                          {copiedKey ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confirm pairing via live 6-digit code */}
                <form onSubmit={handleVerifyAndActivate} className="space-y-2.5 pt-1">
                  <label className="block text-[11px] font-mono text-zinc-400">
                    {pendingSecret
                      ? 'Confirm New Key: Enter 6-digit code from your app to activate'
                      : 'Test Device Pairing: Enter 6-digit code from your app'}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      value={verifyCodeInput}
                      onChange={(e) => setVerifyCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl font-mono text-sm tracking-[0.25em] text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-sans font-medium rounded-xl text-xs whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {pendingSecret ? 'Verify & Activate Key' : 'Verify App Code'}
                    </button>
                  </div>

                  {verifyFeedback && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                        verifyFeedback.type === 'ok'
                          ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-200'
                          : 'bg-red-950/40 border border-red-800/60 text-red-200'
                      }`}
                    >
                      {verifyFeedback.type === 'ok' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span>{verifyFeedback.text}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Change Owner Passcode */}
              <form
                onSubmit={handleUpdatePinSubmit}
                className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-zinc-200">
                  <Key className="w-4 h-4 text-red-400" />
                  <span>Change Owner Passcode</span>
                </div>

                {pinFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      pinFeedback.type === 'ok'
                        ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-200'
                        : 'bg-red-950/40 border border-red-800/60 text-red-200'
                    }`}
                  >
                    {pinFeedback.type === 'ok' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{pinFeedback.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="password"
                    required
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    placeholder="Current passcode"
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="password"
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="New passcode"
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="password"
                    required
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="Confirm new"
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 rounded-xl text-xs font-mono transition-colors cursor-pointer"
                  >
                    Update Passcode
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
