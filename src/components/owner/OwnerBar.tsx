import React from 'react';
import {
  ShieldCheck,
  Plus,
  Edit3,
  Download,
  Upload,
  Eye,
  EyeOff,
  LogOut,
  RotateCcw,
  FileText,
  Type,
  Layers,
  Save,
  QrCode,
  Check,
  Loader2,
  FileCode2,
} from 'lucide-react';

export type DeploySyncState = 'checking' | 'synced' | 'saving' | 'readonly' | 'error';

interface OwnerBarProps {
  onAddNewProject: () => void;
  onEditProfile: () => void;
  onOpenResumeUploader: () => void;
  onOpenAllLinesEditor: () => void;
  onOpenSectionManager: () => void;
  onAddNewSection: () => void;
  onAddNewMilestone?: () => void;
  onExportBackup: () => void;
  onImportBackup: () => void;
  onResetDefaults: () => void;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onLogout: () => void;
  onForgetDevice?: () => void;
  hasCustomResumePdf?: boolean;
  hasUnsavedChanges?: boolean;
  onSaveChanges?: () => void;
  onOpenSecurity?: () => void;
  deploySyncState?: DeploySyncState;
  onDownloadPublishedModule?: () => void;
  onSyncNow?: () => void;
}

export const OwnerBar: React.FC<OwnerBarProps> = ({
  onAddNewProject,
  onEditProfile,
  onOpenResumeUploader,
  onOpenAllLinesEditor,
  onOpenSectionManager,
  onAddNewSection,
  onAddNewMilestone,
  onExportBackup,
  onImportBackup,
  onResetDefaults,
  isPreviewMode,
  onTogglePreview,
  onLogout,
  onForgetDevice,
  hasCustomResumePdf = false,
  hasUnsavedChanges = false,
  onSaveChanges,
  onOpenSecurity,
  deploySyncState = 'checking',
  onDownloadPublishedModule,
  onSyncNow,
}) => {
  return (
    <div className="print:hidden bg-zinc-950/95 border-b border-red-950/80 text-zinc-200 py-2 text-xs font-mono sticky top-0 z-50 backdrop-blur-md">
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Owner identity */}
        <div className="flex flex-wrap items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-red-500" />
          <span className="font-semibold text-white">Owner Mode Active:</span>
          <span className="text-zinc-400">aviz.arts@gmail.com</span>
          {hasUnsavedChanges && (
            <span className="inline-flex items-center gap-1.5 text-amber-300 border-l border-zinc-800 pl-2.5 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Unsaved changes</span>
            </span>
          )}
          {deploySyncState === 'saving' && (
            <span
              className="inline-flex items-center gap-1.5 text-amber-300 border-l border-zinc-800 pl-2.5 text-[11px]"
              title="Writing edits to source bundle for Vercel / production deployments..."
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Syncing for Vercel...</span>
            </span>
          )}
          {deploySyncState === 'synced' && (
            <button
              type="button"
              onClick={onSyncNow}
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 border-l border-zinc-800 pl-2.5 text-[11px] cursor-pointer transition-colors"
              title="All Owner edits are saved in src/data/publishedPortfolio.ts & public/uploads for your next Vercel deploy. Click to verify/re-sync."
            >
              <Check className="w-3 h-3" />
              <span>Synced for Vercel</span>
            </button>
          )}
          {deploySyncState === 'readonly' && onDownloadPublishedModule && (
            <button
              type="button"
              onClick={onDownloadPublishedModule}
              className="inline-flex items-center gap-1.5 text-amber-300 hover:text-white border-l border-zinc-800 pl-2.5 text-[11px] underline decoration-zinc-700 hover:decoration-red-500 underline-offset-2 cursor-pointer transition-colors"
              title="Live static Vercel host cannot commit to Git automatically. Make permanent edits in AI Studio Preview or click here to export publishedPortfolio.ts for src/data/."
            >
              <FileCode2 className="w-3 h-3 text-red-400" />
              <span>Static Vercel Host · Export Deploy File</span>
            </button>
          )}
          {deploySyncState === 'error' && (
            <button
              type="button"
              onClick={onSyncNow}
              className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 border-l border-zinc-800 pl-2.5 text-[11px] underline cursor-pointer"
              title="Deploy source sync failed or payload too large; click to retry syncing to src/data/publishedPortfolio.ts."
            >
              <span>Retry Vercel Sync</span>
            </button>
          )}
          {isPreviewMode && (
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white border border-zinc-700 text-[10px]">
              Visitor Preview Active
            </span>
          )}
        </div>

        {/* Right: Quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onAddNewProject}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-sans font-medium rounded-lg transition-colors text-xs shadow-sm shadow-red-600/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Project</span>
          </button>

          {onAddNewMilestone && (
            <button
              onClick={onAddNewMilestone}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg transition-colors text-xs"
              title="Add a new career milestone with photo to Resume timeline"
            >
              <Plus className="w-3.5 h-3.5 text-red-400" />
              <span>+ Milestone</span>
            </button>
          )}

          <button
            onClick={onAddNewSection}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 hover:bg-zinc-800 text-red-400 border border-red-900/50 rounded-lg transition-colors text-xs"
            title="Create a new custom showcase section in any tab"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Section</span>
          </button>

          <button
            onClick={onOpenSectionManager}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg transition-colors"
            title="Manage and reorder custom sections across all tabs"
          >
            <Layers className="w-3.5 h-3.5 text-red-400" />
            <span>Manage Sections</span>
          </button>

          <button
            onClick={onOpenResumeUploader}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
              hasCustomResumePdf
                ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            }`}
            title="Upload or replace your Resume PDF file"
          >
            <FileText className="w-3.5 h-3.5 text-red-400" />
            <span>{hasCustomResumePdf ? 'Resume PDF (Uploaded)' : 'Upload Resume PDF'}</span>
          </button>

          <button
            onClick={onOpenAllLinesEditor}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg transition-colors"
            title="Open master control to edit every line of text across all sections"
          >
            <Type className="w-3.5 h-3.5 text-red-400" />
            <span>Edit All Lines</span>
          </button>

          <button
            onClick={onEditProfile}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-red-400" />
            <span>Profile & Bio</span>
          </button>

          {onOpenSecurity && (
            <button
              onClick={onOpenSecurity}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Manage private 2FA QR pairing and owner passcode"
            >
              <QrCode className="w-3.5 h-3.5 text-red-400" />
              <span>2FA &amp; Security</span>
            </button>
          )}

          <button
            onClick={onTogglePreview}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
              isPreviewMode
                ? 'bg-white text-zinc-950 border-white font-medium'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
            }`}
            title="Toggle between owner edit mode and visitor preview"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isPreviewMode ? 'Exit Preview' : 'Visitor View'}</span>
          </button>

          <button
            onClick={onExportBackup}
            className="flex items-center gap-1 px-2 py-1 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg transition-colors"
            title="Export complete portfolio as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={onImportBackup}
            className="flex items-center gap-1 px-2 py-1 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg transition-colors"
            title="Import portfolio JSON backup"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1 px-2 py-1 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg transition-colors"
            title="Reset to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {hasUnsavedChanges && onSaveChanges && (
            <button
              onClick={onSaveChanges}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border border-amber-500/40 rounded-lg transition-colors cursor-pointer"
              title="Save all pending changes made during this Owner Mode session"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              <span>Save Changes</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Close Owner Mode (prompts to save if edits were made)"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Close Owner Mode</span>
          </button>

          {onForgetDevice && (
            <button
              onClick={onForgetDevice}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-lg transition-colors cursor-pointer"
              title="Completely hide the owner button on this device"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Hide Button on Device</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
