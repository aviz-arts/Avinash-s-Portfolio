import React, { useState } from 'react';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Briefcase,
  Award,
  Sparkles,
  ExternalLink,
  Mail,
  Compass,
  Zap,
} from 'lucide-react';
import { OwnerProfile } from '../../utils/portfolioStorage';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContact: () => void;
  profile?: OwnerProfile;
}

export const ResumeModal: React.FC<ResumeModalProps> = ({
  isOpen,
  onClose,
  onOpenContact,
  profile,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const resumeText = `
AVINASH
Game Designer | Lighting Artist
Email: ${profile?.email || 'aviz.arts@gmail.com'}
Specialization: Gameplay Systems, Core Mechanics Loops, Level Architecture, UE5 Lumen / Unity HDRP

SUMMARY:
${profile?.leadCopy || 'Professional Game Designer specializing in core gameplay loops, mechanics, player pacing, and level architecture — powered by a lifelong hobby and passion for real-time lighting and cinematic atmosphere.'}

PRODUCTION TRACK RECORD:
- Shipped Commercial Titles: ${profile?.stats.shippedTitles || '4 Titles'} (PC, PS5, Xbox Series X)
- Core Focus: ${profile?.stats.lumenFrametime || '100% Core'} (Game Design & Mechanics)
- Industry Experience: ${profile?.stats.experienceYears || '7+ Years'} (AAA & Indie)
- Lighting Performance: ${profile?.stats.shadowPasses || '60.0 FPS'} (Lumen Console Budget)

WORK HISTORY:
1. Lead Game Designer & Systems Architect — Vertex Interactive (2022 - Present)
   - Architected responsive 5-verb parkour traversal system and combat pacing curves across 14+ game environments.
   - Designed asymmetric combat blockouts while leveraging dynamic lighting for diegetic, zero-HUD player guidance.

2. Senior Game & Level Designer — Foundry 42 Studios (2020 - 2022)
   - Engineered tournament tactical multiplayer arenas, cover calibrations (1.1m/2.0m), and 12-second rotation timings.
   - Applied physical lighting look-dev and ACES color grading to maximize gameplay readability.

3. Game Systems & Level Designer — Emberworks Games (2018 - 2020)
   - Authored 3D dungeon layouts and encounter zones using architectural landmarks for 94% unassisted player orientation.
   - Built Blueprint gameplay prototypes, enemy combat AI spacing, and resource risk/reward loops.

CORE TECHNICAL SKILLS:
- Game Design: Core Loops, Mechanics Prototyping, Player Psychology, Combat Pacing, System Economies
- Level Design: 3D Combat Blockouts, Sightline Calculation, Verticality Layers, Flow Topology
- Lighting (Passion): Unreal Engine 5.4 Lumen, VSM, Exponential Fog, Physical Camera Exposure, ACES
- Engines & Tools: Unreal Engine 5 (Blueprints/Sequencer), Unity (C# Prototyping), Maya, Blender, Perforce
`.trim();

    navigator.clipboard.writeText(resumeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200 print:p-0 print:bg-white">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:bg-white print:text-black print:shadow-none"
      >
        {/* Header Bar (Hidden during print) */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/60 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-red-500 uppercase tracking-wider">Curriculum Vitae</div>
              <h3 className="text-lg font-display font-bold text-zinc-100">
                {profile?.name || 'Avinash'} — Resume
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3 py-1.5 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5"
              title="Copy plain-text resume to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-red-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-mono bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm shadow-red-600/30"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              aria-label="Close resume"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Resume Content */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-8 text-zinc-300 print:text-black print:p-8">
          {/* Resume Identity Hero */}
          <div className="pb-6 border-b border-zinc-800 print:border-black flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-zinc-100 print:text-black tracking-tight">
                {profile?.name || 'Avinash'}
              </h1>
              <div className="text-red-500 print:text-red-700 font-mono text-sm sm:text-base font-semibold mt-1">
                {profile?.title || 'Game Designer | Lighting Artist'}
              </div>
              <div className="text-xs font-mono text-zinc-400 print:text-zinc-600 mt-2 flex flex-wrap items-center gap-3">
                <span>Specialization: Unreal Engine 5 (Lumen/Nanite) & Unity HDRP</span>
                <span>·</span>
                <span>Location: Remote / Open to Relocation</span>
              </div>
            </div>

            <div className="text-xs font-mono text-right sm:text-right space-y-1 print:text-left">
              <div>
                <a
                  href={`mailto:${profile?.email || 'aviz.arts@gmail.com'}`}
                  className="text-red-400 print:text-red-800 hover:underline"
                >
                  {profile?.email || 'aviz.arts@gmail.com'}
                </a>
              </div>
              <div className="text-zinc-500 print:text-zinc-600">Portfolio: aviz-portfolio.art</div>
            </div>
          </div>

          {/* Executive Summary */}
          <section className="space-y-2">
            <h2 className="text-xs font-mono uppercase tracking-widest text-red-500 print:text-red-700 font-bold">
              01. Executive Profile
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 print:text-zinc-800 leading-relaxed">
              {profile?.leadCopy ||
                'Senior Game Designer and Lighting Artist architecting spatial readability, combat pacing, and cinematic illumination. Bridging the gap between player psychology and physical light transport while guarding strict 60.0 FPS Lumen console performance budgets.'}
            </p>
          </section>

          {/* Key Production Benchmarks */}
          <section className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-red-500 print:text-red-700 font-bold">
              02. Shipped Production Metrics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-zinc-900/60 print:bg-zinc-100 border border-zinc-800 print:border-zinc-300 rounded-xl">
                <div className="text-lg font-mono font-bold text-white print:text-black">
                  {profile?.stats.shippedTitles || '4 Titles'}
                </div>
                <div className="text-[11px] text-zinc-400 print:text-zinc-600">Shipped Releases (PC, PS5, Xbox)</div>
              </div>

              <div className="p-3 bg-zinc-900/60 print:bg-zinc-100 border border-zinc-800 print:border-zinc-300 rounded-xl">
                <div className="text-lg font-mono font-bold text-red-500 print:text-red-700">
                  {profile?.stats.lumenFrametime || '60.0 FPS'}
                </div>
                <div className="text-[11px] text-zinc-400 print:text-zinc-600">Lumen Frametime Console Budget</div>
              </div>

              <div className="p-3 bg-zinc-900/60 print:bg-zinc-100 border border-zinc-800 print:border-zinc-300 rounded-xl">
                <div className="text-lg font-mono font-bold text-white print:text-black">
                  {profile?.stats.experienceYears || '7+ Years'}
                </div>
                <div className="text-[11px] text-zinc-400 print:text-zinc-600">Game Industry Experience</div>
              </div>

              <div className="p-3 bg-zinc-900/60 print:bg-zinc-100 border border-zinc-800 print:border-zinc-300 rounded-xl">
                <div className="text-lg font-mono font-bold text-white print:text-black">
                  {profile?.stats.shadowPasses || '14+ Passes'}
                </div>
                <div className="text-[11px] text-zinc-400 print:text-zinc-600">Custom Lighting Rigs & VSM</div>
              </div>
            </div>
          </section>

          {/* Professional Work History */}
          <section className="space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-widest text-red-500 print:text-red-700 font-bold">
              03. Professional Experience
            </h2>

            <div className="space-y-6">
              {/* Role 1 */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100 print:text-black font-display">
                    Lead Game Designer & Systems Architect
                  </h3>
                  <span className="text-xs font-mono text-zinc-400 print:text-zinc-600">2022 — Present</span>
                </div>
                <div className="text-xs font-mono text-zinc-300 print:text-zinc-800">
                  Vertex Interactive Studios · AAA Unannounced Sci-Fi Action Title
                </div>
                <ul className="list-disc list-inside text-xs text-zinc-400 print:text-zinc-700 space-y-1 pt-1">
                  <li>Architected responsive 5-verb parkour traversal system and combat encounter pacing curves across 14+ game environments.</li>
                  <li>Designed multiplayer blockout geometry with 45° sightline bevels and verticality layers, reducing player disorientation.</li>
                  <li>Harnessed lighting design passion to author diegetic wayfinding cues, eliminating mini-map dependency while maintaining 60 FPS console target.</li>
                </ul>
              </div>

              {/* Role 2 */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100 print:text-black font-display">
                    Senior Game & Level Designer
                  </h3>
                  <span className="text-xs font-mono text-zinc-400 print:text-zinc-600">2020 — 2022</span>
                </div>
                <div className="text-xs font-mono text-zinc-300 print:text-zinc-800">
                  Foundry 42 Studios · Tactical Shooter Title
                </div>
                <ul className="list-disc list-inside text-xs text-zinc-400 print:text-zinc-700 space-y-1 pt-1">
                  <li>Engineered tournament tactical multiplayer arenas, cover calibrations (1.1m/2.0m), and 12-second rotation timings with 50.4% balance.</li>
                  <li>Tuned weapon recoil curves, projectile velocity, and character hit reaction frames for responsive competitive game feel.</li>
                  <li>Conducted look-dev lighting experiments and ACES filmic color grading to maximize player target readability.</li>
                </ul>
              </div>

              {/* Role 3 */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                  <h3 className="text-sm font-semibold text-zinc-100 print:text-black font-display">
                    Game Systems & Level Designer
                  </h3>
                  <span className="text-xs font-mono text-zinc-400 print:text-zinc-600">2018 — 2020</span>
                </div>
                <div className="text-xs font-mono text-zinc-300 print:text-zinc-800">
                  Emberworks Games · Indie Action RPG
                </div>
                <ul className="list-disc list-inside text-xs text-zinc-400 print:text-zinc-700 space-y-1 pt-1">
                  <li>Structured 3D dungeon layouts and encounter zones using architectural landmarks for 94% unassisted player orientation.</li>
                  <li>Prototyped player combat verbs, AI spacing state machines, and consumable resource economies in Blueprints and C#.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Technical Skills Matrix */}
          <section className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-widest text-red-500 print:text-red-700 font-bold">
              04. Technical Competencies & DCC Tools
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-zinc-900/40 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl space-y-1.5">
                <div className="font-mono font-semibold text-zinc-200 print:text-black">Game Design & Mechanics</div>
                <div className="text-zinc-400 print:text-zinc-700">
                  Core Loops, Systems Balancing, Player Psychology, Combat Pacing, Traversal Feel, 3D Blockouts
                </div>
              </div>

              <div className="p-3.5 bg-zinc-900/40 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl space-y-1.5">
                <div className="font-mono font-semibold text-zinc-200 print:text-black">Lighting Art (Passion) & Engines</div>
                <div className="text-zinc-400 print:text-zinc-700">
                  Unreal Engine 5.4 (Lumen, Nanite, Blueprints, Sequencer), Unity HDRP, VSM, ACES Color Grading
                </div>
              </div>

              <div className="p-3.5 bg-zinc-900/40 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl space-y-1.5">
                <div className="font-mono font-semibold text-zinc-200 print:text-black">Lighting & Color Science</div>
                <div className="text-zinc-400 print:text-zinc-700">
                  Virtual Shadow Maps (VSM), ACES Filmic Tone Curve, Volumetric Exponential Fog, PBR Energy Conservation
                </div>
              </div>

              <div className="p-3.5 bg-zinc-900/40 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl space-y-1.5">
                <div className="font-mono font-semibold text-zinc-200 print:text-black">Level Architecture & Systems</div>
                <div className="text-zinc-400 print:text-zinc-700">
                  Combat Greybox Blockouts, Sightline Analysis, Player Pacing, Elevation Flow, Focal Landmarks
                </div>
              </div>

              <div className="p-3.5 bg-zinc-900/40 print:bg-zinc-50 border border-zinc-800 print:border-zinc-300 rounded-xl space-y-1.5">
                <div className="font-mono font-semibold text-zinc-200 print:text-black">DCC Tools & Source Control</div>
                <div className="text-zinc-400 print:text-zinc-700">
                  Maya, Blender, Substance 3D Painter & Designer, Marmoset Toolbag 4, Perforce, Git LFS
                </div>
              </div>
            </div>
          </section>

          {/* Education & Accreditations */}
          <section className="space-y-2 pt-2 border-t border-zinc-800 print:border-zinc-300">
            <h2 className="text-xs font-mono uppercase tracking-widest text-red-500 print:text-red-700 font-bold">
              05. Education & Certifications
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-zinc-200 print:text-black">Bachelor of Science in Game Design & Interactive Environments</span>
                <span className="text-zinc-500 print:text-zinc-600"> — Honors Graduate</span>
              </div>
              <span className="font-mono text-zinc-400 print:text-zinc-600 mt-0.5 sm:mt-0">Epic Games Unreal Engine 5 Specialist</span>
            </div>
          </section>
        </div>

        {/* Modal Footer (Hidden in Print) */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="text-xs font-mono text-zinc-500">
            Available for Lead Level Design & Lighting Art Opportunities
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenContact();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-xs transition-colors font-sans shadow-sm shadow-red-600/30"
            >
              Contact Avinash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
