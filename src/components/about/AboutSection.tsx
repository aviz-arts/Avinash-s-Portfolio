import React, { useState } from 'react';
import { Zap, Mail, Plus, Trash2, X } from 'lucide-react';
import {
  OwnerProfile,
  SiteContent,
  ResumeMilestone,
  StatCardItem,
  resolveAboutStats,
} from '../../utils/portfolioStorage';
import {
  getBalancedContainerClass,
  getBalancedItemSpanClass,
} from '../../utils/layoutHelpers';
import { EditableText } from '../common/EditableText';
import { CareerTimeline } from './CareerTimeline';

interface AboutSectionProps {
  onOpenContact: () => void;
  profile?: OwnerProfile;
  onUpdateProfile?: (updated: OwnerProfile) => void;
  siteContent?: SiteContent;
  isOwner?: boolean;
  onUpdateSiteContent?: (key: keyof SiteContent, value: any) => void;
  milestones?: ResumeMilestone[];
  onUpdateMilestone?: (id: string, updated: Partial<ResumeMilestone>) => void;
  onCreateMilestone?: (milestone: ResumeMilestone) => void;
  onDeleteMilestone?: (id: string) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  onOpenContact,
  profile,
  onUpdateProfile,
  siteContent,
  isOwner = false,
  onUpdateSiteContent,
  milestones = [],
  onUpdateMilestone,
  onCreateMilestone,
  onDeleteMilestone,
}) => {
  const [newSkillDrafts, setNewSkillDrafts] = useState<Record<number, string>>({});

  const defaultTools = [
    {
      category: 'Game Design & Mechanics',
      items: [
        'Core Gameplay Loops & Mechanics',
        'Combat & Traversal Systems',
        'Player Psychology & Motivation',
        'Systems Balancing & Economies',
        'Encounter & Boss Design',
      ],
    },
    {
      category: 'Level Design & Architecture',
      items: [
        '3D Combat Blockouts & Greyboxing',
        'Sightline & Chokepoint Theory',
        'Pacing Curves & Tension Rhythms',
        'Diegetic Navigation & Landmarks',
      ],
    },
    {
      category: 'Lighting Art (Creative Passion)',
      items: [
        'Unreal Engine 5.4 Lumen & Nanite',
        'Atmospheric & Volumetric Scattering',
        'ACES Filmic Color Grading',
        'Light-Driven Player Guidance',
      ],
    },
    {
      category: 'Engines & Prototyping',
      items: [
        'Unreal Engine Blueprints & C++',
        'Marmoset Toolbag 4 Look-Dev',
        'Maya & Blender Greybox',
        'Perforce & Git LFS',
      ],
    },
  ];

  const tools = profile?.tools ?? defaultTools;
  const statsList = resolveAboutStats(siteContent, profile);

  const showPortrait = siteContent?.aboutShowPortrait !== false;
  const showPhilosophy = siteContent?.aboutShowPhilosophy !== false;
  const showTools = siteContent?.aboutShowTools !== false && (tools.length > 0 || isOwner);
  const showStats = siteContent?.aboutShowStats !== false && (statsList.length > 0 || isOwner);
  const showTimeline = siteContent?.aboutShowTimeline !== false;

  const hasRightColumn = showPhilosophy || (siteContent?.aboutShowTools !== false && (tools.length > 0 || isOwner));

  const email = siteContent?.contactEmail || profile?.email || 'aviz.arts@gmail.com';
  const kicker = siteContent?.aboutKicker || 'Profile · Dual Superpower · Design Philosophy';
  const headline = siteContent?.aboutHeadline || 'Game Designer | Lighting Artist';
  const lead =
    siteContent?.aboutLead ||
    'My profession is Game Design: crafting intuitive gameplay mechanics, systemic loops, combat pacing, and spatial architecture that make games unforgettable to play. My lifelong hobby and creative passion is real-time lighting art. This dual perspective allows me to design levels and mechanics where lighting is not an afterthought, but an active gameplay tool that guides, warns, and rewards the player.';
  const philosophyTitle =
    siteContent?.philosophyCardTitle || profile?.philosophyTitle || "The Game Designer's Edge";
  const philosophyText =
    siteContent?.philosophyCardText ||
    profile?.philosophyText ||
    'When a Game Designer understands light transport, they do not need arbitrary floating objective arrows or artificial mini-map clutter. Contrast draws the crosshair, warmth signals safe recharge zones, silhouette breaks frame enemy weakpoints, and console frametimes remain protected because gameplay geometry and lighting budgets are planned together.';

  const handleUpdate = (key: keyof SiteContent, val: any) => {
    onUpdateSiteContent?.(key, val);
  };

  // Toolset Group & Skill Item handlers
  const handleAddToolGroup = () => {
    if (!profile || !onUpdateProfile) return;
    const nextTools = [
      ...tools,
      {
        category: 'New Specialization Group',
        items: ['System / Pipeline Capability'],
      },
    ];
    onUpdateProfile({ ...profile, tools: nextTools });
  };

  const handleDeleteToolGroup = (catIdx: number) => {
    if (!profile || !onUpdateProfile) return;
    const nextTools = tools.filter((_, idx) => idx !== catIdx);
    onUpdateProfile({ ...profile, tools: nextTools });
  };

  const handleRenameToolGroup = (catIdx: number, newName: string) => {
    if (!profile || !onUpdateProfile) return;
    const nextTools = tools.map((g, idx) =>
      idx === catIdx ? { ...g, category: newName } : g
    );
    onUpdateProfile({ ...profile, tools: nextTools });
  };

  const handleUpdateSkillItem = (catIdx: number, itemIdx: number, newVal: string) => {
    if (!profile || !onUpdateProfile) return;
    const nextTools = tools.map((g, idx) => {
      if (idx !== catIdx) return g;
      const nextItems = g.items.map((it, i) => (i === itemIdx ? newVal : it));
      return { ...g, items: nextItems };
    });
    onUpdateProfile({ ...profile, tools: nextTools });
  };

  const handleDeleteSkillItem = (catIdx: number, itemIdx: number) => {
    if (!profile || !onUpdateProfile) return;
    const nextTools = tools.map((g, idx) => {
      if (idx !== catIdx) return g;
      return { ...g, items: g.items.filter((_, i) => i !== itemIdx) };
    });
    onUpdateProfile({ ...profile, tools: nextTools });
  };

  const handleAddSkillItem = (catIdx: number) => {
    if (!profile || !onUpdateProfile) return;
    const draft = (newSkillDrafts[catIdx] || '').trim();
    if (!draft) return;
    const nextTools = tools.map((g, idx) => {
      if (idx !== catIdx) return g;
      return { ...g, items: [...g.items, draft] };
    });
    onUpdateProfile({ ...profile, tools: nextTools });
    setNewSkillDrafts((prev) => ({ ...prev, [catIdx]: '' }));
  };

  // About Stats handlers
  const handleAddStat = () => {
    const next: StatCardItem[] = [
      ...statsList,
      {
        id: `about-stat-${Date.now()}`,
        value: 'UE5.4',
        label: 'Custom Metric Label',
        detail: 'Production specification',
      },
    ];
    handleUpdate('aboutStats', next);
  };

  const handleUpdateStat = (id: string, patch: Partial<StatCardItem>) => {
    const next = statsList.map((st) => (st.id === id ? { ...st, ...patch } : st));
    handleUpdate('aboutStats', next);
  };

  const handleDeleteStat = (id: string) => {
    const next = statsList.filter((st) => st.id !== id);
    handleUpdate('aboutStats', next);
  };

  return (
    <section id="about" className="py-12 sm:py-16 border-t border-zinc-800/80">
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 space-y-10">
        {/* Section Header */}
        <div className="w-full">
          <div className="text-xs font-mono text-red-500 tracking-wider uppercase mb-2">
            <EditableText
              value={kicker}
              onChange={(v) => handleUpdate('aboutKicker', v)}
              isOwner={isOwner}
              label="About Kicker"
            />
          </div>

          <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-100 tracking-tight">
            <EditableText
              value={headline}
              onChange={(v) => handleUpdate('aboutHeadline', v)}
              isOwner={isOwner}
              label="About Headline"
              as="span"
            />
          </h2>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mt-3 text-justify">
            <EditableText
              value={lead}
              onChange={(v) => handleUpdate('aboutLead', v)}
              isOwner={isOwner}
              label="About Lead Copy"
              multiline={true}
              as="span"
            />
          </p>
        </div>

        {/* Adaptive Top Profile + Philosophy + Toolset Grid */}
        {(showPortrait || hasRightColumn) && (
          <div
            className={
              showPortrait && hasRightColumn
                ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch'
                : 'space-y-6'
            }
          >
            {/* Portrait Card */}
            {showPortrait && (
              <div
                className={`${
                  hasRightColumn ? 'lg:col-span-4 h-full flex flex-col' : 'max-w-md mx-auto'
                } relative group bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl`}
              >
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleUpdate('aboutShowPortrait', false)}
                    className="absolute top-3 right-3 z-20 p-1.5 rounded-lg bg-zinc-950/90 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove Portrait Card"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="relative aspect-[4/5] lg:aspect-auto lg:flex-1 lg:min-h-[340px] w-full overflow-hidden bg-zinc-950">
                  <img
                    src={
                      siteContent?.avatarUrl ||
                      profile?.avatarUrl ||
                      '/assets/aistudio/pic_fe23a188.jpg'
                    }
                    alt="Avinash - Game Designer & Lighting Artist"
                    className="w-full h-full object-cover object-top filter contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/15 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 text-xs font-mono">
                    <div className="text-zinc-100 font-display font-bold text-base">
                      <EditableText
                        value={siteContent?.aboutPortraitName || profile?.name || 'Avinash'}
                        onChange={(v) => handleUpdate('aboutPortraitName', v)}
                        isOwner={isOwner}
                        label="Portrait Name"
                        as="span"
                      />
                    </div>
                    <div className="text-red-400 text-[11px]">
                      <EditableText
                        value={siteContent?.aboutPortraitTitle || profile?.title || 'Game Designer | Lighting Artist'}
                        onChange={(v) => handleUpdate('aboutPortraitTitle', v)}
                        isOwner={isOwner}
                        label="Portrait Role"
                        as="span"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-zinc-800 space-y-3 bg-zinc-950/40 shrink-0">
                  <div className="grid grid-cols-2 gap-2.5 text-[11px] font-mono text-zinc-400">
                    <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                      <div className="text-zinc-500 text-[9px] uppercase">
                        <EditableText
                          value={siteContent?.aboutPortraitProfessionLabel || 'Profession'}
                          onChange={(v) => handleUpdate('aboutPortraitProfessionLabel', v)}
                          isOwner={isOwner}
                          label="Profession Label"
                          as="span"
                        />
                      </div>
                      <div className="text-zinc-200 font-semibold mt-0.5">
                        <EditableText
                          value={siteContent?.aboutPortraitProfessionValue || 'Game Designer'}
                          onChange={(v) => handleUpdate('aboutPortraitProfessionValue', v)}
                          isOwner={isOwner}
                          label="Profession Value"
                          as="span"
                        />
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                      <div className="text-zinc-500 text-[9px] uppercase">
                        <EditableText
                          value={siteContent?.aboutPortraitPassionLabel || 'Creative Passion'}
                          onChange={(v) => handleUpdate('aboutPortraitPassionLabel', v)}
                          isOwner={isOwner}
                          label="Creative Passion Label"
                          as="span"
                        />
                      </div>
                      <div className="text-red-400 font-semibold mt-0.5">
                        <EditableText
                          value={siteContent?.aboutPortraitPassionValue || 'Lighting Artist'}
                          onChange={(v) => handleUpdate('aboutPortraitPassionValue', v)}
                          isOwner={isOwner}
                          label="Creative Passion Value"
                          as="span"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed text-justify">
                    <EditableText
                      value={
                        siteContent?.aboutPortraitSummary ||
                        'Specialized in core gameplay loops, player psychology, and level architecture, elevated by lighting design to intuitively guide player navigation.'
                      }
                      onChange={(v) => handleUpdate('aboutPortraitSummary', v)}
                      isOwner={isOwner}
                      label="Portrait Summary"
                      multiline={true}
                      as="span"
                    />
                  </p>
                </div>
              </div>
            )}

            {/* Philosophy Card + Auto-Aligned Toolset Matrix */}
            {hasRightColumn && (
              <div
                className={`${showPortrait ? 'lg:col-span-8 h-full' : 'w-full'} flex flex-col gap-6`}
              >
                {showPhilosophy && (
                  <div
                    className={`relative group p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4 ${
                      !showTools ? 'flex-1 flex flex-col justify-between' : ''
                    }`}
                  >
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleUpdate('aboutShowPhilosophy', false)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-950/90 hover:bg-red-950 text-zinc-400 hover:text-red-400 border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove Philosophy Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500 shrink-0">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-display font-semibold text-zinc-100">
                        <EditableText
                          value={philosophyTitle}
                          onChange={(v) => handleUpdate('philosophyCardTitle', v)}
                          isOwner={isOwner}
                          label="Philosophy Title"
                          as="span"
                        />
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed text-justify">
                      <EditableText
                        value={philosophyText}
                        onChange={(v) => handleUpdate('philosophyCardText', v)}
                        isOwner={isOwner}
                        label="Philosophy Prose"
                        multiline={true}
                        as="span"
                      />
                    </p>

                    <div className="pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                          <EditableText
                            value={siteContent?.aboutPrimaryContactLabel || 'Primary Contact'}
                            onChange={(v) => handleUpdate('aboutPrimaryContactLabel', v)}
                            isOwner={isOwner}
                            label="Primary Contact Label"
                            as="span"
                          />
                        </div>
                        <a
                          href={`mailto:${email}`}
                          className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 mt-1"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <EditableText
                            value={email}
                            onChange={(v) => handleUpdate('contactEmail', v)}
                            isOwner={isOwner}
                            label="Contact Email"
                            as="span"
                          />
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={onOpenContact}
                        className="px-3.5 py-2 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 rounded-xl text-xs font-mono transition-colors cursor-pointer"
                      >
                        Open Contact Form
                      </button>
                    </div>
                  </div>
                )}

                {/* Engine & Discipline Toolset Matrix */}
                {showTools && (
                  <div className="flex-1 flex flex-col gap-4">
                    {isOwner && (
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                        <span className="text-zinc-500 uppercase tracking-wider text-[11px]">
                          Disciplines &amp; Toolset ({tools.length})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleAddToolGroup}
                            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Tool Group</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate('aboutShowTools', false)}
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                            title="Remove Toolset Section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Section</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {tools.length > 0 && (
                      <div className={`flex-1 ${getBalancedContainerClass(tools.length, 'tools')}`}>
                        {tools.map((group, idx) => (
                          <div
                            key={`${group.category}-${idx}`}
                            className={`${getBalancedItemSpanClass(idx, tools.length, 'tools')} group relative p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-3 h-full flex flex-col`}
                          >
                            {isOwner && (
                              <button
                                type="button"
                                onClick={() => handleDeleteToolGroup(idx)}
                                className="absolute top-3.5 right-3.5 p-1 text-zinc-500 hover:text-red-400 bg-zinc-950/80 border border-zinc-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Remove tool group"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <div className="text-xs font-mono font-semibold text-zinc-200 pb-2 border-b border-zinc-800 flex items-center gap-2 pr-6">
                              <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                              <EditableText
                                value={group.category}
                                onChange={(val) => handleRenameToolGroup(idx, val)}
                                isOwner={isOwner}
                                label="Tool Category"
                                as="span"
                              />
                            </div>

                            <ul className="space-y-1.5 flex-1">
                              {group.items.map((item, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-zinc-400 flex items-start justify-between gap-2 leading-relaxed"
                                >
                                  <div className="flex items-start gap-2 flex-1">
                                    <span className="text-zinc-600 mt-0.5">·</span>
                                    <EditableText
                                      value={item}
                                      onChange={(val) => handleUpdateSkillItem(idx, i, val)}
                                      isOwner={isOwner}
                                      label="Skill Item"
                                      as="span"
                                    />
                                  </div>
                                  {isOwner && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSkillItem(idx, i)}
                                      className="text-zinc-600 hover:text-red-400 p-0.5 shrink-0 cursor-pointer"
                                      title="Remove skill"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>

                            {isOwner && (
                              <div className="pt-2 border-t border-zinc-800/60 flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={newSkillDrafts[idx] || ''}
                                  onChange={(e) =>
                                    setNewSkillDrafts((prev) => ({
                                      ...prev,
                                      [idx]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddSkillItem(idx);
                                    }
                                  }}
                                  placeholder="+ Add skill..."
                                  className="flex-1 px-2 py-1 bg-zinc-950/70 border border-zinc-800 rounded text-[11px] font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500"
                                />
                                {(newSkillDrafts[idx] || '').trim() && (
                                  <button
                                    type="button"
                                    onClick={() => handleAddSkillItem(idx)}
                                    className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-mono cursor-pointer"
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quantifiable Track Record Strip (Dynamic Sub-Sections with Add / Remove & Auto-Align) */}
        {showStats && (
          <div className="space-y-3">
            {isOwner && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-zinc-500 uppercase tracking-wider text-[11px]">
                  Track Record Metrics ({statsList.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddStat}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Stat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdate('aboutShowStats', false)}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Remove Track Record Strip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Strip</span>
                  </button>
                </div>
              </div>
            )}

            {statsList.length > 0 && (
              <div
                className={`${getBalancedContainerClass(
                  statsList.length,
                  'stats'
                )} p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl`}
              >
                {statsList.map((st, idx) => (
                  <div
                    key={st.id}
                    className={`${getBalancedItemSpanClass(idx, statsList.length, 'stats')} group relative pr-5`}
                  >
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeleteStat(st.id)}
                        className="absolute top-0 right-0 p-1 text-zinc-500 hover:text-red-400 bg-zinc-950/80 border border-zinc-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title="Remove metric"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    <div
                      className={`text-2xl sm:text-3xl font-display font-bold tabular-nums ${
                        st.highlight || idx === 1 ? 'text-red-500' : 'text-white'
                      }`}
                    >
                      <EditableText
                        value={st.value}
                        onChange={(v) => handleUpdateStat(st.id, { value: v })}
                        isOwner={isOwner}
                        label="Metric Value"
                        as="span"
                      />
                    </div>
                    <div className="text-xs font-mono text-zinc-400 mt-1">
                      <EditableText
                        value={st.label}
                        onChange={(v) => handleUpdateStat(st.id, { label: v })}
                        isOwner={isOwner}
                        label="Metric Label"
                        as="span"
                      />
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      <EditableText
                        value={st.detail || ''}
                        onChange={(v) => handleUpdateStat(st.id, { detail: v })}
                        isOwner={isOwner}
                        label="Metric Detail"
                        as="span"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Interactive Career Timeline (Photo Left, Wordings Right) */}
        {showTimeline && onUpdateMilestone && onCreateMilestone && onDeleteMilestone && (
          <CareerTimeline
            milestones={milestones}
            isOwner={isOwner}
            siteContent={siteContent}
            onUpdateSiteContent={onUpdateSiteContent}
            onUpdateMilestone={onUpdateMilestone}
            onCreateMilestone={onCreateMilestone}
            onDeleteMilestone={onDeleteMilestone}
            onRemoveSection={
              isOwner ? () => handleUpdate('aboutShowTimeline', false) : undefined
            }
          />
        )}
      </div>
    </section>
  );
};
