import React, { useState, useEffect } from 'react';
import { X, Save, Search, Type, Layers, Box, Compass, Sparkles, Sliders, Image as ImageIcon, Film } from 'lucide-react';
import { SiteContent, DEFAULT_SITE_CONTENT, DEFAULT_CONTACT_OPTIONS } from '../../utils/portfolioStorage';
import { MediaUploadField } from '../common/MediaUploadField';

interface SiteContentEditorModalProps {
  isOpen: boolean;
  content: SiteContent;
  onClose: () => void;
  onSave: (updated: SiteContent) => void;
  initialTab?: 'hero' | 'studio' | 'works' | 'reels' | 'level' | 'about' | 'contact' | 'footer';
}

export const SiteContentEditorModal: React.FC<SiteContentEditorModalProps> = ({
  isOpen,
  content,
  onClose,
  onSave,
  initialTab = 'hero',
}) => {
  const [formData, setFormData] = useState<SiteContent>(content);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'hero' | 'studio' | 'works' | 'reels' | 'level' | 'about' | 'contact' | 'footer'>(initialTab);

  useEffect(() => {
    setFormData(content);
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [content, isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const updateField = <K extends keyof SiteContent>(key: K, val: SiteContent[K]) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
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
            <div className="text-[10px] font-mono text-red-500">PORTFOLIO CMS · MASTER COPY CONTROL</div>
            <h3 className="text-xl font-display font-bold text-zinc-100">
              Edit Every Line Across The Website
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between gap-4 overflow-x-auto shrink-0 font-mono text-xs">
          <div className="flex items-center gap-1">
            {[
              { id: 'hero', label: '01. Hero' },
              { id: 'studio', label: '02. 3D Studio' },
              { id: 'works', label: '03. Works Section' },
              { id: 'reels', label: '04. Reels & A/B' },
              { id: 'level', label: '05. Level Design' },
              { id: 'about', label: '06. About & Stats' },
              { id: 'contact', label: '07. Contact Page' },
              { id: 'footer', label: '08. Footer' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white font-semibold shadow-sm shadow-red-600/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* TAB 1: HERO & KPIS */}
          {activeTab === 'hero' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800">
                Hero Section Copy, Portrait Photo &amp; Ambient Background
              </h4>

              {/* Avatar Photo Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl">
                  <MediaUploadField
                    label="Artist Portrait Photo / Avatar"
                    value={formData.avatarUrl}
                    onChange={(url) => updateField('avatarUrl', url)}
                    mediaType="image"
                    aspectRatio="avatar"
                    hint="Upload your personal photo to display on the hero card and top navigation wordmark."
                    placeholder="https://.../photo.jpg or upload file"
                  />
                </div>

                <div className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl">
                  <MediaUploadField
                    label="Hero Atmospheric Background Video"
                    value={formData.heroBackgroundVideoUrl}
                    onChange={(url) => updateField('heroBackgroundVideoUrl', url)}
                    mediaType="video"
                    aspectRatio="video"
                    hint="Runs at very low opacity in the background of your home hero section. Upload MP4/WebM or paste direct link."
                    placeholder="https://.../background.mp4 or upload file"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Kicker Name</label>
                  <input
                    type="text"
                    value={formData.heroKickerName}
                    onChange={(e) => updateField('heroKickerName', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Kicker Engine & Specialization</label>
                  <input
                    type="text"
                    value={formData.heroKickerSubtitle}
                    onChange={(e) => updateField('heroKickerSubtitle', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Hero Display Headline</label>
                <input
                  type="text"
                  value={formData.heroHeadline}
                  onChange={(e) => updateField('heroHeadline', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-100 font-display font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Hero Lead Narrative Copy</label>
                <textarea
                  rows={3}
                  value={formData.heroLeadCopy}
                  onChange={(e) => updateField('heroLeadCopy', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Primary CTA Button</label>
                  <input
                    type="text"
                    value={formData.heroLabCtaText}
                    onChange={(e) => updateField('heroLabCtaText', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Secondary CTA Button</label>
                  <input
                    type="text"
                    value={formData.heroCaseStudiesCtaText}
                    onChange={(e) => updateField('heroCaseStudiesCtaText', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: 3D STUDIO */}
          {activeTab === 'studio' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800">
                3D Interactive Lighting Studio
              </h4>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Studio Kicker</label>
                <input
                  type="text"
                  value={formData.studioKicker}
                  onChange={(e) => updateField('studioKicker', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Studio Heading</label>
                <input
                  type="text"
                  value={formData.studioHeadline}
                  onChange={(e) => updateField('studioHeadline', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-display font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Studio Description</label>
                <textarea
                  rows={3}
                  value={formData.studioDescription}
                  onChange={(e) => updateField('studioDescription', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Modes Badge Text</label>
                <input
                  type="text"
                  value={formData.studioModesBadge}
                  onChange={(e) => updateField('studioModesBadge', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 3: WORKS */}
          {activeTab === 'works' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800">
                Portfolio Section Heading
              </h4>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Works Kicker</label>
                <input
                  type="text"
                  value={formData.worksKicker}
                  onChange={(e) => updateField('worksKicker', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Works Headline</label>
                <input
                  type="text"
                  value={formData.worksHeadline}
                  onChange={(e) => updateField('worksHeadline', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-display font-semibold"
                />
              </div>
            </div>
          )}

          {/* TAB 4: REELS & A/B */}
          {activeTab === 'reels' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800">
                Cinematics Reels & A/B Slider
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Section Kicker</label>
                  <input
                    type="text"
                    value={formData.reelsKicker}
                    onChange={(e) => updateField('reelsKicker', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Section Headline</label>
                  <input
                    type="text"
                    value={formData.reelsHeadline}
                    onChange={(e) => updateField('reelsHeadline', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Section Description</label>
                <textarea
                  rows={2}
                  value={formData.reelsDescription}
                  onChange={(e) => updateField('reelsDescription', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                  <div className="text-xs font-mono text-red-500 font-semibold flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5" />
                    <span>Video Reel Player & Footage</span>
                  </div>
                  <MediaUploadField
                    label="Reel Video File or URL"
                    value={formData.customReelVideoUrl}
                    onChange={(url) => updateField('customReelVideoUrl', url)}
                    mediaType="video"
                    aspectRatio="video"
                    hint="Upload an MP4/WebM video or paste direct link to replace the default procedural canvas reel."
                    placeholder="https://.../my_reel.mp4 or upload file"
                  />
                  <input
                    type="text"
                    value={formData.reelPlayerTitle}
                    onChange={(e) => updateField('reelPlayerTitle', e.target.value)}
                    placeholder="Reel title"
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100"
                  />
                  <input
                    type="text"
                    value={formData.reelPlayerEngine}
                    onChange={(e) => updateField('reelPlayerEngine', e.target.value)}
                    placeholder="Engine subtitle"
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400"
                  />
                  <textarea
                    rows={2}
                    value={formData.reelPlayerCaption}
                    onChange={(e) => updateField('reelPlayerCaption', e.target.value)}
                    placeholder="Caption"
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 resize-none"
                  />
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                  <div className="text-xs font-mono text-red-500 font-semibold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>A/B Inspection Slider Passes</span>
                  </div>
                  <MediaUploadField
                    label="Clay / Raw Pass Photo (Left)"
                    value={formData.customAbSliderLeftUrl}
                    onChange={(url) => updateField('customAbSliderLeftUrl', url)}
                    mediaType="image"
                    aspectRatio="video"
                    hint="Clay/unlit image for the left side of the split slider."
                    placeholder="https://.../clay.jpg or upload file"
                  />
                  <MediaUploadField
                    label="Final Lit / Lumen Photo (Right)"
                    value={formData.customAbSliderRightUrl}
                    onChange={(url) => updateField('customAbSliderRightUrl', url)}
                    mediaType="image"
                    aspectRatio="video"
                    hint="Final lit composition image for the right side of the split slider."
                    placeholder="https://.../lit.jpg or upload file"
                  />
                  <input
                    type="text"
                    value={formData.abSliderTitle}
                    onChange={(e) => updateField('abSliderTitle', e.target.value)}
                    placeholder="Slider title"
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100"
                  />
                  <input
                    type="text"
                    value={formData.abSliderHint}
                    onChange={(e) => updateField('abSliderHint', e.target.value)}
                    placeholder="Drag hint"
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400"
                  />
                  <textarea
                    rows={2}
                    value={formData.abSliderCaption}
                    onChange={(e) => updateField('abSliderCaption', e.target.value)}
                    placeholder="Caption"
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEVEL DESIGN */}
          {activeTab === 'level' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800">
                Level Architecture & Greybox Breakdown
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Kicker</label>
                  <input
                    type="text"
                    value={formData.levelKicker}
                    onChange={(e) => updateField('levelKicker', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Headline</label>
                  <input
                    type="text"
                    value={formData.levelHeadline}
                    onChange={(e) => updateField('levelHeadline', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Section Description</label>
                <textarea
                  rows={2}
                  value={formData.levelDescription}
                  onChange={(e) => updateField('levelDescription', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 resize-none"
                />
              </div>

              {/* 3 Level Design Focus Cards */}
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                  <div className="text-xs font-mono text-red-500 font-semibold">Card 1: Sightlines</div>
                  <input
                    type="text"
                    value={formData.levelCard1Title}
                    onChange={(e) => updateField('levelCard1Title', e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100"
                  />
                  <textarea
                    rows={2}
                    value={formData.levelCard1Desc}
                    onChange={(e) => updateField('levelCard1Desc', e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 resize-none"
                  />
                  <input
                    type="text"
                    value={formData.levelCard1Tag}
                    onChange={(e) => updateField('levelCard1Tag', e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] font-mono text-zinc-400"
                  />
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                  <div className="text-xs font-mono text-red-500 font-semibold">Card 2: Verticality</div>
                  <input
                    type="text"
                    value={formData.levelCard2Title}
                    onChange={(e) => updateField('levelCard2Title', e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100"
                  />
                  <textarea
                    rows={2}
                    value={formData.levelCard2Desc}
                    onChange={(e) => updateField('levelCard2Desc', e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 resize-none"
                  />
                  <input
                    type="text"
                    value={formData.levelCard2Tag}
                    onChange={(e) => updateField('levelCard2Tag', e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] font-mono text-zinc-400"
                  />
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                  <div className="text-xs font-mono text-rose-400 font-semibold">Card 3: Landmarks</div>
                  <input
                    type="text"
                    value={formData.levelCard3Title}
                    onChange={(e) => updateField('levelCard3Title', e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-100"
                  />
                  <textarea
                    rows={2}
                    value={formData.levelCard3Desc}
                    onChange={(e) => updateField('levelCard3Desc', e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 resize-none"
                  />
                  <input
                    type="text"
                    value={formData.levelCard3Tag}
                    onChange={(e) => updateField('levelCard3Tag', e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] font-mono text-zinc-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800">
                About & Creative Philosophy
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">About Kicker</label>
                  <input
                    type="text"
                    value={formData.aboutKicker}
                    onChange={(e) => updateField('aboutKicker', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">About Headline</label>
                  <input
                    type="text"
                    value={formData.aboutHeadline}
                    onChange={(e) => updateField('aboutHeadline', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">About Lead Text</label>
                <textarea
                  rows={3}
                  value={formData.aboutLead}
                  onChange={(e) => updateField('aboutLead', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 resize-none leading-relaxed"
                />
              </div>

              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                <div className="text-xs font-mono text-red-500 font-semibold">Philosophy Card</div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Philosophy Title</label>
                  <input
                    type="text"
                    value={formData.philosophyCardTitle}
                    onChange={(e) => updateField('philosophyCardTitle', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-100 font-display font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Philosophy Prose</label>
                  <textarea
                    rows={3}
                    value={formData.philosophyCardText}
                    onChange={(e) => updateField('philosophyCardText', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 resize-none leading-relaxed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-mono text-red-500 mb-2">
                  About Track Record Default Benchmarks (Individual cards can also be added/removed inline on About Tab)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1.5">
                    <input
                      type="text"
                      value={formData.stat1Value}
                      onChange={(e) => updateField('stat1Value', e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white font-mono font-bold"
                    />
                    <input
                      type="text"
                      value={formData.stat1Label}
                      onChange={(e) => updateField('stat1Label', e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 text-[10px]"
                    />
                  </div>
                  <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1.5">
                    <input
                      type="text"
                      value={formData.stat2Value}
                      onChange={(e) => updateField('stat2Value', e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white font-mono font-bold"
                    />
                    <input
                      type="text"
                      value={formData.stat2Label}
                      onChange={(e) => updateField('stat2Label', e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 text-[10px]"
                    />
                  </div>
                  <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1.5">
                    <input
                      type="text"
                      value={formData.stat3Value}
                      onChange={(e) => updateField('stat3Value', e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white font-mono font-bold"
                    />
                    <input
                      type="text"
                      value={formData.stat3Label}
                      onChange={(e) => updateField('stat3Label', e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 text-[10px]"
                    />
                  </div>
                  <div className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-1.5">
                    <input
                      type="text"
                      value={formData.stat4Value}
                      onChange={(e) => updateField('stat4Value', e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-white font-mono font-bold"
                    />
                    <input
                      type="text"
                      value={formData.stat4Label}
                      onChange={(e) => updateField('stat4Label', e.target.value)}
                      className="w-full px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 text-[10px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CONTACT PAGE */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800">
                Contact Page & Reference Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Contact Kicker</label>
                  <input
                    type="text"
                    value={formData.contactKicker || 'GET IN TOUCH'}
                    onChange={(e) => updateField('contactKicker', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Contact Headline</label>
                  <input
                    type="text"
                    value={formData.contactHeadline || "Let's Work Together"}
                    onChange={(e) => updateField('contactHeadline', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-display font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Contact Subtitle Copy</label>
                <textarea
                  rows={2}
                  value={formData.contactSubtitle || ''}
                  onChange={(e) => updateField('contactSubtitle', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateField('contactEmail', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Email Card Note</label>
                  <input
                    type="text"
                    value={formData.contactEmailNote || ''}
                    onChange={(e) => updateField('contactEmailNote', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Phone / WhatsApp Number</label>
                  <input
                    type="text"
                    value={formData.contactPhone || '+91 9361287193'}
                    onChange={(e) => updateField('contactPhone', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Phone Card Note</label>
                  <input
                    type="text"
                    value={formData.contactPhoneNote || ''}
                    onChange={(e) => updateField('contactPhoneNote', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Location Badge Text</label>
                <input
                  type="text"
                  value={formData.contactLocationText || 'Based in India · Available Worldwide'}
                  onChange={(e) => updateField('contactLocationText', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                />
              </div>

              {/* Project Focus / Role Dropdown Options Editor */}
              <div className="pt-2 border-t border-zinc-900 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono text-zinc-300 font-semibold">
                    Contact Form "Project Focus / Role" Options (One per line)
                  </label>
                  <span className="text-[10px] font-mono text-red-400">Customizable Dropdown</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Enter each service or project inquiry option on its own line. Visitors choose from these in the inquiry form dropdown.
                </p>
                <textarea
                  rows={5}
                  value={
                    Array.isArray(formData.contactProjectOptions)
                      ? formData.contactProjectOptions.join('\n')
                      : typeof formData.contactProjectOptions === 'string'
                      ? formData.contactProjectOptions
                      : DEFAULT_CONTACT_OPTIONS.join('\n')
                  }
                  onChange={(e) => {
                    const lines = e.target.value.split('\n');
                    updateField('contactProjectOptions', lines);
                  }}
                  placeholder="Game Design & Core Mechanics (Loops & Pacing)&#10;Level Design & 3D Arena Blockout..."
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-100 leading-relaxed focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 border-t border-zinc-900">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-mono text-zinc-300 font-semibold">
                    Featured Social Links (LinkedIn, ArtStation, Instagram)
                  </div>
                  <span className="text-[10px] font-mono text-red-400">Featured on Contact page</span>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono mb-3">
                  Paste your active profile URLs below, or use the direct "Edit Link" buttons right on the Contact page.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="block text-zinc-500 mb-1">YouTube URL</label>
                    <input
                      type="url"
                      value={formData.socialYoutubeUrl || ''}
                      onChange={(e) => updateField('socialYoutubeUrl', e.target.value)}
                      placeholder="https://youtube.com/..."
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={formData.socialLinkedinUrl || ''}
                      onChange={(e) => updateField('socialLinkedinUrl', e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">ArtStation URL</label>
                    <input
                      type="url"
                      value={formData.socialArtstationUrl || ''}
                      onChange={(e) => updateField('socialArtstationUrl', e.target.value)}
                      placeholder="https://artstation.com/..."
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 mb-1">Instagram URL</label>
                    <input
                      type="url"
                      value={formData.socialInstagramUrl || ''}
                      onChange={(e) => updateField('socialInstagramUrl', e.target.value)}
                      placeholder="https://instagram.com/..."
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: FOOTER */}
          {activeTab === 'footer' && (
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800">
                Footer Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Footer Name</label>
                  <input
                    type="text"
                    value={formData.footerName}
                    onChange={(e) => updateField('footerName', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Footer Professional Role</label>
                  <input
                    type="text"
                    value={formData.footerRole}
                    onChange={(e) => updateField('footerRole', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Copyright Statement</label>
                <input
                  type="text"
                  value={formData.footerCopyright}
                  onChange={(e) => updateField('footerCopyright', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-mono"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
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
              <span>Save & Update All Lines</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
