import React, { useState } from 'react';
import {
  Calendar,
  Building2,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  ZoomIn,
  X,
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
}

export const CareerTimeline: React.FC<CareerTimelineProps> = ({
  milestones,
  isOwner = false,
  onUpdateMilestone,
  onCreateMilestone,
  onDeleteMilestone,
}) => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption?: string } | null>(null);
  const [editingPhotoMilestoneId, setEditingPhotoMilestoneId] = useState<string | null>(null);

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

  if (milestones.length === 0 && !isOwner) {
    return null;
  }

  return (
    <div id="career-timeline" className="pt-10 border-t border-zinc-800/80 space-y-8 scroll-mt-20">
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
                    hint="Upload a blockout shot, sightline diagram, gameplay capture, or production milestone photo."
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

                  <div className="flex justify-end pt-2">
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

      {/* Timeline Nodes or Empty Owner Prompt */}
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
        <div className="relative border-l-2 border-zinc-800 ml-2 sm:ml-6 pl-5 sm:pl-10 space-y-8 sm:space-y-10">
        {milestones.map((milestone) => (
          <div key={milestone.id} className="relative group">
            {/* Node marker with crimson red accent */}
            <div className="absolute -left-[31px] sm:-left-[51px] top-1.5 w-5 h-5 rounded-full bg-zinc-950 border-2 border-red-500 flex items-center justify-center group-hover:scale-125 transition-transform duration-300 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
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
                      <span className="truncate pr-2">
                        {milestone.photoCaption || 'Click to expand capture'}
                      </span>
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
                    onClick={() => handleAddAchievement(milestone.id, milestone.achievements)}
                    className="text-[11px] font-mono text-red-400 hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Achievement Bullet</span>
                  </button>
                )}
              </div>

              {/* Tech Stack Tags */}
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
      )}
    </div>
  );
};
