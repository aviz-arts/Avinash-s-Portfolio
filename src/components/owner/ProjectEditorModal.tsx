import React, { useState, useEffect } from 'react';
import { ProjectItem, ProjectCategory } from '../../types/portfolio';
import { X, Save, Plus, Trash2, Sliders, Compass, Zap, Film, Image as ImageIcon } from 'lucide-react';
import { MediaUploadField } from '../common/MediaUploadField';

interface ProjectEditorModalProps {
  isOpen: boolean;
  projectToEdit: ProjectItem | null;
  onClose: () => void;
  onSave: (project: ProjectItem) => void;
}

export const ProjectEditorModal: React.FC<ProjectEditorModalProps> = ({
  isOpen,
  projectToEdit,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<ProjectItem>>({
    title: '',
    subtitle: '',
    category: 'game-design',
    engine: 'Unreal Engine 5.4 · Lumen & Nanite',
    role: 'Lead Game Designer',
    year: '2025',
    duration: '6 Months',
    featured: true,
    heroType: 'video',
    videoDuration: '0:42',
    summary: '',
    creativeIntent: '',
    technicalChallenge: '',
    solution: '',
    lightingSetup: {
      keyLight: 'Directional Key Light (5600K, 14 Lux)',
      fillBounce: 'Sky/Ground Hemisphere GI with 0.85 bounce',
      volumetricFog: 'Exponential height fog with anisotropic scattering',
      colorPalette: ['#00f0ff', '#ff0055', '#ffe600', '#0a0d17'],
      exposureEV: 'EV 8.5 (ACES Filmic Tone Curve)',
    },
    levelDesign: {
      flowTopology: 'Three-lane combat arena with cloverleaf intersections',
      sightlines: 'Max uninterrupted sightline capped at 42m',
      verticalityLayers: 3,
      combatEncounters: 4,
      pacingNote: 'Alternating tension zones with tactical recovery areas',
    },
    metrics: [
      { label: 'Target Frame Time', value: '16.6ms', detail: 'Locked 60 FPS' },
      { label: 'Lumen GI Cost', value: '2.0ms', detail: 'Optimized screen probes' },
    ],
    tags: ['Unreal Engine 5', 'Lumen', 'Level Design', 'Cinematic Lighting'],
    dummySceneStyle: 'cyberpunk',
  });

  const [paletteInput, setPaletteInput] = useState('#00f0ff, #ff0055, #ffe600, #0a0d17');
  const [tagsInput, setTagsInput] = useState('Unreal Engine 5, Lumen, Level Design, Cinematic Lighting');

  useEffect(() => {
    if (projectToEdit) {
      setFormData(projectToEdit);
      setPaletteInput(projectToEdit.lightingSetup?.colorPalette?.join(', ') || '#00f0ff, #ff0055');
      setTagsInput(projectToEdit.tags?.join(', ') || 'Unreal Engine 5');
    } else {
      // New project default state
      setFormData({
        id: `project-${Date.now()}`,
        title: '',
        subtitle: '',
        category: 'game-design',
        engine: 'Unreal Engine 5.4 · Lumen',
        role: 'Lead Game Designer',
        year: '2025',
        duration: '5 Months',
        featured: true,
        heroType: 'video',
        videoDuration: '0:45',
        summary: '',
        creativeIntent: '',
        technicalChallenge: '',
        solution: '',
        lightingSetup: {
          keyLight: 'Directional Key (5600K)',
          fillBounce: 'Hemisphere Sky/Ground bounce',
          volumetricFog: 'Anisotropic scattering 0.6',
          colorPalette: ['#00f0ff', '#ff0055', '#f59e0b', '#0b0d13'],
          exposureEV: 'EV 9.0',
        },
        levelDesign: {
          flowTopology: 'Pivotal central hub with flanking corridors',
          sightlines: '45-degree angle buffers',
          verticalityLayers: 3,
          combatEncounters: 4,
          pacingNote: 'High tension combat loops',
        },
        metrics: [
          { label: 'Target Frame Time', value: '16.6ms', detail: 'Locked 60 FPS' },
          { label: 'Lumen GI Cost', value: '2.1ms', detail: 'Screen probes' },
        ],
        passes: [
          { id: 'final', name: 'Final Composition', description: 'Full Lit pass', type: 'final', accentColor: '#00f0ff' },
          { id: 'clay', name: 'Lighting Only (Clay)', description: 'Monochrome diffuse', type: 'clay', accentColor: '#ffffff' },
          { id: 'normals', name: 'World Normals', description: 'Normal buffer', type: 'normals', accentColor: '#a855f7' },
        ],
        tags: ['Unreal Engine 5', 'Lumen', 'Level Design'],
        dummySceneStyle: 'cyberpunk',
      });
      setPaletteInput('#00f0ff, #ff0055, #f59e0b, #0b0d13');
      setTagsInput('Unreal Engine 5, Lumen, Level Design');
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    const parsedPalette = paletteInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.startsWith('#'));

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const fullProject: ProjectItem = {
      id: formData.id || projectToEdit?.id || `project-${Date.now()}`,
      title: formData.title || 'Untitled Project',
      subtitle: formData.subtitle || '',
      category: formData.category as ProjectCategory,
      engine: formData.engine || 'Unreal Engine 5',
      role: formData.role || 'Lighting Artist',
      year: formData.year || '2025',
      duration: formData.duration || '6 Months',
      featured: formData.featured ?? true,
      heroType: formData.heroType || 'video',
      videoDuration: formData.videoDuration || '0:42',
      summary: formData.summary || '',
      creativeIntent: formData.creativeIntent || '',
      technicalChallenge: formData.technicalChallenge || '',
      solution: formData.solution || '',
      lightingSetup: {
        keyLight: formData.lightingSetup?.keyLight || 'Key Light 5600K',
        fillBounce: formData.lightingSetup?.fillBounce || 'Hemisphere bounce',
        volumetricFog: formData.lightingSetup?.volumetricFog || 'Exponential fog',
        colorPalette: parsedPalette.length > 0 ? parsedPalette : ['#00f0ff', '#ff0055'],
        exposureEV: formData.lightingSetup?.exposureEV || 'EV 9.0',
      },
      levelDesign: formData.levelDesign,
      metrics: formData.metrics || [],
      passes: formData.passes || [
        { id: 'final', name: 'Final Composition', description: 'Lit pass', type: 'final', accentColor: '#00f0ff' },
        { id: 'clay', name: 'Lighting Only (Clay)', description: 'Clay pass', type: 'clay', accentColor: '#ffffff' },
      ],
      tags: parsedTags,
      dummySceneStyle: formData.dummySceneStyle || 'cyberpunk',
      customImageUrl: formData.customImageUrl,
      customVideoUrl: formData.customVideoUrl,
      comparisonLeftUrl: formData.comparisonLeftUrl,
      comparisonRightUrl: formData.comparisonRightUrl,
    };

    onSave(fullProject);
    onClose();
  };

  const handleAddMetric = () => {
    setFormData((prev) => ({
      ...prev,
      metrics: [...(prev.metrics || []), { label: 'New Metric', value: '100%', detail: 'Benchmark target' }],
    }));
  };

  const handleRemoveMetric = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      metrics: prev.metrics?.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateMetric = (index: number, field: 'label' | 'value' | 'detail', value: string) => {
    setFormData((prev) => {
      const next = [...(prev.metrics || [])];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return { ...prev, metrics: next };
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-zinc-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/60 shrink-0">
          <div>
            <div className="text-[10px] font-mono text-red-500">PORTFOLIO CMS · OWNER MODE</div>
            <h3 className="text-xl font-display font-bold text-zinc-100">
              {projectToEdit ? `Edit "${projectToEdit.title}"` : 'Publish New Portfolio Project'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* Section 1: Basic Identifiers */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800">
              01. Basic Project Identity
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. District 9: Neon Subterranean"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Subtitle / Setting</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Cyberpunk Subterranean Night Market"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-mono text-zinc-400 mb-1">Category</label>
                <select
                  value={formData.category === 'lighting' ? 'lighting' : 'game-design'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ProjectCategory })}
                  className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                >
                  <option value="game-design">Game Designs</option>
                  <option value="lighting">Lighting</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Engine & Pipeline</label>
                <input
                  type="text"
                  value={formData.engine}
                  onChange={(e) => setFormData({ ...formData, engine: e.target.value })}
                  placeholder="Unreal Engine 5.4 · Lumen"
                  className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Your Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Lead Lighting Artist"
                  className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Year & Duration</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="2025"
                    className="w-16 px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="6 Months"
                    className="w-full px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-mono text-zinc-400 mb-1">Visual Scene Style</label>
                <select
                  value={formData.dummySceneStyle}
                  onChange={(e) => setFormData({ ...formData, dummySceneStyle: e.target.value as any })}
                  className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                >
                  <option value="cyberpunk">Cyberpunk Neon Alleyway</option>
                  <option value="crypt">Gothic Moonlit Crypt</option>
                  <option value="scifi">Tactical Greybox Arena</option>
                  <option value="derelict">Deep Space Derelict (Horror)</option>
                  <option value="ruins">Sunken Overgrown Ruins</option>
                  <option value="turret">Titan Rail Turret (Hard Surface)</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Hero Media Presentation</label>
                <select
                  value={formData.heroType}
                  onChange={(e) => setFormData({ ...formData, heroType: e.target.value as any })}
                  className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                >
                  <option value="video">Cinematic Video Reel</option>
                  <option value="image">Level Architecture Blockout</option>
                  <option value="interactive">3D Interactive Turntable</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Video Duration</label>
                <input
                  type="text"
                  value={formData.videoDuration}
                  onChange={(e) => setFormData({ ...formData, videoDuration: e.target.value })}
                  placeholder="0:45"
                  className="w-full px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Visual Media Uploads (Photos & Videos) */}
          <div className="space-y-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
              <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>02. Visual Media Uploads (Replace Dummy Assets)</span>
              </h4>
              <span className="text-[10px] font-mono text-zinc-500">
                Upload your real screenshots, video clips, or comparison passes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Media 1: Project Artwork / Screenshot */}
              <MediaUploadField
                label="Project Artwork / Thumbnail Photo"
                value={formData.customImageUrl}
                onChange={(url) => setFormData({ ...formData, customImageUrl: url })}
                mediaType="image"
                aspectRatio="video"
                hint="Your hero rendered visual, concept art, or engine screenshot. Replaces dummy canvas procedural."
                placeholder="https://.../screenshot.jpg or upload file"
              />

              {/* Media 2: Cinematic Reel Video */}
              <MediaUploadField
                label="Gameplay / Lighting Reel Video"
                value={formData.customVideoUrl}
                onChange={(url) => setFormData({ ...formData, customVideoUrl: url })}
                mediaType="video"
                aspectRatio="video"
                hint="Upload an MP4/WebM clip or paste a direct video URL to showcase real-time movement."
                placeholder="https://.../video.mp4 or upload file"
              />
            </div>

            {/* Optional A/B Comparison Passes */}
            <div className="pt-2 border-t border-zinc-800/60">
              <div className="text-[11px] font-mono text-zinc-400 mb-2 flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-red-400" />
                <span>Custom A/B Split Inspection Passes (Optional)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MediaUploadField
                  label="Clay / Raw Pass Photo (Left)"
                  value={formData.comparisonLeftUrl}
                  onChange={(url) => setFormData({ ...formData, comparisonLeftUrl: url })}
                  mediaType="image"
                  aspectRatio="video"
                  hint="Unlit / clay / blockout screenshot for the left side of the comparison slider."
                  placeholder="https://.../clay.jpg or upload file"
                />

                <MediaUploadField
                  label="Final Lit / Lumen Pass Photo (Right)"
                  value={formData.comparisonRightUrl}
                  onChange={(url) => setFormData({ ...formData, comparisonRightUrl: url })}
                  mediaType="image"
                  aspectRatio="video"
                  hint="Final lit composition with volumetric GI for the right side of the comparison slider."
                  placeholder="https://.../lit.jpg or upload file"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Copy & Case Study Content */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800">
              03. Design Intent & Case Study Prose
            </h4>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Executive Summary</label>
              <textarea
                rows={2}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="High-level description of what this level and lighting setup accomplished..."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">01. Creative Intent</label>
                <textarea
                  rows={3}
                  value={formData.creativeIntent}
                  onChange={(e) => setFormData({ ...formData, creativeIntent: e.target.value })}
                  placeholder="Atmospheric goal, artistic reference..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">02. Technical Challenge</label>
                <textarea
                  rows={3}
                  value={formData.technicalChallenge}
                  onChange={(e) => setFormData({ ...formData, technicalChallenge: e.target.value })}
                  placeholder="Frametime bottlenecks, draw calls, shadows..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">03. Engineered Solution</label>
                <textarea
                  rows={3}
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  placeholder="How you achieved 60fps and visual clarity..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Cinematic Lighting Rig Specs */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>04. Real-Time Lighting Rig Specifications</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-mono text-zinc-400 mb-1">Key Light Setup</label>
                <input
                  type="text"
                  value={formData.lightingSetup?.keyLight}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lightingSetup: { ...formData.lightingSetup!, keyLight: e.target.value },
                    })
                  }
                  placeholder="Directional Moonbeam 6800K, 12 Lux"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Fill & Indirect Bounce</label>
                <input
                  type="text"
                  value={formData.lightingSetup?.fillBounce}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lightingSetup: { ...formData.lightingSetup!, fillBounce: e.target.value },
                    })
                  }
                  placeholder="Sky/Ground bounce with 0.75 multiplier"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Volumetric Fog & Rayleigh</label>
                <input
                  type="text"
                  value={formData.lightingSetup?.volumetricFog}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lightingSetup: { ...formData.lightingSetup!, volumetricFog: e.target.value },
                    })
                  }
                  placeholder="Exponential height fog with anisotropic scattering"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Color Palette (Hex Codes)</label>
                <input
                  type="text"
                  value={paletteInput}
                  onChange={(e) => setPaletteInput(e.target.value)}
                  placeholder="#00f0ff, #ff0055, #ffe600, #0a0d17"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Production Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
              <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider">
                05. Key Production Metrics
              </h4>
              <button
                type="button"
                onClick={handleAddMetric}
                className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Metric</span>
              </button>
            </div>

            <div className="space-y-2">
              {formData.metrics?.map((metric, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={metric.label}
                    onChange={(e) => handleUpdateMetric(idx, 'label', e.target.value)}
                    placeholder="Metric Label"
                    className="w-1/3 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                  <input
                    type="text"
                    value={metric.value}
                    onChange={(e) => handleUpdateMetric(idx, 'value', e.target.value)}
                    placeholder="Value (e.g. 16.4ms)"
                    className="w-1/4 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white font-mono"
                  />
                  <input
                    type="text"
                    value={metric.detail}
                    onChange={(e) => handleUpdateMetric(idx, 'detail', e.target.value)}
                    placeholder="Detail / context"
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMetric(idx)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Tags */}
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">
              06. Search Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Unreal Engine 5, Lumen, Nanite, Level Design, Cyberpunk"
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Submit Footer */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors font-sans shadow-sm shadow-red-600/30"
            >
              <Save className="w-4 h-4" />
              <span>Save & Publish Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
