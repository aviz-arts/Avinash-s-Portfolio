import React, { useState, useEffect } from 'react';
import { ProjectItem } from '../../types/portfolio';
import { CinematicVideoPlayer } from './CinematicVideoPlayer';
import { LightingComparisonSlider } from './LightingComparisonSlider';
import {
  X,
  Play,
  Sliders,
  Compass,
  Zap,
  Layers,
  ArrowRight,
  Maximize2,
  Box,
  CheckCircle2,
  Edit3,
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  onClose: () => void;
  onOpenInStudio: (sceneStyle: 'cyberpunk' | 'crypt' | 'turret') => void;
  isOwner?: boolean;
  onEdit?: (project: ProjectItem) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onOpenInStudio,
  isOwner,
  onEdit,
}) => {
  const [viewMode, setViewMode] = useState<'video' | 'slider' | 'passes'>('video');

  useEffect(() => {
    if (!project) return;
    setViewMode(project.heroType === 'video' ? 'video' : 'slider');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, onClose]);

  if (!project) return null;

  const studioSceneMap: Record<string, 'cyberpunk' | 'crypt' | 'turret'> = {
    cyberpunk: 'cyberpunk',
    crypt: 'crypt',
    turret: 'turret',
    scifi: 'cyberpunk',
    derelict: 'cyberpunk',
    ruins: 'crypt',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/60 shrink-0">
          <div>
            {/* Unboxed Metadata */}
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span className="text-red-500">{project.role}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>{project.engine}</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>{project.year}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-zinc-100 mt-0.5">
              {project.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {isOwner && onEdit && (
              <button
                onClick={() => {
                  onEdit(project);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors shadow-sm shadow-red-600/30"
                title="Edit this project"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Project</span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenInStudio(studioSceneMap[project.dummySceneStyle] || 'cyberpunk');
                onClose();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-lg transition-colors"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Launch in 3D Lab</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-zinc-300">
          {/* Media Inspection Viewport */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              {/* Media Mode Tabs */}
              <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setViewMode('video')}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-colors flex items-center gap-1.5 ${
                    viewMode === 'video'
                      ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-600/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Cinematic Reel</span>
                </button>
                <button
                  onClick={() => setViewMode('slider')}
                  className={`px-3 py-1 text-xs font-mono rounded-md transition-colors flex items-center gap-1.5 ${
                    viewMode === 'slider'
                      ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-600/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sliders className="w-3 h-3" />
                  <span>A/B Split Slider</span>
                </button>

                {project.customImageUrl && (
                  <button
                    onClick={() => setViewMode('image' as any)}
                    className={`px-3 py-1 text-xs font-mono rounded-md transition-colors flex items-center gap-1.5 ${
                      viewMode === ('image' as any)
                        ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-600/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Compass className="w-3 h-3" />
                    <span>Uploaded Artwork</span>
                  </button>
                )}
              </div>

              <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                Interactive real-time preview · 60 FPS
              </span>
            </div>

            {/* Selected Media Player */}
            {viewMode === ('image' as any) && project.customImageUrl ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800">
                <img
                  src={project.customImageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : viewMode === 'video' ? (
              <CinematicVideoPlayer
                style={project.dummySceneStyle}
                title={project.title}
                duration={project.videoDuration || '0:42'}
                autoPlay={true}
                videoUrl={project.customVideoUrl}
                posterUrl={project.customImageUrl}
              />
            ) : (
              <LightingComparisonSlider
                style={project.dummySceneStyle}
                leftPass="clay"
                rightPass="final"
                leftLabel="Lighting Only (Clay)"
                rightLabel="Final Composition (Lumen)"
                leftImageUrl={project.comparisonLeftUrl}
                rightImageUrl={project.comparisonRightUrl}
              />
            )}
          </div>

          {/* Key Metrics Strip (Tabular Numerals) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {project.metrics.map((metric, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl"
              >
                <div className="text-[11px] font-mono text-zinc-400">{metric.label}</div>
                <div className="text-lg font-mono font-bold text-white tabular-nums mt-0.5">
                  {metric.value}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{metric.detail}</div>
              </div>
            ))}
          </div>

          {/* Architectural Design Breakdown: 2-Column Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Left Column: Creative Intent & Game Design Mechanics */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-mono text-red-500 uppercase tracking-wider">
                  01. Creative Intent & Player Experience
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed mt-1.5">
                  {project.creativeIntent}
                </p>
              </div>

              {/* Game Design Systems & Mechanics Breakdown */}
              {project.gameplayDesign && (
                <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-red-500" />
                    <span>02. Core Game Design & Mechanics Loop</span>
                  </h4>

                  {project.gameplayDesign.coreLoop && (
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase">Core Loop:</span>
                      <p className="text-xs font-mono text-zinc-100 mt-0.5 bg-black/60 p-2.5 rounded-lg border border-zinc-800 leading-relaxed">
                        {project.gameplayDesign.coreLoop}
                      </p>
                    </div>
                  )}

                  {project.gameplayDesign.playerVerbs && (
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase">Player Action Verbs:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {project.gameplayDesign.playerVerbs.map((verb, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-700 text-[11px] font-mono text-zinc-200"
                          >
                            {verb}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {project.gameplayDesign.progressionEconomy && (
                    <div className="text-xs">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase">Economy & Constraints:</span>
                      <p className="text-xs text-zinc-300 mt-0.5">{project.gameplayDesign.progressionEconomy}</p>
                    </div>
                  )}

                  {project.gameplayDesign.feelAndJuice && (
                    <div className="text-xs">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase">Game Feel & Juice:</span>
                      <p className="text-xs text-zinc-300 mt-0.5">{project.gameplayDesign.feelAndJuice}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className="text-xs font-mono text-red-500 uppercase tracking-wider">
                  03. Technical Challenge & Envelope
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed mt-1.5">
                  {project.technicalChallenge}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-mono text-red-500 uppercase tracking-wider">
                  04. Technical & Design Solution
                </h4>
                <p className="text-sm text-zinc-300 leading-relaxed mt-1.5">
                  {project.solution}
                </p>
              </div>
            </div>

            {/* Right Column: Lighting Rig Specifications & Level Topology */}
            <div className="space-y-4">
              {/* Lighting Setup Specs */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                <h4 className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-red-500" />
                  <span>Cinematic Lighting Rig Breakdown</span>
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between pb-1.5 border-b border-zinc-800">
                    <span className="text-zinc-500">Key Light:</span>
                    <span className="text-zinc-300 text-right">{project.lightingSetup.keyLight}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-zinc-800">
                    <span className="text-zinc-500">Fill / Indirect:</span>
                    <span className="text-zinc-300 text-right">{project.lightingSetup.fillBounce}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-zinc-800">
                    <span className="text-zinc-500">Volumetric Fog:</span>
                    <span className="text-zinc-300 text-right">{project.lightingSetup.volumetricFog}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-zinc-800">
                    <span className="text-zinc-500">Exposure:</span>
                    <span className="text-zinc-300">{project.lightingSetup.exposureEV}</span>
                  </div>

                  {/* Palette Swatches */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-500">Color Palette:</span>
                    <div className="flex items-center gap-1.5">
                      {project.lightingSetup.colorPalette.map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded border border-zinc-700"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Level Design Blockout Data (if available) */}
              {project.levelDesign && (
                <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                  <h4 className="text-xs font-mono font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-zinc-200" />
                    <span>Level Geometry & Player Flow</span>
                  </h4>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between pb-1.5 border-b border-zinc-800">
                      <span className="text-zinc-500">Flow Topology:</span>
                      <span className="text-zinc-300 text-right">{project.levelDesign.flowTopology}</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-zinc-800">
                      <span className="text-zinc-500">Sightlines:</span>
                      <span className="text-zinc-300 text-right max-w-[240px] truncate">{project.levelDesign.sightlines}</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-zinc-800">
                      <span className="text-zinc-500">Verticality:</span>
                      <span className="text-zinc-300">{project.levelDesign.verticalityLayers} Distinct Layers</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Combat Encounters:</span>
                      <span className="text-zinc-300">{project.levelDesign.combatEncounters} Arenas</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-900/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <span>Tags:</span>
            <span>{project.tags.join(' · ')}</span>
          </div>

          <button
            onClick={() => {
              onOpenInStudio(studioSceneMap[project.dummySceneStyle] || 'cyberpunk');
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1.5 transition-colors font-sans shadow-sm shadow-red-600/30"
          >
            <span>Open in 3D Lighting Workbench</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
