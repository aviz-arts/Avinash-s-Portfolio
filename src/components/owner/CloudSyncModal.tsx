import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
  Unlink,
  FileJson,
  ArrowRightLeft,
} from 'lucide-react';
import { OwnerSessionSnapshot } from '../../utils/portfolioStorage';
import {
  CloudSyncCredentials,
  createSyncPackageString,
  extractGistId,
  parseSyncPackageString,
} from '../../utils/cloudSync';

export type CloudSyncState = 'disconnected' | 'checking' | 'synced' | 'syncing' | 'error';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cloudSyncState: CloudSyncState;
  effectiveGistId: string;
  storedCredentials: CloudSyncCredentials | null;
  serverEnvConfigured: boolean;
  lastSyncedAt?: number;
  currentSnapshot: OwnerSessionSnapshot;
  onConnectAndPush: (gistId: string, token: string) => Promise<{ ok: boolean; gistId?: string; message?: string; warnings?: string[] }>;
  onPullNow: (gistIdOverride?: string) => Promise<{ ok: boolean; message?: string }>;
  onDisconnect: () => void;
  onApplyTransferPackage: (snapshot: OwnerSessionSnapshot, publishedAt: number) => Promise<void>;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  cloudSyncState,
  effectiveGistId,
  storedCredentials,
  serverEnvConfigured,
  lastSyncedAt,
  currentSnapshot,
  onConnectAndPush,
  onPullNow,
  onDisconnect,
  onApplyTransferPackage,
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'transfer'>('cloud');
  const [tokenInput, setTokenInput] = useState('');
  const [gistIdInput, setGistIdInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedGist, setCopiedGist] = useState(false);
  const [copiedPackage, setCopiedPackage] = useState(false);
  const [pastePackageText, setPastePackageText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTokenInput(storedCredentials?.githubToken || '');
      setGistIdInput(storedCredentials?.gistId || effectiveGistId || '');
      setFeedback(null);
      setPastePackageText('');
    }
  }, [isOpen, storedCredentials, effectiveGistId]);

  if (!isOpen) return null;

  const activeGist = extractGistId(gistIdInput || effectiveGistId || '');
  const hasTokenOrServer = Boolean(tokenInput.trim() || serverEnvConfigured);

  const handleCopyGistId = async () => {
    if (!activeGist) return;
    try {
      await navigator.clipboard.writeText(activeGist);
      setCopiedGist(true);
      setTimeout(() => setCopiedGist(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleConnectAndPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasTokenOrServer) {
      setFeedback({
        type: 'error',
        text: 'Paste a GitHub Personal Access Token with only the "gist" checkbox enabled.',
      });
      return;
    }

    setIsBusy(true);
    setFeedback(null);
    const result = await onConnectAndPush(extractGistId(gistIdInput), tokenInput.trim());
    setIsBusy(false);

    if (result.ok) {
      if (result.gistId) {
        setGistIdInput(result.gistId);
      }
      const warningNote =
        result.warnings && result.warnings.length > 0 ? ` (${result.warnings[0]})` : '';
      setFeedback({
        type: 'success',
        text: `${result.message || 'Live Cloud Sync connected & pushed! Changes now replicate across Vercel, Preview, and every device.'}${warningNote}`,
      });
    } else {
      setFeedback({
        type: 'error',
        text: result.message || 'Could not push to Cloud Gist. Check your token permissions.',
      });
    }
  };

  const handlePull = async () => {
    setIsBusy(true);
    setFeedback(null);
    const res = await onPullNow(extractGistId(gistIdInput) || undefined);
    setIsBusy(false);
    setFeedback({
      type: res.ok ? 'success' : 'error',
      text: res.message || (res.ok ? 'Pulled latest updates from Cloud!' : 'Failed to pull from Cloud.'),
    });
  };

  const handleCopyTransferCode = async () => {
    const pkg = createSyncPackageString(currentSnapshot, Date.now());
    try {
      await navigator.clipboard.writeText(pkg);
      setCopiedPackage(true);
      setFeedback({
        type: 'success',
        text: 'Transfer Code copied to clipboard! Paste it inside Cloud Sync -> Instant Transfer Code on your other host.',
      });
      setTimeout(() => setCopiedPackage(false), 2500);
    } catch {
      setFeedback({
        type: 'info',
        text: 'Clipboard blocked by browser — use Download Sync JSON below instead.',
      });
    }
  };

  const handleDownloadTransferJson = () => {
    const pkg = createSyncPackageString(currentSnapshot, Date.now());
    const blob = new Blob([pkg], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avinash-sync-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({
      type: 'success',
      text: 'Downloaded full portfolio Sync JSON file.',
    });
  };

  const handleApplyPastedPackage = async () => {
    const parsed = parseSyncPackageString(pastePackageText);
    if (!parsed.ok || !parsed.snapshot) {
      setFeedback({
        type: 'error',
        text: parsed.error || 'Invalid Transfer Code.',
      });
      return;
    }

    setIsBusy(true);
    await onApplyTransferPackage(parsed.snapshot, parsed.publishedAt || Date.now());
    setIsBusy(false);
    setPastePackageText('');
    setFeedback({
      type: 'success',
      text: 'Applied all changes to this site & saved!',
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#050505] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden text-zinc-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-600/40 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white tracking-tight">
                Live Cross-Site Sync (Vercel ↔ Preview ↔ Mobile)
              </h2>
              <p className="text-[11px] font-mono text-zinc-400">
                Edit in Owner Mode on ANY URL and replicate everywhere — zero Firebase required
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            aria-label="Close Cloud Sync dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-6 gap-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('cloud');
              setFeedback(null);
            }}
            className={`py-3 text-xs font-mono border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'cloud'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-red-400" />
            <span>Auto Live Cloud Sync</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('transfer');
              setFeedback(null);
            }}
            className={`py-3 text-xs font-mono border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'transfer'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-red-400" />
            <span>Instant Transfer Code (No Login)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/35 border-emerald-800/60 text-emerald-200'
                  : feedback.type === 'error'
                  ? 'bg-red-950/40 border-red-800/70 text-red-200'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-200'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{feedback.text}</span>
            </div>
          )}

          {activeTab === 'cloud' ? (
            <form onSubmit={handleConnectAndPush} className="space-y-5">
              {/* Live status summary card */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/90 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    Live Replication Status
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-mono border ${
                      cloudSyncState === 'synced'
                        ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                        : cloudSyncState === 'syncing' || cloudSyncState === 'checking'
                        ? 'bg-amber-950/40 border-amber-700/60 text-amber-300'
                        : cloudSyncState === 'error'
                        ? 'bg-red-950/40 border-red-700/60 text-red-300'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {cloudSyncState === 'synced'
                      ? 'Active · Synced Everywhere'
                      : cloudSyncState === 'syncing'
                      ? 'Pushing Updates...'
                      : cloudSyncState === 'checking'
                      ? 'Checking Remote...'
                      : cloudSyncState === 'error'
                      ? 'Sync Attention Needed'
                      : 'Not Connected Yet'}
                  </span>
                </div>

                {activeGist ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="text-xs font-mono text-zinc-300">
                      <span className="text-zinc-500">Sync Channel ID: </span>
                      <code className="text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {activeGist}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyGistId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-200 cursor-pointer"
                    >
                      {copiedGist ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 text-justify leading-relaxed">
                    Connect once using a free GitHub Gist (<code className="text-zinc-200">gist</code> scope only). Public visitors on Vercel &amp; Preview read updates automatically with zero login; only your Owner token can write changes.
                  </p>
                )}

                {lastSyncedAt && lastSyncedAt > 0 && (
                  <p className="text-[11px] font-mono text-zinc-500">
                    Last synchronized timestamp: {new Date(lastSyncedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Step 1: Create Token Link */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-white font-mono">
                    Step 1 · Generate Free GitHub Gist Token (30 sec)
                  </div>
                  <p className="text-xs text-zinc-400">
                    Pre-selects only the <code className="text-zinc-200">gist</code> permission. Never exposed to visitors.
                  </p>
                </div>
                <a
                  href="https://github.com/settings/tokens/new?scopes=gist&description=Avinash%20Portfolio%20Live%20Sync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-white transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-red-400" />
                  <span>Open Token Page</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400" />
                </a>
              </div>

              {/* Token Input */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-300">
                  GitHub Gist Token {serverEnvConfigured ? '(Optional — Server Env Already Active)' : '(Required to push edits)'}
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    autoComplete="off"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-red-500/70 focus:outline-none text-xs font-mono text-white placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white cursor-pointer"
                    aria-label={showToken ? 'Hide token' : 'Show token'}
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Existing Gist ID Input */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-300">
                  Sync Gist ID or URL (Leave blank on first setup to create automatically)
                </label>
                <input
                  type="text"
                  value={gistIdInput}
                  onChange={(e) => setGistIdInput(e.target.value)}
                  placeholder="Leave blank to auto-create, or paste Gist ID / https://gist.github.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-red-500/70 focus:outline-none text-xs font-mono text-white placeholder:text-zinc-600"
                />
                <p className="text-[11px] text-zinc-500 font-mono">
                  Important: On your second device/site (e.g. Preview if you set up on Vercel), enter the same Sync Gist ID &amp; token, then click Pull or Push!
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer shadow-lg shadow-red-600/25"
                  >
                    {isBusy ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5" />
                    )}
                    <span>Connect &amp; Push This Site to Cloud</span>
                  </button>

                  {activeGist && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={handlePull}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs font-mono transition-colors cursor-pointer"
                    >
                      <DownloadCloud className="w-3.5 h-3.5 text-red-400" />
                      <span>Pull Latest From Cloud</span>
                    </button>
                  )}
                </div>

                {storedCredentials?.githubToken && (
                  <button
                    type="button"
                    onClick={() => {
                      onDisconnect();
                      setTokenInput('');
                      setFeedback({
                        type: 'info',
                        text: 'Cleared stored GitHub token from this browser.',
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-300 text-xs font-mono cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Disconnect Browser</span>
                  </button>
                )}
              </div>

              {/* Optional Server Env Guide */}
              <details className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3.5 text-xs">
                <summary className="cursor-pointer font-mono text-zinc-300 select-none">
                  Optional: Enable Automatic Zero-Token Sync in Vercel Project Settings
                </summary>
                <div className="mt-2.5 space-y-1.5 text-zinc-400 font-mono text-[11px] leading-relaxed">
                  <p>
                    Add these environment variables in Vercel Dashboard → Project Settings → Environment Variables to allow pushing from any browser/incognito window:
                  </p>
                  <div className="p-2.5 rounded-lg bg-black border border-zinc-800 text-zinc-200 space-y-1">
                    <div>VITE_CLOUD_SYNC_GIST_ID={activeGist || '<your-gist-id>'}</div>
                    <div>PORTFOLIO_GIST_ID={activeGist || '<your-gist-id>'}</div>
                    <div>PORTFOLIO_GITHUB_TOKEN=&lt;your-github-gist-token&gt;</div>
                  </div>
                </div>
              </details>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="text-xs font-mono font-semibold text-white">
                  1 · Export Current Edits From This Host (Vercel or Preview)
                </div>
                <p className="text-xs text-zinc-400 text-justify leading-relaxed">
                  Copy a complete Transfer Package JSON containing every project, edit, custom section, and timeline milestone made on this browser. Paste it on Vercel or Preview to replicate changes immediately with zero accounts.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleCopyTransferCode}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    {copiedPackage ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPackage ? 'Copied Transfer Code' : 'Copy Transfer Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTransferJson}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-mono cursor-pointer"
                  >
                    <FileJson className="w-3.5 h-3.5 text-red-400" />
                    <span>Download Sync JSON</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <label className="block text-xs font-mono font-semibold text-white">
                  2 · Paste Transfer Code Received From Your Other Site
                </label>
                <textarea
                  value={pastePackageText}
                  onChange={(e) => setPastePackageText(e.target.value)}
                  rows={5}
                  placeholder='Paste JSON starting with { "format": "AVIZ_PORTFOLIO_SYNC_V1", ... }'
                  className="w-full p-3 rounded-xl bg-black border border-zinc-800 focus:border-red-500/70 focus:outline-none text-[11px] font-mono text-zinc-200 placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  disabled={isBusy || !pastePackageText.trim()}
                  onClick={handleApplyPastedPackage}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 border border-zinc-700 text-white text-xs font-mono cursor-pointer"
                >
                  <DownloadCloud className="w-3.5 h-3.5 text-red-400" />
                  <span>Apply Changes to This Site Now</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
