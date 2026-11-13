import React, { useEffect } from 'react';
import { AlertTriangle, EyeOff, RotateCcw, Save, X } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  mode: 'unsaved' | 'confirmForget';
  closeAction: 'logout' | 'forgetDevice' | null;
  changedSections: string[];
  onSaveAndClose: () => void;
  onDiscardAndClose: () => void;
  onConfirmForgetOnly: () => void;
  onCancel: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  mode,
  closeAction,
  changedSections,
  onSaveAndClose,
  onDiscardAndClose,
  onConfirmForgetOnly,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isForgetAction = closeAction === 'forgetDevice';

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-close-modal-title"
        className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900/70 border-b border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                mode === 'unsaved'
                  ? 'bg-amber-950/50 border-amber-700/60 text-amber-400'
                  : 'bg-red-950/50 border-red-800/60 text-red-400'
              }`}
            >
              {mode === 'unsaved' ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                {mode === 'unsaved' ? 'Owner Session' : 'Privacy Control'}
              </div>
              <h3
                id="owner-close-modal-title"
                className="text-base font-display font-bold text-white leading-tight"
              >
                {mode === 'unsaved'
                  ? 'Save Changes Before Closing?'
                  : 'Hide Owner Button on This Device?'}
              </h3>
            </div>
          </div>

          <button
            onClick={onCancel}
            aria-label="Cancel and stay in Owner Mode"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {mode === 'unsaved' ? (
            <>
              <p className="text-xs text-zinc-300 leading-relaxed">
                You made edits during this Owner Mode session. Would you like to save your changes
                before closing Owner Mode
                {isForgetAction ? ' and hiding the Owner button on this device' : ''}?
              </p>

              {changedSections.length > 0 && (
                <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Modified During This Session
                  </div>
                  <ul className="space-y-1.5">
                    {changedSections.map((section) => (
                      <li
                        key={section}
                        className="flex items-center gap-2 text-xs font-mono text-zinc-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>{section}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isForgetAction && (
                <p className="text-[11px] font-mono text-zinc-400 leading-relaxed border-l-2 border-red-500/60 pl-3">
                  Hiding removes the Owner shortcut on this device for privacy. Re-open anytime with{' '}
                  <span className="text-zinc-200">?owner</span> or{' '}
                  <span className="text-zinc-200">Ctrl+Shift+E</span>.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-zinc-300 leading-relaxed">
              The Owner Mode button will disappear on this device for privacy. You can re-open the
              owner portal anytime by visiting <span className="font-mono text-zinc-100">?owner</span>{' '}
              or pressing <span className="font-mono text-zinc-100">Ctrl+Shift+E</span>.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-zinc-900/50 border-t border-zinc-800 flex flex-col gap-2">
          {mode === 'unsaved' ? (
            <>
              <button
                onClick={onSaveAndClose}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-sans font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {isForgetAction ? 'Save Changes & Hide Owner Mode' : 'Save Changes & Close'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onDiscardAndClose}
                  className="py-2.5 px-3 bg-zinc-900 hover:bg-red-950/40 text-zinc-300 hover:text-red-300 border border-zinc-800 hover:border-red-800/60 rounded-xl text-xs font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Discard & Close</span>
                </button>

                <button
                  onClick={onCancel}
                  className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-mono transition-colors cursor-pointer"
                >
                  Keep Editing
                </button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onCancel}
                className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs font-mono transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={onConfirmForgetOnly}
                className="py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white font-sans font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/25 cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide & Close</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
