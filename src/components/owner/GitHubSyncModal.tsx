import React, { useState, useRef } from 'react';
import {
  X,
  GitBranch,
  GitCommit,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Upload,
  ExternalLink,
  Loader2,
  FileJson,
  ShieldCheck,
} from 'lucide-react';
import {
  GitHubSyncStatus,
  PortfolioDataDocument,
  createDataJsonExportString,
  parseDataJsonImportString,
} from '../../utils/githubSync';
import { OwnerSessionSnapshot } from '../../utils/portfolioStorage';

export type GitHubSyncState =
  | 'checking'
  | 'committed'
  | 'committing'
  | 'local-saved'
  | 'needs-config'
  | 'error';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: GitHubSyncState;
  repoInfo: GitHubSyncStatus;
  lastCommitSha?: string | null;
  lastCommitUrl?: string | null;
  lastSyncedAt?: number;
  lastError?: string | null;
  hasUnsavedChanges?: boolean;
  currentSnapshot: OwnerSessionSnapshot;
  onCommitNow: (commitMessage?: string) => Promise<{ ok: boolean; message?: string }>;
  onPullLatest: () => Promise<{ ok: boolean; message?: string }>;
  onApplyImportedDocument: (doc: PortfolioDataDocument) => Promise<void>;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  repoInfo,
  lastCommitSha,
  lastCommitUrl,
  lastSyncedAt,
  lastError,
  hasUnsavedChanges = false,
  currentSnapshot,
  onCommitNow,
  onPullLatest,
  onApplyImportedDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'commit' | 'vercel' | 'json'>('commit');
  const [commitMessage, setCommitMessage] = useState(
    'chore(portfolio): update data.json via Owner Mode'
  );
  const [busyAction, setBusyAction] = useState<'commit' | 'pull' | 'import' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pasteJson, setPasteJson] = useState('');
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const repoDisplay =
    repoInfo.owner && repoInfo.repo
      ? `${repoInfo.owner}/${repoInfo.repo}`
      : 'Not detected yet (set GITHUB_REPO or deploy via Vercel Git integration)';

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setFeedback({ type: 'err', text: 'Clipboard copy failed — copy manually.' });
    }
  };

  const handleCommit = async () => {
    setBusyAction('commit');
    setFeedback(null);
    const res = await onCommitNow(commitMessage);
    setBusyAction(null);
    if (res.ok) {
      setFeedback({
        type: 'ok',
        text: res.message || 'Committed data.json to GitHub repository!',
      });
    } else {
      setFeedback({
        type: 'err',
        text: res.message || 'Could not commit data.json to GitHub.',
      });
    }
  };

  const handlePull = async () => {
    setBusyAction('pull');
    setFeedback(null);
    const res = await onPullLatest();
    setBusyAction(null);
    if (res.ok) {
      setFeedback({
        type: 'ok',
        text: res.message || 'Pulled latest data.json from GitHub.',
      });
    } else {
      setFeedback({
        type: 'err',
        text: res.message || 'Failed to pull data.json from GitHub.',
      });
    }
  };

  const handleDownloadDataJson = () => {
    const jsonStr = createDataJsonExportString(currentSnapshot, lastSyncedAt || Date.now());
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({
      type: 'ok',
      text: 'Downloaded data.json — replace root /data.json in your repository if committing manually.',
    });
  };

  const handleApplyPastedJson = async () => {
    const parsed = parseDataJsonImportString(pasteJson);
    if (!parsed.ok || !parsed.data) {
      setFeedback({ type: 'err', text: parsed.error || 'Invalid data.json content.' });
      return;
    }
    setBusyAction('import');
    setFeedback(null);
    await onApplyImportedDocument(parsed.data);
    setBusyAction(null);
    setPasteJson('');
    setFeedback({
      type: 'ok',
      text: 'Imported data.json into Owner Mode and synced.',
    });
  };

  const handleUploadJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = (ev.target?.result as string) || '';
      const parsed = parseDataJsonImportString(text);
      if (!parsed.ok || !parsed.data) {
        setFeedback({ type: 'err', text: parsed.error || 'Invalid data.json file.' });
        return;
      }
      setBusyAction('import');
      await onApplyImportedDocument(parsed.data);
      setBusyAction(null);
      setFeedback({ type: 'ok', text: `Loaded "${file.name}" into portfolio.` });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const statusBadge = () => {
    if (syncStatus === 'committed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-700/60 text-emerald-300 text-xs font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Committed to GitHub</span>
        </span>
      );
    }
    if (syncStatus === 'committing' || syncStatus === 'checking') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-700/60 text-amber-300 text-xs font-mono">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{syncStatus === 'committing' ? 'Committing data.json...' : 'Checking GitHub...'}</span>
        </span>
      );
    }
    if (syncStatus === 'local-saved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-950/50 border border-sky-700/60 text-sky-300 text-xs font-mono">
          <FileJson className="w-3.5 h-3.5" />
          <span>Saved to Local data.json</span>
        </span>
      );
    }
    if (syncStatus === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/50 border border-red-700/60 text-red-300 text-xs font-mono">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Commit Error</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-mono">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Vercel Env Token Needed</span>
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-950/50 border border-red-800/60 flex items-center justify-center text-red-400">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white">
                GitHub Repository Sync (`data.json`)
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Direct Contents API commits — zero localStorage dependency
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-zinc-800 flex items-center gap-2 bg-zinc-950">
          <button
            onClick={() => setActiveTab('commit')}
            className={`px-3 py-2 text-xs font-mono border-b-2 transition-colors cursor-pointer ${
              activeTab === 'commit'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Commit &amp; Repo Status
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`px-3 py-2 text-xs font-mono border-b-2 transition-colors cursor-pointer ${
              activeTab === 'vercel'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Vercel Token Setup Guide
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-2 text-xs font-mono border-b-2 transition-colors cursor-pointer ${
              activeTab === 'json'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Download / Import `data.json`
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {feedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                feedback.type === 'ok'
                  ? 'bg-emerald-950/35 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}
            >
              {feedback.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {activeTab === 'commit' && (
            <div className="space-y-5">
              {/* Live Server Status Card */}
              <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                    Server Connection Status
                  </span>
                  {statusBadge()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                    <div className="text-zinc-500 text-[10px] uppercase">Target Repository</div>
                    <div className="text-zinc-200 mt-0.5 break-all">{repoDisplay}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                    <div className="text-zinc-500 text-[10px] uppercase">Branch &amp; File Path</div>
                    <div className="text-zinc-200 mt-0.5">
                      {repoInfo.branch} &middot; /{repoInfo.path}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                    <div className="text-zinc-500 text-[10px] uppercase">Server GITHUB_TOKEN</div>
                    <div className={repoInfo.hasToken ? 'text-emerald-400 mt-0.5' : 'text-amber-300 mt-0.5'}>
                      {repoInfo.hasToken ? 'Configured in Server Env' : 'Missing in Server Env'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
                    <div className="text-zinc-500 text-[10px] uppercase">Last Synced</div>
                    <div className="text-zinc-200 mt-0.5">
                      {lastSyncedAt && lastSyncedAt > 0
                        ? new Date(lastSyncedAt).toLocaleString()
                        : 'Bundled data.json'}
                    </div>
                  </div>
                </div>

                {lastCommitSha && (
                  <div className="flex items-center justify-between gap-2 pt-1 text-xs font-mono text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5" />
                      <span>Latest Commit: {lastCommitSha.slice(0, 7)}</span>
                    </span>
                    {lastCommitUrl && (
                      <a
                        href={lastCommitUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 underline underline-offset-2"
                      >
                        <span>View on GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {lastError && (
                  <div className="text-xs font-mono text-red-300 bg-red-950/30 border border-red-900/50 rounded-lg p-2.5">
                    {lastError}
                  </div>
                )}
              </div>

              {/* Commit Action */}
              <div className="space-y-3">
                <label className="block text-xs font-mono text-zinc-400">
                  GitHub Commit Message
                  {hasUnsavedChanges && (
                    <span className="ml-2 text-amber-300">(Unsaved edits pending)</span>
                  )}
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs font-mono focus:outline-none focus:border-red-500"
                  placeholder="chore(portfolio): update data.json via Owner Mode"
                />

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleCommit}
                    disabled={busyAction !== null}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-mono font-medium transition-colors cursor-pointer"
                  >
                    {busyAction === 'commit' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <GitCommit className="w-3.5 h-3.5" />
                    )}
                    <span>Commit `data.json` to GitHub</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePull}
                    disabled={busyAction !== null}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-zinc-200 border border-zinc-800 text-xs font-mono transition-colors cursor-pointer"
                  >
                    {busyAction === 'pull' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span>Pull Latest from GitHub</span>
                  </button>
                </div>
              </div>

              {!repoInfo.configured && (
                <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-800/50 text-xs text-amber-200/90 space-y-1.5 leading-relaxed">
                  <div className="font-mono font-semibold flex items-center gap-1.5 text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span>How server-side GitHub commits work safely</span>
                  </div>
                  <p>
                    Your `GITHUB_TOKEN` stays strictly inside Vercel&apos;s encrypted Environment
                    Variables (never entered in browser forms or committed to git). Open the{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('vercel')}
                      className="text-red-400 underline underline-offset-2 cursor-pointer"
                    >
                      Vercel Token Setup Guide
                    </button>{' '}
                    tab for the 3-step setup.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="font-mono font-semibold text-white">
                  Step 1 — Create a Fine-Grained GitHub Personal Access Token
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                  <li>
                    Go to GitHub &rarr; <strong>Settings</strong> &rarr;{' '}
                    <strong>Developer settings</strong> &rarr;{' '}
                    <strong>Personal access tokens</strong> &rarr;{' '}
                    <strong>Fine-grained tokens</strong>.
                  </li>
                  <li>
                    Under <strong>Repository access</strong>, select{' '}
                    <strong>Only select repositories</strong> and pick your portfolio repository.
                  </li>
                  <li>
                    Under <strong>Repository permissions</strong>, set{' '}
                    <code className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-red-300">
                      Contents
                    </code>{' '}
                    to <strong>Read and write</strong>, then click <strong>Generate token</strong>.
                  </li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="font-mono font-semibold text-white">
                  Step 2 — Add Environment Variables in Vercel
                </div>
                <p className="text-zinc-400">
                  Open your Vercel Project &rarr; <strong>Settings</strong> &rarr;{' '}
                  <strong>Environment Variables</strong> and add:
                </p>

                <div className="space-y-2 font-mono">
                  {[
                    {
                      name: 'GITHUB_TOKEN',
                      value: '<your-github-pat-with-contents-read-write>',
                      note: 'Required — encrypted server-side token used by /api/github-content',
                    },
                    {
                      name: 'GITHUB_REPO',
                      value: repoInfo.owner && repoInfo.repo ? `${repoInfo.owner}/${repoInfo.repo}` : 'username/portfolio-repo',
                      note: 'Optional if Vercel Git Integration is connected (auto-detected via VERCEL_GIT_REPO_OWNER/SLUG)',
                    },
                    {
                      name: 'GITHUB_BRANCH',
                      value: repoInfo.branch || 'main',
                      note: 'Optional — defaults to your deployed branch or main',
                    },
                  ].map((envVar) => (
                    <div
                      key={envVar.name}
                      className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="text-red-400 font-semibold">{envVar.name}</div>
                        <div className="text-zinc-300 break-all">{envVar.value}</div>
                        <div className="text-[11px] text-zinc-500 font-sans">{envVar.note}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(envVar.name, envVar.name)}
                        className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedKey === envVar.name ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKey === envVar.name ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                <div className="font-mono font-semibold text-white">
                  Step 3 — Redeploy Once
                </div>
                <p>
                  Trigger one redeploy in Vercel after saving `GITHUB_TOKEN`. From then on, saving in
                  Owner Mode calls <code className="text-red-300">PUT /api/github-content</code>, commits
                  directly to <code className="text-red-300">data.json</code> on GitHub, and every
                  device / visitor reads the live committed <code className="text-red-300">data.json</code>{' '}
                  without relying on browser <code className="text-zinc-200">localStorage</code>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadDataJson}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-medium cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download `data.json`</span>
                </button>

                <button
                  type="button"
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-mono cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-red-400" />
                  <span>Upload `data.json` File</span>
                </button>

                <input
                  ref={jsonFileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleUploadJsonFile}
                  className="hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-zinc-400">
                  Or paste raw `data.json` contents below to restore &amp; commit:
                </label>
                <textarea
                  value={pasteJson}
                  onChange={(e) => setPasteJson(e.target.value)}
                  rows={6}
                  placeholder='{ "version": 1, "projects": [...], ... }'
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={handleApplyPastedJson}
                  disabled={!pasteJson.trim() || busyAction !== null}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs font-mono cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Apply &amp; Sync `data.json`</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
