import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Building2,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ResumeMilestone } from '../../utils/portfolioStorage';
import { EditableText } from '../common/EditableText';
import { MediaUploadField } from '../common/MediaUploadField';

interface CareerTimelineProps {
  milestones: ResumeMilestone[];
  isOwner?: boolean;
  onUpdateMilestone: (id: string, updated: Partial<ResumeMilestone>) => void;
  onCreateMilestone: (milestone: ResumeMilestone) => void;
  onDeleteMilestone: (id: string) => void;
  onRemoveSection?: () => void;
}

export const CareerTimeline: React.FC<CareerTimelineProps> = ({
  milestones,
  isOwner = false,
  onUpdateMilestone,
  onCreateMilestone,
  onDeleteMilestone,
  onRemoveSection,
}) => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption?: string } | null>(null);
  const [editingPhotoMilestoneId, setEditingPhotoMilestoneId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'interactive' | 'all'>('interactive');
  const [newTagDrafts, setNewTagDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (milestones.length === 0) {
      setActiveIndex(0);
    } else if (activeIndex >= milestones.length) {
      setActiveIndex(milestones.length - 1);
    }
  }, [milestones.length, activeIndex]);

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
      photoUrl:
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      photoCaption: 'Mechanics blockout & sightline analysis pass',
    };
    onCreateMilestone(newMilestone);
    setActiveIndex(0);
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

  const handleAddTechTag = (milestoneId: string, currentStack: string[]) => {
    const draft = (newTagDrafts[milestoneId] || '').trim();
    if (!draft) return;
    onUpdateMilestone(milestoneId, { techStack: [...currentStack, draft] });
    setNewTagDrafts((prev) => ({ ...prev, [milestoneId]: '' }));
  };

  const handleDeleteTechTag = (milestoneId: string, index: number, currentStack: string[]) => {
    onUpdateMilestone(milestoneId, {
      techStack: currentStack.filter((_, i) => i !== index),
    });
  };

  if (milestones.length === 0 && !isOwner) {
    return null;
  }

  const visibleMilestones =
    viewMode === 'interactive' && milestones.length > 0
      ? [milestones[Math.min(activeIndex, milestones.length - 1)]]
      : milestones;

  const progressPercent =
    milestones.length <= 1 ? 100 : (activeIndex / (milestones.length - 1)) * 100;

  return (
    <div id="career-timeline" className="pt-10 border-t border-zinc-800/80 space-y-6 scroll-mt-20">
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
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/80 text-zinc-300 hover:text-white border border-zinc-700 hover:bg-zinc-800 transition-colors cursor-pointer"
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
                <h3 className="text-base font-display font-bold text-white">
                  Upload Milestone Photo / Screenshot
                </h3>
              </div>
              <button
                onClick={() => setEditingPhotoMilestoneId(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
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
                    hint="Displayed on the left beside the milestone description."
                  />

                  <div>
                    <label className="block text-xs font-mono text-zinc-400 mb-1">
                      Photo Caption
                    </label>
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

                  <div className="flex justify-between items-center pt-2">
                    {activeMilestone.photoUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateMilestone(activeMilestone.id, { photoUrl: '', photoCaption: '' });
                          setEditingPhotoMilestoneId(null);
                        }}
                        className="px-3 py-1.5 text-xs font-mono text-red-400 hover:text-red-300 bg-red-950/40 border border-red-900/50 rounded-lg cursor-pointer"
                      >
                        Remove Photo
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingPhotoMilestoneId(null)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-xs font-sans transition-colors cursor-pointer"
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

      {/* Header & View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-red-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CHRONOLOGICAL RECORD</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mt-1">
            Interactive Career Timeline
          </h2>
          <p className="text-xs font-mono text-zinc-500 mt-1">
            Select any milestone node along the track below to inspect visuals and core systems.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {milestones.length > 1 && (
            <div className="flex items-center p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs font-mono">
              <button
                type="button"
                onClick={() => setViewMode('interactive')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'interactive'
                    ? 'bg-red-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Interactive Focus
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'all'
                    ? 'bg-red-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Eras ({milestones.length})</span>
              </button>
            </div>
          )}

          {isOwner && (
            <>
              <button
                type="button"
                onClick={handleAddNewMilestone}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 transition-colors font-sans cursor-pointer shadow-sm shadow-red-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Milestone</span>
              </button>
              {onRemoveSection && (
                <button
                  type="button"
                  onClick={onRemoveSection}
                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Remove Timeline section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Section</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Interactive Chronological Track Selector */}
      {milestones.length > 0 && (
        <div className="p-4 sm:p-5 bg-zinc-950/90 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-zinc-400">
              Era <span className="text-white font-bold">{activeIndex + 1}</span> of{' '}
              <span className="text-zinc-300">{milestones.length}</span>
              {viewMode === 'all' && <span className="text-zinc-500"> · Showing all cards</span>}
            </div>

            {milestones.length > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('interactive');
                    setActiveIndex((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={activeIndex === 0 && viewMode === 'interactive'}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-35 transition-colors cursor-pointer"
                  title="Previous era"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('interactive');
                    setActiveIndex((prev) => Math.min(milestones.length - 1, prev + 1));
                  }}
                  disabled={activeIndex === milestones.length - 1 && viewMode === 'interactive'}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 disabled:opacity-35 transition-colors cursor-pointer"
                  title="Next era"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive Track Bar + Clickable Nodes */}
          <div className="relative pt-1">
            {/* Progress Track Line on md+ */}
            <div className="hidden md:block absolute top-4 left-4 right-4 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div
              className="grid gap-3 relative z-10"
              style={{
                gridTemplateColumns: `repeat(${Math.min(Math.max(milestones.length, 1), 4)}, minmax(0, 1fr))`,
              }}
            >
              {milestones.map((m, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setActiveIndex(idx);
                      if (viewMode === 'all') {
                        document
                          .getElementById(`timeline-card-${m.id}`)
                          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-red-950/35 border-red-500/70 shadow-lg shadow-red-950/20'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 transition-transform ${
                          isActive
                            ? 'bg-red-500 scale-125 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                            : 'bg-zinc-600 group-hover:bg-zinc-400'
                        }`}
                      />
                      <span
                        className={`text-[11px] font-mono font-semibold truncate ${
                          isActive ? 'text-red-400' : 'text-zinc-400'
                        }`}
                      >
                        {m.year}
                      </span>
                    </div>
                    <div className="text-xs font-display font-semibold text-zinc-100 truncate">
                      {m.role}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">
                      {m.studio}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Milestone Cards (Photo Left, Wordings Right) */}
      {milestones.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-zinc-800 rounded-2xl text-center space-y-3">
          <p className="text-xs font-mono text-zinc-500">
            No career milestones yet. Add your first timeline entry.
          </p>
          {isOwner && (
            <button
              type="button"
              onClick={handleAddNewMilestone}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Career Milestone</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {visibleMilestones.map((milestone) => {
            const hasPhoto = Boolean(milestone.photoUrl);

            return (
              <div
                key={milestone.id}
                id={`timeline-card-${milestone.id}`}
                className="bg-zinc-950/85 border border-zinc-800/90 rounded-3xl p-5 sm:p-7 shadow-xl hover:border-zinc-700 transition-all duration-300"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* LEFT COLUMN: Milestone Photo */}
                  {hasPhoto && (
                    <div className="lg:col-span-5 flex flex-col gap-2">
                      <div
                        onClick={() =>
                          setSelectedImage({
                            url: milestone.photoUrl || '',
                            caption: milestone.photoCaption,
                          })
                        }
                        className="relative flex-1 min-h-[240px] lg:min-h-[320px] rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950 group/photo cursor-zoom-in"
                      >
                        <img
                          src={milestone.photoUrl}
                          alt={milestone.photoCaption || milestone.role}
                          className="w-full h-full object-cover group-hover/photo:scale-103 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 text-xs font-mono text-zinc-200">
                          <span className="truncate">
                            {milestone.photoCaption || 'Click to expand capture'}
                          </span>
                          <span className="p-1.5 rounded-lg bg-black/75 border border-zinc-700 text-white shrink-0">
                            <ZoomIn className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>

                      {isOwner && (
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 px-1">
                          <EditableText
                            value={milestone.photoCaption || 'Milestone capture caption'}
                            onChange={(v) => onUpdateMilestone(milestone.id, { photoCaption: v })}
                            isOwner={isOwner}
                            label="Photo Caption"
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingPhotoMilestoneId(milestone.id)}
                              className="text-red-400 hover:underline cursor-pointer"
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateMilestone(milestone.id, { photoUrl: '', photoCaption: '' })
                              }
                              className="text-zinc-500 hover:text-red-400 cursor-pointer"
                              title="Remove photo"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* RIGHT COLUMN: Wordings (Role, Studio, Narrative, Achievements & Stack) */}
                  <div
                    className={`${
                      hasPhoto ? 'lg:col-span-7' : 'lg:col-span-12'
                    } flex flex-col justify-between space-y-5`}
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-zinc-900">
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

                          <h3 className="text-xl sm:text-2xl font-display font-bold text-white leading-snug">
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

                        {isOwner && (
                          <div className="flex items-center gap-2 self-start shrink-0">
                            <button
                              type="button"
                              onClick={() => setEditingPhotoMilestoneId(milestone.id)}
                              className="px-2.5 py-1 text-[11px] font-mono text-red-400 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              title="Upload or change left-side milestone photo"
                            >
                              <Upload className="w-3 h-3" />
                              <span>{hasPhoto ? 'Photo' : '+ Add Photo'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteMilestone(milestone.id)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
                              title="Remove milestone"
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

                      {/* Key Achievements */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                          KEY ACHIEVEMENTS &amp; PRODUCTION METRICS
                        </div>

                        <ul className="space-y-2">
                          {milestone.achievements.map((ach, aIdx) => (
                            <li
                              key={aIdx}
                              className="flex items-start gap-2.5 text-xs text-zinc-300 font-light leading-relaxed"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                              <div className="flex-1">
                                <EditableText
                                  value={ach}
                                  onChange={(v) =>
                                    handleUpdateAchievement(
                                      milestone.id,
                                      aIdx,
                                      v,
                                      milestone.achievements
                                    )
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
                                    handleDeleteAchievement(
                                      milestone.id,
                                      aIdx,
                                      milestone.achievements
                                    )
                                  }
                                  className="text-zinc-600 hover:text-red-400 p-0.5 cursor-pointer"
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
                            onClick={() =>
                              handleAddAchievement(milestone.id, milestone.achievements)
                            }
                            className="text-[11px] font-mono text-red-400 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Achievement Bullet</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tech Stack Tags */}
                    <div className="pt-3 border-t border-zinc-900 flex flex-wrap items-center gap-2">
                      {milestone.techStack.map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 inline-flex items-center gap-1.5"
                        >
                          <span>{tech}</span>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteTechTag(milestone.id, tIdx, milestone.techStack)
                              }
                              className="text-zinc-600 hover:text-red-400 cursor-pointer"
                              title="Remove tag"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}

                      {isOwner && (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            value={newTagDrafts[milestone.id] || ''}
                            onChange={(e) =>
                              setNewTagDrafts((prev) => ({
                                ...prev,
                                [milestone.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTechTag(milestone.id, milestone.techStack);
                              }
                            }}
                            placeholder="+ Add tag"
                            className="w-24 px-2 py-1 rounded-lg bg-zinc-900/70 border border-zinc-800 text-[11px] font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500"
                          />
                          {(newTagDrafts[milestone.id] || '').trim() && (
                            <button
                              type="button"
                              onClick={() => handleAddTechTag(milestone.id, milestone.techStack)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-mono cursor-pointer"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
