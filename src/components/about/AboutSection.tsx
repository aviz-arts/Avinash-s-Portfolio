import React from 'react';
import { Zap, Mail } from 'lucide-react';
import { OwnerProfile, SiteContent } from '../../utils/portfolioStorage';
import { EditableText } from '../common/EditableText';

interface AboutSectionProps {
  onOpenContact: () => void;
  profile?: OwnerProfile;
  siteContent?: SiteContent;
  isOwner?: boolean;
  onUpdateSiteContent?: (key: keyof SiteContent, value: string) => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  onOpenContact,
  profile,
  siteContent,
  isOwner = false,
  onUpdateSiteContent,
}) => {
  const tools = profile?.tools || [
    { category: 'Game Design & Mechanics', items: ['Core Gameplay Loops & Mechanics', 'Combat & Traversal Systems', 'Player Psychology & Motivation', 'Systems Balancing & Economies', 'Encounter & Boss Design'] },
    { category: 'Level Design & Architecture', items: ['3D Combat Blockouts & Greyboxing', 'Sightline & Chokepoint Theory', 'Pacing Curves & Tension Rhythms', 'Diegetic Navigation & Landmarks'] },
    { category: 'Lighting Art (Creative Passion)', items: ['Unreal Engine 5.4 Lumen & Nanite', 'Atmospheric & Volumetric Scattering', 'ACES Filmic Color Grading', 'Light-Driven Player Guidance'] },
    { category: 'Engines & Prototyping', items: ['Unreal Engine Blueprints', 'Unity C# Prototyping', 'Maya & Blender Greybox', 'Perforce & Git LFS'] },
  ];

  const email = siteContent?.contactEmail || profile?.email || 'aviz.arts@gmail.com';
  const kicker = siteContent?.aboutKicker || 'Profile · Dual Superpower · Design Philosophy';
  const headline = siteContent?.aboutHeadline || 'Game Designer by Profession · Lighting Artist by Passion';
  const lead = siteContent?.aboutLead ||
    'My profession is Game Design: crafting intuitive gameplay mechanics, systemic loops, combat pacing, and spatial architecture that make games unforgettable to play. My lifelong hobby and creative passion is real-time lighting art. This dual perspective allows me to design levels and mechanics where lighting is not an afterthought, but an active gameplay tool that guides, warns, and rewards the player.';
  const philosophyTitle = siteContent?.philosophyCardTitle || profile?.philosophyTitle || "The Game Designer's Edge";
  const philosophyText = siteContent?.philosophyCardText || profile?.philosophyText ||
    'When a Game Designer understands light transport, they do not need arbitrary floating objective arrows or artificial mini-map clutter. Contrast draws the crosshair, warmth signals safe recharge zones, silhouette breaks frame enemy weakpoints, and console frametimes remain protected because gameplay geometry and lighting budgets are planned together.';

  const stats = {
    shippedTitles: siteContent?.stat1Value || profile?.stats.shippedTitles || '4 Titles',
    shippedTitlesLabel: siteContent?.stat1Label || 'Shipped Commercial Releases',
    lumenFrametime: siteContent?.stat2Value || profile?.stats.lumenFrametime || '100% Core',
    lumenFrametimeLabel: siteContent?.stat2Label || 'Game Design & Mechanics Focus',
    experienceYears: siteContent?.stat3Value || profile?.stats.experienceYears || '7+ Years',
    experienceYearsLabel: siteContent?.stat3Label || 'Game Design & Systems Exp',
    shadowPasses: siteContent?.stat4Value || profile?.stats.shadowPasses || '60.0 FPS',
    shadowPassesLabel: siteContent?.stat4Label || 'Lumen Console Target (Passion)',
  };

  const handleUpdate = (key: keyof SiteContent, val: string) => {
    if (onUpdateSiteContent) {
      onUpdateSiteContent(key, val);
    }
  };

  return (
    <section id="about" className="py-20 border-t border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
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

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mt-3">
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

        {/* Studio Portrait & Philosophy & Capabilities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Column 1: Studio Portrait Card with Lighting Telemetry (lg:col-span-4) */}
          <div className="lg:col-span-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-950">
              <img
                src={siteContent?.avatarUrl || profile?.avatarUrl || '/assets/aistudio/pic_fe23a188.jpg'}
                alt="Avinash - Game Designer & Lighting Artist"
                className="w-full h-full object-cover object-top filter contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
              
              {/* Studio Telemetry Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[10px] font-mono text-zinc-300">
                  UE5.4 · Real-Time
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-red-950/80 backdrop-blur-md border border-red-500/40 text-[10px] font-mono text-red-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Available for Roles
                </span>
              </div>

              {/* Portrait Caption */}
              <div className="absolute bottom-4 left-4 right-4 text-xs font-mono">
                <div className="text-zinc-100 font-display font-bold text-base">
                  Avinash
                </div>
                <div className="text-red-400 text-[11px]">
                  Game Designer | Lighting Artist
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-zinc-800 space-y-3 bg-zinc-950/40">
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
                <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-zinc-500 text-[9px] uppercase">Profession</div>
                  <div className="text-zinc-200 font-semibold">Game Designer</div>
                </div>
                <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-zinc-500 text-[9px] uppercase">Creative Passion</div>
                  <div className="text-red-400 font-semibold">Lighting Artist</div>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Specialized in core gameplay loops, player psychology, and level architecture, elevated by lighting design to intuitively guide player navigation.
              </p>
            </div>
          </div>

          {/* Column 2: Creative Philosophy Card (lg:col-span-4) */}
          <div className="lg:col-span-4 p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500">
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
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                <EditableText
                  value={philosophyText}
                  onChange={(v) => handleUpdate('philosophyCardText', v)}
                  isOwner={isOwner}
                  label="Philosophy Prose"
                  multiline={true}
                  as="span"
                />
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-800/80">
              <div className="text-xs font-mono text-zinc-500">Primary Contact</div>
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
          </div>

          {/* Column 3: Engine Toolset Matrix (lg:col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {tools.map((group, idx) => (
              <div
                key={idx}
                className="p-5 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-3"
              >
                <div className="text-xs font-mono font-semibold text-zinc-200 pb-2 border-b border-zinc-800 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>{group.category}</span>
                </div>
                <ul className="space-y-2">
                  {group.items.map((item, i) => (
                    <li key={i} className="text-xs text-zinc-400 flex items-center gap-2">
                      <span className="text-zinc-600">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Quantifiable Track Record Strip */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl">
          <div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-white tabular-nums">
              <EditableText
                value={stats.shippedTitles}
                onChange={(v) => handleUpdate('stat1Value', v)}
                isOwner={isOwner}
                label="Metric 1 Value"
                as="span"
              />
            </div>
            <div className="text-xs font-mono text-zinc-400 mt-1">
              <EditableText
                value={stats.shippedTitlesLabel}
                onChange={(v) => handleUpdate('stat1Label', v)}
                isOwner={isOwner}
                label="Metric 1 Label"
                as="span"
              />
            </div>
            <div className="text-[11px] text-zinc-500">PC, PS5, Xbox Series X</div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-red-500 tabular-nums">
              <EditableText
                value={stats.lumenFrametime}
                onChange={(v) => handleUpdate('stat2Value', v)}
                isOwner={isOwner}
                label="Metric 2 Value"
                as="span"
              />
            </div>
            <div className="text-xs font-mono text-zinc-400 mt-1">
              <EditableText
                value={stats.lumenFrametimeLabel}
                onChange={(v) => handleUpdate('stat2Label', v)}
                isOwner={isOwner}
                label="Metric 2 Label"
                as="span"
              />
            </div>
            <div className="text-[11px] text-zinc-500">Strict &lt; 16.6ms console target</div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-white tabular-nums">
              <EditableText
                value={stats.experienceYears}
                onChange={(v) => handleUpdate('stat3Value', v)}
                isOwner={isOwner}
                label="Metric 3 Value"
                as="span"
              />
            </div>
            <div className="text-xs font-mono text-zinc-400 mt-1">
              <EditableText
                value={stats.experienceYearsLabel}
                onChange={(v) => handleUpdate('stat3Label', v)}
                isOwner={isOwner}
                label="Metric 3 Label"
                as="span"
              />
            </div>
            <div className="text-[11px] text-zinc-500">AAA & Award-Winning Indie</div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-white tabular-nums">
              <EditableText
                value={stats.shadowPasses}
                onChange={(v) => handleUpdate('stat4Value', v)}
                isOwner={isOwner}
                label="Metric 4 Value"
                as="span"
              />
            </div>
            <div className="text-xs font-mono text-zinc-400 mt-1">
              <EditableText
                value={stats.shadowPassesLabel}
                onChange={(v) => handleUpdate('stat4Label', v)}
                isOwner={isOwner}
                label="Metric 4 Label"
                as="span"
              />
            </div>
            <div className="text-[11px] text-zinc-500">Optimized virtual shadow pages</div>
          </div>
        </div>
      </div>
    </section>
  );
};
