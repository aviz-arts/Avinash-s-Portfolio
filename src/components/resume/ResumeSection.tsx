import React from 'react';
import {
  Download,
  Printer,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import {
  OwnerProfile,
  StoredResumePdf,
  SiteContent,
  CustomSection,
} from '../../utils/portfolioStorage';
import { EditableText } from '../common/EditableText';
import { CustomSectionRenderer } from '../portfolio/CustomSectionRenderer';

interface ResumeSectionProps {
  profile: OwnerProfile;
  resumePdf: StoredResumePdf | null;
  onDownloadResume: () => void;
  onOpenResumeUploader: () => void;
  isOwner?: boolean;
  siteContent?: SiteContent;
  onUpdateSiteContent?: (key: keyof SiteContent, value: string) => void;
  customSections?: CustomSection[];
  onUpdateCustomSection?: (id: string, updated: Partial<CustomSection>) => void;
  onDeleteCustomSection?: (id: string) => void;
  onAddSectionClick?: (tab: 'home' | 'work' | 'about' | 'resume' | 'contact') => void;
  onEditSectionClick?: (section: CustomSection) => void;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  profile,
  resumePdf,
  onDownloadResume,
  onOpenResumeUploader,
  isOwner = false,
  siteContent,
  onUpdateSiteContent,
  customSections = [],
  onUpdateCustomSection,
  onDeleteCustomSection,
  onAddSectionClick,
  onEditSectionClick,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] py-12 sm:py-16 bg-[#050505]">

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 relative z-10 space-y-8">
        {/* Top Action Bar & Header Banner */}
        <div className="p-5 sm:p-8 bg-zinc-950/90 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 print:border-none print:p-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-red-500 uppercase tracking-widest font-semibold">
              <FileText className="w-4 h-4" />
              <span>OFFICIAL CURRICULUM VITAE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
              {profile.name} — Resume
            </h1>

            <div className="text-xs font-mono text-zinc-400 flex flex-wrap items-center gap-3">
              <span className="text-red-400 font-semibold">{profile.title}</span>
              <span className="text-zinc-600">·</span>
              <span>Unreal Engine 5.4 · Unity HDRP</span>
              <span className="text-zinc-600">·</span>
              <span>Available for Lead & Senior Roles</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden">
            <button
              onClick={onDownloadResume}
              className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-red-600/30 cursor-pointer font-sans"
              title="Download official PDF resume"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 rounded-xl text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer"
              title="Print or save as browser PDF"
            >
              <Printer className="w-4 h-4 text-zinc-400" />
              <span>Print</span>
            </button>

            {isOwner && (
              <button
                onClick={onOpenResumeUploader}
                className="px-3.5 py-3 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Upload or replace your custom PDF resume file"
              >
                <Upload className="w-3.5 h-3.5 text-red-400" />
                <span>{resumePdf ? 'Replace PDF' : 'Upload PDF'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status notice if custom resume PDF is uploaded */}
        {resumePdf && (
          <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs font-mono text-zinc-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
              <span>
                Active Custom PDF: <strong className="text-white">{resumePdf.filename}</strong>
              </span>
            </div>
            <button
              onClick={onDownloadResume}
              className="text-red-400 hover:underline flex items-center gap-1"
            >
              <span>Download Attached File</span>
              <Download className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* 1. Production Benchmarks Strip (Removable, Editable & Restorable) */}
        {siteContent?.resumeShowBenchmarks !== false ? (
          <div className="relative group/benchmarks">
            {isOwner && (
              <div className="flex items-center justify-between pb-2 text-xs font-mono text-zinc-400">
                <span className="text-[11px] uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Production Benchmarks Strip</span>
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateSiteContent?.('resumeShowBenchmarks', 'false')}
                  className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-red-400 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Remove or hide this Benchmarks section from public view"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove / Hide Section</span>
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1">
                <div className="text-2xl font-display font-extrabold text-white">
                  <EditableText
                    value={siteContent?.resumeBenchmark1Value || '4 Titles'}
                    onChange={(v) => onUpdateSiteContent?.('resumeBenchmark1Value', v)}
                    isOwner={isOwner}
                    label="Benchmark 1 Value"
                    as="span"
                  />
                </div>
                <div className="text-xs font-mono text-zinc-500">
                  <EditableText
                    value={siteContent?.resumeBenchmark1Label || 'Shipped Releases (PC/Console)'}
                    onChange={(v) => onUpdateSiteContent?.('resumeBenchmark1Label', v)}
                    isOwner={isOwner}
                    label="Benchmark 1 Label"
                    as="span"
                  />
                </div>
              </div>

              {/* Card 2 (Crimson Highlight) */}
              <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1">
                <div className="text-2xl font-display font-extrabold text-red-500">
                  <EditableText
                    value={siteContent?.resumeBenchmark2Value || '100% Core'}
                    onChange={(v) => onUpdateSiteContent?.('resumeBenchmark2Value', v)}
                    isOwner={isOwner}
                    label="Benchmark 2 Value"
                    as="span"
                  />
                </div>
                <div className="text-xs font-mono text-zinc-500">
                  <EditableText
                    value={siteContent?.resumeBenchmark2Label || 'Game Design & Mechanics Focus'}
                    onChange={(v) => onUpdateSiteContent?.('resumeBenchmark2Label', v)}
                    isOwner={isOwner}
                    label="Benchmark 2 Label"
                    as="span"
                  />
                </div>
              </div>

              {/* Card 3 */}
              <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1">
                <div className="text-2xl font-display font-extrabold text-white">
                  <EditableText
                    value={siteContent?.resumeBenchmark3Value || '7+ Years'}
                    onChange={(v) => onUpdateSiteContent?.('resumeBenchmark3Value', v)}
                    isOwner={isOwner}
                    label="Benchmark 3 Value"
                    as="span"
                  />
                </div>
                <div className="text-xs font-mono text-zinc-500">
                  <EditableText
                    value={siteContent?.resumeBenchmark3Label || 'Game Industry Experience'}
                    onChange={(v) => onUpdateSiteContent?.('resumeBenchmark3Label', v)}
                    isOwner={isOwner}
                    label="Benchmark 3 Label"
                    as="span"
                  />
                </div>
              </div>

              {/* Card 4 */}
              <div className="p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1">
                <div className="text-2xl font-display font-extrabold text-white">
                  <EditableText
                    value={siteContent?.resumeBenchmark4Value || '60.0 FPS'}
                    onChange={(v) => onUpdateSiteContent?.('resumeBenchmark4Value', v)}
                    isOwner={isOwner}
                    label="Benchmark 4 Value"
                    as="span"
                  />
                </div>
                <div className="text-xs font-mono text-zinc-500">
                  <EditableText
                    value={siteContent?.resumeBenchmark4Label || 'Lumen Console Frametime (Passion)'}
                    onChange={(v) => onUpdateSiteContent?.('resumeBenchmark4Label', v)}
                    isOwner={isOwner}
                    label="Benchmark 4 Label"
                    as="span"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : isOwner ? (
          <div className="p-4 bg-zinc-950/50 border border-dashed border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <span className="text-zinc-500">
              Benchmarks KPI Strip is currently <strong className="text-zinc-400">hidden/removed</strong> from public visitors.
            </span>
            <button
              type="button"
              onClick={() => onUpdateSiteContent?.('resumeShowBenchmarks', 'true')}
              className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-800/60 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Restore Benchmarks Strip</span>
            </button>
          </div>
        ) : null}

        {/* 2. Executive Design Profile Summary (Removable, Editable & Restorable) */}
        {siteContent?.resumeShowExecutiveProfile !== false ? (
          <div className="relative group/exec bg-zinc-950/80 border border-zinc-800 rounded-3xl p-8 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-widest text-red-500 font-semibold">
                <EditableText
                  value={siteContent?.resumeExecutiveKicker || 'EXECUTIVE DESIGN PROFILE'}
                  onChange={(v) => onUpdateSiteContent?.('resumeExecutiveKicker', v)}
                  isOwner={isOwner}
                  label="Executive Kicker"
                />
              </div>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => onUpdateSiteContent?.('resumeShowExecutiveProfile', 'false')}
                  className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-red-400 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Remove or hide this Executive Profile section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove / Hide Section</span>
                </button>
              )}
            </div>

            <p className="text-sm sm:text-base text-zinc-300 font-light leading-relaxed">
              <EditableText
                value={
                  siteContent?.resumeExecutiveText ||
                  profile.leadCopy ||
                  'Professional Game Designer specializing in core gameplay loops, mechanics, player pacing, and level architecture — powered by a lifelong hobby and passion as a Lighting Artist.'
                }
                onChange={(v) => onUpdateSiteContent?.('resumeExecutiveText', v)}
                isOwner={isOwner}
                label="Executive Narrative"
                multiline={true}
                as="span"
              />
            </p>
          </div>
        ) : isOwner ? (
          <div className="p-4 bg-zinc-950/50 border border-dashed border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <span className="text-zinc-500">
              Executive Design Profile Callout is currently <strong className="text-zinc-400">hidden/removed</strong> from public visitors.
            </span>
            <button
              type="button"
              onClick={() => onUpdateSiteContent?.('resumeShowExecutiveProfile', 'true')}
              className="px-3 py-1.5 bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-800/60 rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Restore Executive Profile</span>
            </button>
          </div>
        ) : null}

        {/* 3. Custom Sections for Resume Tab (Supports new stats strips, callouts, and card grids) */}
        <CustomSectionRenderer
          sections={customSections}
          tab="resume"
          isOwner={isOwner}
          onUpdateSection={onUpdateCustomSection}
          onDeleteSection={onDeleteCustomSection}
          onAddSectionClick={onAddSectionClick}
          onEditSectionClick={onEditSectionClick}
        />

        {/* Owner Quick-Add Section bar on Resume tab */}
        {isOwner && (
          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <span className="text-zinc-400">
              Need another Benchmarks KPI strip, Callout box, or custom cards section in Resume?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAddSectionClick?.('resume')}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-red-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Section to Resume</span>
              </button>
            </div>
          </div>
        )}

        {/* Technical Competencies Matrix */}
        <div className="p-8 bg-zinc-950/80 border border-zinc-800 rounded-3xl space-y-6">
          <div className="text-xs font-mono uppercase tracking-widest text-red-500 font-semibold">
            TECHNICAL MATRIX & PROFICIENCIES
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-1.5">
              <div className="font-mono font-bold text-white">Game Design & Mechanics</div>
              <div className="text-zinc-400 font-light leading-relaxed">
                Core Loops, Mechanics Prototyping, Player Psychology, Combat Pacing, System Economies, Risk/Reward Timing Windows
              </div>
            </div>

            <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-1.5">
              <div className="font-mono font-bold text-white">Lighting Art (Passion) & Engines</div>
              <div className="text-zinc-400 font-light leading-relaxed">
                Unreal Engine 5.4 Lumen & Nanite, Unity HDRP, ACES Filmic Color Grading, Volumetric Atmospheric Fog, VSM
              </div>
            </div>

            <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-1.5">
              <div className="font-mono font-bold text-white">Level Design & Architecture</div>
              <div className="text-zinc-400 font-light leading-relaxed">
                Combat Greybox Blockouts, 3-Lane Topology, Sightline Calculation, Verticality Layers, Diegetic Lighting Guidance
              </div>
            </div>

            <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-1.5">
              <div className="font-mono font-bold text-white">DCC Tools & Source Control</div>
              <div className="text-zinc-400 font-light leading-relaxed">
                Maya, Blender, Substance 3D Painter, Marmoset Toolbag 4, Perforce, Git LFS
              </div>
            </div>
          </div>
        </div>

        {/* Education & Credentials */}
        <div className="p-8 bg-zinc-950/80 border border-zinc-800 rounded-3xl space-y-4">
          <div className="text-xs font-mono uppercase tracking-widest text-red-500 font-semibold">
            EDUCATION & ACCREDITATIONS
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <div className="font-semibold text-white font-display text-sm">
                Bachelor of Science in Game Design & Interactive Environments
              </div>
              <div className="text-zinc-400 font-mono mt-0.5">Honors Graduate · Focus on Spatial Pacing & Mechanics</div>
            </div>

            <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-[11px] text-red-400 self-start sm:self-auto">
              Epic Games Unreal Engine 5 Specialist
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
