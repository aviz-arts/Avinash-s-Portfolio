import React, { useState } from 'react';
import { X, Lock, Key, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { verifyOwnerCredentials, OWNER_EMAIL, DEFAULT_OWNER_PIN } from '../../utils/portfolioStorage';

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
  const [email, setEmail] = useState('avinashr5904@gmail.com');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showDefaultHint, setShowDefaultHint] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const isValid = verifyOwnerCredentials(email, pin);
    if (isValid) {
      onSuccess();
      setPin('');
      onClose();
    } else {
      setError('Invalid owner credentials. Please verify your email and master PIN.');
    }
  };

  const handleUseDefault = () => {
    setEmail('avinashr5904@gmail.com');
    setPin(DEFAULT_OWNER_PIN);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-zinc-200"
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-red-500 tracking-wider">RESTRICTED ACCESS</div>
              <h3 className="text-lg font-display font-bold text-zinc-100">
                Owner Authentication
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
          Sign in to unlock site-wide editing capabilities. You will be able to update your experience,
          publish new projects, modify case studies, and tune lighting specifications.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              Owner Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono text-zinc-400">
                Master PIN / Passphrase
              </label>
              <button
                type="button"
                onClick={() => setShowDefaultHint(!showDefaultHint)}
                className="text-[10px] text-red-400 hover:underline font-mono"
              >
                {showDefaultHint ? 'Hide default PIN' : 'Forgot default PIN?'}
              </button>
            </div>
            <input
              type="password"
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter master PIN..."
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
            />

            {showDefaultHint && (
              <div className="mt-2 p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                <span>Default setup PIN: <strong className="text-red-400">avinash2026</strong></span>
                <button
                  type="button"
                  onClick={handleUseDefault}
                  className="px-2 py-0.5 bg-red-950/60 text-red-400 hover:bg-red-900/60 border border-red-800/60 rounded text-[10px]"
                >
                  Autofill
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
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors font-sans shadow-lg shadow-red-600/30"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Unlock Owner Mode</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
