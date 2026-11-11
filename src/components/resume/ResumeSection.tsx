import React, { useState } from 'react';
import {
  Download,
  Printer,
  FileText,
  Briefcase,
  Calendar,
  Building2,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  ZoomIn,
  X,
} from 'lucide-react';
import {
  OwnerProfile,
  ResumeMilestone,
  StoredResumePdf,
  SiteContent,
  CustomSection,
} from '../../utils/portfolioStorage';
import { EditableText } from '../common/EditableText';
import { MediaUploadField } from '../common/MediaUploadField';
import { CustomSectionRenderer } from '../portfolio/CustomSectionRenderer';

interface ResumeSectionProps {
  profile: OwnerProfile;
  milestones: ResumeMilestone[];
  resumePdf: StoredResumePdf | null;
  onDownloadResume: () => void;
  onOpenResumeUploader: () => void;
  isOwner?: boolean;
  onUpdateMilestone: (id: string, updated: Partial<ResumeMilestone>) => void;
  onCreateMilestone: (milestone: ResumeMilestone) => void;
  onDeleteMilestone: (id: string) => void;
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
  milestones,
  resumePdf,
  onDownloadResume,
  onOpenResumeUploader,
  isOwner = false,
  onUpdateMilestone,
  onCreateMilestone,
  onDeleteMilestone,
  siteContent,
  onUpdateSiteContent,
  customSections = [],
  onUpdateCustomSection,
  onDeleteCustomSection,
  onAddSectionClick,
  onEditSectionClick,
}) => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption?: string } | null>(null);
  const [editingPhotoMilestoneId, setEditingPhotoMilestoneId] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleAddNewMilestone = () => {
    const newId = `milestone-${Date.now()}`;
    const newMilestone: ResumeMilestone = {
      id: newId,
      year: `${new Date().getFullYear()} — Present`,
      role: 'Senior Game Designer & Technical Lighting',
      studio: 'Studio Name · Project Title',
      location: 'Remote / Studio',
      description: 'Describe core gameplay loops, mechanics architecture, and level pacing systems.',
      achievements: [
        'Engineered responsive combat traversal mechanics and encounter pacing.',
        'Applied diegetic lighting to reinforce subconscious player wayfinding at 60 FPS.',
      ],
      techStack: ['Unreal Engine 5.4', 'Game Design', 'Blueprints', 'Lumen GI'],
      photoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      photoCaption: 'Mechanics blockout & sightline analysis pass',
    };
    onCreateMilestone(newMilestone);
  };

  const handleAddAchievement = (milestoneId: string, currentAchievements: string[]) => {
    const updated = [...currentAchievements, 'New production achievement or system metric...'];
    onUpdateMilestone(milestoneId, { achievements: updated });
  };

  const handleUpdateAchievement = (
    milestoneId: string,
    index: number,
    newValue: string,
    currentAchievements: string[]
  ) => {
    const updated = [...currentAchievements];
    updated[index] = newValue;
    onUpdateMilestone(milestoneId, { achievements: updated });
  };

  const handleDeleteAchievement = (
    milestoneId: string,
    index: number,
    currentAchievements: string[]
  ) => {
    const updated = currentAchievements.filter((_, i) => i !== index);
    onUpdateMilestone(milestoneId, { achievements: updated });
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] py-16 sm:py-20 bg-[#050505]">
      {/* Lightbox Modal for Milestone Photos */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-2"
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/80 text-zinc-300 hover:text-white border border-zinc-700 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              <img
                src={selectedImage.url}
                alt={selectedImage.caption || 'Milestone screenshot'}
                className="w-full h-full object-contain"
              />
            </div>
            {selectedImage.caption && (
              <p className="p-4 text-xs font-mono text-zinc-400 text-center border-t border-zinc-900 mt-2">
                {selectedImage.caption}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Photo Uploader Modal for Specific Milestone */}
      {editingPhotoMilestoneId && (
        <div
          onClick={() => setEditingPhotoMilestoneId(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-red-500" />
                <h3 className="text-base font-display font-bold text-white">Upload Milestone Photo / Screenshot</h3>
              </div>
              <button
                onClick={() => setEditingPhotoMilestoneId(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const activeMilestone = milestones.find((m) => m.id === editingPhotoMilestoneId);
              if (!activeMilestone) return null;
              return (
                <div className="space-y-4">
                  <MediaUploadField
                    label="Milestone Screenshot or Photo"
                    value={activeMilestone.photoUrl || ''}
                    onChange={(newUrl) => {
                      onUpdateMilestone(activeMilestone.id, { photoUrl: newUrl });
                    }}
                    mediaType="image"
                    aspectRatio="video"
                    hint="Upload a blockout shot, sightline diagram, gameplay capture, or production milestone photo."
                  />

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">Photo Caption</label>
                    <input
                      type="text"
                      value={activeMilestone.photoCaption || ''}
                      onChange={(e) => {
                        onUpdateMilestone(activeMilestone.id, { photoCaption: e.target.value });
                      }}
                      placeholder="e.g. Asymmetric 3-lane combat topology with sightline buffers"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500 transition-colors"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingPhotoMilestoneId(null)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-xs font-sans transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 relative z-10 space-y-12">
        {/* Top Action Bar & Header Banner */}
        <div className="p-8 bg-zinc-950/90 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 print:border-none print:p-0">
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

        {/* INTERACTIVE CAREER TIMELINE WITH PHOTOS */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-red-500 uppercase tracking-widest font-semibold">
                CHRONOLOGICAL RECORD
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
                Interactive Career Timeline
              </h2>
              <p className="text-xs font-mono text-zinc-500 mt-1">
                Roles, core systems authored, level architecture, and milestone visual passes.
              </p>
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={handleAddNewMilestone}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors font-sans self-start sm:self-auto cursor-pointer shadow-sm shadow-red-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Career Milestone</span>
              </button>
            )}
          </div>

          {/* Timeline Nodes */}
          <div className="relative border-l-2 border-zinc-800 ml-4 sm:ml-6 pl-6 sm:pl-10 space-y-12">
            {milestones.map((milestone, idx) => (
              <div key={milestone.id} className="relative group">
                {/* Node marker with crimson red accent */}
                <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-5 h-5 rounded-full bg-zinc-950 border-2 border-red-500 flex items-center justify-center group-hover:scale-125 transition-transform duration-300 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                <div className="bg-zinc-950/85 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 shadow-xl hover:border-zinc-700 transition-all duration-300 space-y-6">
                  {/* Top Header of Milestone Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-900">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-semibold mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <EditableText
                          value={milestone.year}
                          onChange={(v) => onUpdateMilestone(milestone.id, { year: v })}
                          isOwner={isOwner}
                          label="Milestone Year"
                        />
                      </div>

                      <h3 className="text-xl sm:text-2xl font-display font-bold text-white">
                        <EditableText
                          value={milestone.role}
                          onChange={(v) => onUpdateMilestone(milestone.id, { role: v })}
                          isOwner={isOwner}
                          label="Milestone Role"
                          as="span"
                        />
                      </h3>

                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                        <EditableText
                          value={milestone.studio}
                          onChange={(v) => onUpdateMilestone(milestone.id, { studio: v })}
                          isOwner={isOwner}
                          label="Studio & Project"
                        />
                      </div>
                    </div>

                    {/* Owner controls for milestone */}
                    {isOwner && (
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button
                          type="button"
                          onClick={() => setEditingPhotoMilestoneId(milestone.id)}
                          className="px-2.5 py-1 text-[11px] font-mono text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Upload or change milestone photo"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{milestone.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteMilestone(milestone.id)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                          title="Delete milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Summary Narrative */}
                  <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                    <EditableText
                      value={milestone.description}
                      onChange={(v) => onUpdateMilestone(milestone.id, { description: v })}
                      isOwner={isOwner}
                      label="Milestone Narrative"
                      multiline={true}
                      as="span"
                    />
                  </p>

                  {/* Milestone Photo / Visual Capture */}
                  {milestone.photoUrl ? (
                    <div className="space-y-2">
                      <div
                        onClick={() =>
                          setSelectedImage({
                            url: milestone.photoUrl || '',
                            caption: milestone.photoCaption,
                          })
                        }
                        className="relative rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950 group/photo cursor-zoom-in max-h-72 aspect-video"
                      >
                        <img
                          src={milestone.photoUrl}
                          alt={milestone.photoCaption || milestone.role}
                          className="w-full h-full object-cover group-hover/photo:scale-102 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover/photo:opacity-40 transition-opacity" />

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-zinc-300">
                          <span className="truncate pr-2">{milestone.photoCaption || 'Click to expand capture'}</span>
                          <span className="p-1.5 rounded-lg bg-black/70 border border-zinc-700 text-white shrink-0">
                            <ZoomIn className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>

                      {isOwner && (
                        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 px-1">
                          <EditableText
                            value={milestone.photoCaption || 'Milestone capture caption'}
                            onChange={(v) => onUpdateMilestone(milestone.id, { photoCaption: v })}
                            isOwner={isOwner}
                            label="Photo Caption"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingPhotoMilestoneId(milestone.id)}
                            className="text-red-400 hover:underline cursor-pointer"
                          >
                            Edit Photo
                          </button>
                        </div>
                      )}
                    </div>
                  ) : isOwner ? (
                    <button
                      type="button"
                      onClick={() => setEditingPhotoMilestoneId(milestone.id)}
                      className="w-full py-6 border-2 border-dashed border-zinc-800 hover:border-red-500/60 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-white transition-all bg-zinc-900/30 cursor-pointer"
                    >
                      <ImageIcon className="w-5 h-5 text-red-500" />
                      <span className="text-xs font-mono">+ Upload Milestone Screenshot / Photo</span>
                    </button>
                  ) : null}

                  {/* Key Achievements Bullet Points */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                      KEY ACHIEVEMENTS & PRODUCTION METRICS
                    </div>

                    <ul className="space-y-2">
                      {milestone.achievements.map((ach, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-2.5 text-xs text-zinc-300 font-light leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                          <div className="flex-1">
                            <EditableText
                              value={ach}
                              onChange={(v) =>
                                handleUpdateAchievement(milestone.id, aIdx, v, milestone.achievements)
                              }
                              isOwner={isOwner}
                              label={`Achievement ${aIdx + 1}`}
                              multiline={true}
                              as="span"
                            />
                          </div>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteAchievement(milestone.id, aIdx, milestone.achievements)
                              }
                              className="text-zinc-600 hover:text-red-400 p-0.5"
                              title="Delete bullet"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleAddAchievement(milestone.id, milestone.achievements)}
                        className="text-[11px] font-mono text-red-400 hover:underline flex items-center gap-1 pt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Achievement Bullet</span>
                      </button>
                    )}
                  </div>

                  {/* Tech Stack Pills */}
                  <div className="pt-2 border-t border-zinc-900 flex flex-wrap gap-2">
                    {milestone.techStack.map((tech, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
