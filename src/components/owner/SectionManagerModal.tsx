import React, { useState } from 'react';
import { CustomSection, CustomSectionItem } from '../../utils/portfolioStorage';
import { X, Plus, Trash2, MoveUp, MoveDown, Eye, EyeOff, Layers, Check, Sparkles } from 'lucide-react';

interface SectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: CustomSection[];
  onSaveSections: (sections: CustomSection[]) => void;
  initialTab?: 'home' | 'work' | 'about' | 'resume' | 'contact';
  initialSectionToEdit?: CustomSection | null;
}

export const SectionManagerModal: React.FC<SectionManagerModalProps> = ({
  isOpen,
  onClose,
  sections,
  onSaveSections,
  initialTab = 'work',
  initialSectionToEdit = null,
}) => {
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'home' | 'work' | 'about' | 'resume' | 'contact'>('all');
  const [editingSection, setEditingSection] = useState<CustomSection | null>(initialSectionToEdit);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form state for creating/editing a single section
  const [formData, setFormData] = useState<Partial<CustomSection>>({
    tab: initialTab,
    kicker: '',
    title: '',
    description: '',
    layout: 'cards',
    visible: true,
    items: [],
  });

  if (!isOpen) return null;

  const handleStartNewSection = (
    tab: 'home' | 'work' | 'about' | 'resume' | 'contact' = initialTab,
    layout: 'cards' | 'feature' | 'split' | 'stats' | 'callout' = 'cards'
  ) => {
    setIsCreatingNew(true);
    setEditingSection(null);

    if (layout === 'stats') {
      setFormData({
        id: `section-${Date.now()}`,
        tab,
        kicker: 'PRODUCTION BENCHMARKS',
        title: 'Shipped Releases & Performance Benchmarks',
        description: 'Key quantifiable metrics, core design contributions, and frametime budgets.',
        layout: 'stats',
        visible: true,
        order: sections.length + 1,
        items: [
          {
            id: `item-${Date.now()}-1`,
            title: '4 Titles',
            subtitle: 'Shipped Releases (PC/Console)',
            description: 'Commercial releases shipped across steam and next-gen consoles.',
            tag: '',
          },
          {
            id: `item-${Date.now()}-2`,
            title: '100% Core',
            subtitle: 'Game Design & Mechanics Focus',
            description: 'Gameplay loops, combat systems, and pacing architecture.',
            tag: 'red',
          },
          {
            id: `item-${Date.now()}-3`,
            title: '7+ Years',
            subtitle: 'Game Industry Experience',
            description: 'Senior design and technical lighting production experience.',
            tag: '',
          },
          {
            id: `item-${Date.now()}-4`,
            title: '60.0 FPS',
            subtitle: 'Lumen Console Frametime (Passion)',
            description: 'Unreal Engine 5 real-time global illumination optimization.',
            tag: '',
          },
        ],
      });
      return;
    }

    if (layout === 'callout') {
      setFormData({
        id: `section-${Date.now()}`,
        tab,
        kicker: 'EXECUTIVE DESIGN PROFILE',
        title: 'Core Philosophy & Direction',
        description:
          'Professional Game Designer specializing in core gameplay loops, mechanics, player pacing, and level architecture — powered by a lifelong hobby and passion as a Lighting Artist.',
        layout: 'callout',
        visible: true,
        order: sections.length + 1,
        items: [],
      });
      return;
    }

    setFormData({
      id: `section-${Date.now()}`,
      tab,
      kicker: 'Custom Showcase · Spotlight',
      title: 'New Section Title',
      description: 'Describe this section and what makes this workflow, level geometry, or lighting approach unique.',
      layout,
      visible: true,
      order: sections.length + 1,
      items: [
        {
          id: `item-${Date.now()}-1`,
          title: 'Primary Highlight',
          subtitle: 'Technical Focus / Specification',
          description: 'Provide technical breakdown, frame budget, or level design metric here.',
          tag: 'Highlight · 2025',
        },
      ],
    });
  };

  const handleStartEdit = (sec: CustomSection) => {
    setEditingSection(sec);
    setIsCreatingNew(false);
    setFormData({ ...sec, items: [...sec.items] });
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Section title is required.');
      return;
    }

    let updated: CustomSection[];
    if (isCreatingNew) {
      const newSec: CustomSection = {
        id: formData.id || `section-${Date.now()}`,
        tab: formData.tab || 'work',
        kicker: formData.kicker || 'Special Showcase',
        title: formData.title || 'Untitled Section',
        description: formData.description || '',
        layout: formData.layout || 'cards',
        visible: formData.visible !== false,
        order: sections.length + 1,
        items: formData.items || [],
      };
      updated = [...sections, newSec];
    } else if (editingSection) {
      updated = sections.map((s) => {
        if (s.id === editingSection.id) {
          return {
            ...s,
            ...formData,
          } as CustomSection;
        }
        return s;
      });
    } else {
      return;
    }

    onSaveSections(updated);
    setEditingSection(null);
    setIsCreatingNew(false);
  };

  const handleDeleteSection = (id: string) => {
    if (confirm('Are you sure you want to delete this custom section?')) {
      const updated = sections.filter((s) => s.id !== id);
      onSaveSections(updated);
      if (editingSection?.id === id) {
        setEditingSection(null);
        setIsCreatingNew(false);
      }
    }
  };

  const handleToggleVisibility = (id: string) => {
    const updated = sections.map((s) => {
      if (s.id === id) {
        return { ...s, visible: !s.visible };
      }
      return s;
    });
    onSaveSections(updated);
  };

  const handleMoveOrder = (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex((s) => s.id === id);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sections.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const newArr = [...sections];
    const [moved] = newArr.splice(idx, 1);
    newArr.splice(targetIdx, 0, moved);

    // Reassign order indices
    const updated = newArr.map((sec, i) => ({ ...sec, order: i + 1 }));
    onSaveSections(updated);
  };

  // Item helpers in form
  const handleAddItemToForm = () => {
    const newItem: CustomSectionItem = {
      id: `item-${Date.now()}`,
      title: 'New Card Item',
      subtitle: 'Category / Metric',
      description: 'Detail technical implementation, engine parameters, or design intent.',
      tag: 'New Card',
    };
    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  const handleUpdateFormItem = (itemId: string, field: keyof CustomSectionItem, val: string) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).map((it) => (it.id === itemId ? { ...it, [field]: val } : it)),
    }));
  };

  const handleDeleteFormItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: (prev.items || []).filter((it) => it.id !== itemId),
    }));
  };

  const displayedSections = sections.filter(
    (s) => activeTabFilter === 'all' || s.tab === activeTabFilter
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0a0c] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-zinc-100">
                Tab Sections Manager
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Add, arrange, or edit custom showcase sections in Home, Work, and About tabs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Action Bar */}
          {!isCreatingNew && !editingSection ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Tab Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono">
                  {(['all', 'home', 'work', 'about', 'resume', 'contact'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setActiveTabFilter(t)}
                      className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${
                        activeTabFilter === t
                          ? 'bg-red-600 text-white font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t === 'all' ? 'All Tabs' : `${t} Tab`}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleStartNewSection(activeTabFilter !== 'all' ? activeTabFilter : 'resume', 'stats')}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors shadow-lg shadow-red-600/30"
                    title="Add KPI Benchmarks Strip like 4 Titles, 100% Core..."
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Benchmarks Strip</span>
                  </button>
                  <button
                    onClick={() => handleStartNewSection(activeTabFilter !== 'all' ? activeTabFilter : 'resume', 'callout')}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors"
                    title="Add Executive Design Profile Narrative Box"
                  >
                    <Plus className="w-4 h-4 text-red-400" />
                    <span>+ Add Callout Box</span>
                  </button>
                  <button
                    onClick={() => handleStartNewSection('work', 'cards')}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-red-400" />
                    <span>+ Add Cards Grid</span>
                  </button>
                </div>
              </div>

              {/* Sections List */}
              <div className="space-y-3">
                {displayedSections.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-2xl">
                    No custom sections found in this tab. Click "+ Add Section" above to create one.
                  </div>
                ) : (
                  displayedSections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-5 bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1.5 max-w-xl">
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/60 uppercase text-[10px]">
                            {sec.tab} TAB
                          </span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-400">{sec.kicker}</span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-500 capitalize">{sec.layout} Layout</span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-500">{sec.items.length} Cards</span>
                        </div>
                        <h4 className="text-base font-display font-semibold text-zinc-100">
                          {sec.title}
                        </h4>
                        <p className="text-xs text-zinc-400 line-clamp-1">{sec.description}</p>
                      </div>

                      {/* Section Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Order buttons */}
                        <div className="flex items-center bg-zinc-800 rounded-lg p-0.5 border border-zinc-700">
                          <button
                            onClick={() => handleMoveOrder(sec.id, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors"
                            title="Move section up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(sec.id, 'down')}
                            disabled={idx === displayedSections.length - 1}
                            className="p-1.5 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 transition-colors"
                            title="Move section down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Visibility Toggle */}
                        <button
                          onClick={() => handleToggleVisibility(sec.id)}
                          className={`p-2 rounded-lg border transition-colors ${
                            sec.visible !== false
                              ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-red-400'
                              : 'bg-zinc-900 border-dashed border-zinc-700 text-zinc-500'
                          }`}
                          title={sec.visible !== false ? 'Visible to visitors (click to hide)' : 'Hidden (click to show)'}
                        >
                          {sec.visible !== false ? (
                            <Eye className="w-4 h-4 text-red-400" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-zinc-500" />
                          )}
                        </button>

                        {/* Edit Section */}
                        <button
                          onClick={() => handleStartEdit(sec)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-xs font-mono transition-colors shadow-sm"
                        >
                          Edit Content
                        </button>

                        {/* Delete Section */}
                        <button
                          onClick={() => handleDeleteSection(sec.id)}
                          className="p-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg transition-colors"
                          title="Delete section"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* Create / Edit Form */
            <form onSubmit={handleSaveForm} className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-red-500" />
                  <h3 className="text-base font-display font-bold text-zinc-100">
                    {isCreatingNew ? 'Create New Section' : `Edit: ${formData.title}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSection(null);
                    setIsCreatingNew(false);
                  }}
                  className="text-xs font-mono text-zinc-400 hover:text-zinc-200"
                >
                  ← Back to Sections List
                </button>
              </div>

              {/* Tab & Layout Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                    Target Tab in Header
                  </label>
                  <select
                    value={formData.tab || 'work'}
                    onChange={(e) =>
                      setFormData({ ...formData, tab: e.target.value as 'home' | 'work' | 'about' | 'resume' | 'contact' })
                    }
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="home">Home Tab (Main Feed)</option>
                    <option value="work">Work Tab (Portfolio & Case Studies)</option>
                    <option value="about">About Tab (Experience & Philosophy)</option>
                    <option value="resume">Resume Tab (Career Timeline & Benchmarks)</option>
                    <option value="contact">Contact Tab (Inquiries & Connect)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase">
                    Visual Layout
                  </label>
                  <select
                    value={formData.layout || 'cards'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        layout: e.target.value as 'cards' | 'feature' | 'split' | 'stats' | 'callout',
                      })
                    }
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                  >
                    <option value="stats">Stat Cards Strip (KPI Benchmarks: 4 Titles, 100% Core...)</option>
                    <option value="callout">Executive Callout Box (Profile Narrative Banner)</option>
                    <option value="cards">Cards Grid (3-columns: Awards, Systems, Case Studies)</option>
                    <option value="split">Split Columns (2-columns: Side-by-side Technical Topics)</option>
                    <option value="feature">Full-Width Feature Rows (Deep-dive breakdowns)</option>
                  </select>
                </div>
              </div>

              {/* Section Header Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                    Section Kicker (Small Monospace Subhead)
                  </label>
                  <input
                    type="text"
                    value={formData.kicker || ''}
                    onChange={(e) => setFormData({ ...formData, kicker: e.target.value })}
                    placeholder="e.g. Industry Recognition · Technical Publications"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                    Section Title (Prominent Heading)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Real-Time Lighting Talks & Masterclasses"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-100 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1 uppercase">
                    Section Description (Introductory Narrative)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Briefly describe what this section covers..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Items / Cards in this Section */}
              <div className="pt-4 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-display font-semibold text-zinc-200">
                      Cards / Items in this Section ({formData.items?.length || 0})
                    </h4>
                    <p className="text-xs font-mono text-zinc-500">
                      Every card has title, subtitle, description, and optional link
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-xs font-mono flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Card</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.items?.map((it, idx) => (
                    <div
                      key={it.id}
                      className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-3 relative group"
                    >
                      <button
                        type="button"
                        onClick={() => handleDeleteFormItem(it.id)}
                        className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950 rounded-lg border border-zinc-800 transition-colors"
                        title="Delete this card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="text-[11px] font-mono text-red-400 font-semibold">
                        Card #{idx + 1}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                            Card Title
                          </label>
                          <input
                            type="text"
                            value={it.title}
                            onChange={(e) => handleUpdateFormItem(it.id, 'title', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                            Card Tag / Badge
                          </label>
                          <input
                            type="text"
                            value={it.tag || ''}
                            onChange={(e) => handleUpdateFormItem(it.id, 'tag', e.target.value)}
                            placeholder="e.g. Technical Lecture · 2024"
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                            Subtitle
                          </label>
                          <input
                            type="text"
                            value={it.subtitle || ''}
                            onChange={(e) => handleUpdateFormItem(it.id, 'subtitle', e.target.value)}
                            placeholder="e.g. Unreal Engine Spotlight"
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                            Link Text (Optional)
                          </label>
                          <input
                            type="text"
                            value={it.linkText || ''}
                            onChange={(e) => handleUpdateFormItem(it.id, 'linkText', e.target.value)}
                            placeholder="e.g. Read Case Study"
                            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          value={it.description}
                          onChange={(e) => handleUpdateFormItem(it.id, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSection(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-mono transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs font-mono transition-colors flex items-center gap-1.5 shadow-lg shadow-red-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Section</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
