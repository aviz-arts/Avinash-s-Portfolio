import React, { useState, useEffect } from 'react';
import { OwnerProfile } from '../../utils/portfolioStorage';
import { X, Save, Plus, Trash2, User, Award, Wrench } from 'lucide-react';

interface ProfileEditorModalProps {
  isOpen: boolean;
  profile: OwnerProfile;
  onClose: () => void;
  onSave: (updatedProfile: OwnerProfile) => void;
}

export const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<OwnerProfile>(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleUpdateToolCategory = (catIndex: number, newCategoryName: string) => {
    setFormData((prev) => {
      const nextTools = [...prev.tools];
      if (nextTools[catIndex]) {
        nextTools[catIndex] = { ...nextTools[catIndex], category: newCategoryName };
      }
      return { ...prev, tools: nextTools };
    });
  };

  const handleUpdateToolItems = (catIndex: number, rawCommaSeparated: string) => {
    const items = rawCommaSeparated.split(',').map((s) => s.trim()).filter(Boolean);
    setFormData((prev) => {
      const nextTools = [...prev.tools];
      if (nextTools[catIndex]) {
        nextTools[catIndex] = { ...nextTools[catIndex], items };
      }
      return { ...prev, tools: nextTools };
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-zinc-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/60 shrink-0">
          <div>
            <div className="text-[10px] font-mono text-red-500">PORTFOLIO CMS · SITE PROFILE</div>
            <h3 className="text-xl font-display font-bold text-zinc-100">
              Edit Artist Profile, Experience & Toolset
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
          {/* Section 1: Hero Identity */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>01. Hero Headline & Lead Narrative</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Professional Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Hero Display Headline</label>
              <input
                type="text"
                required
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 font-display font-semibold focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Lead Introductory Prose</label>
              <textarea
                rows={3}
                value={formData.leadCopy}
                onChange={(e) => setFormData({ ...formData, leadCopy: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 2: Production Track Record Stats */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>02. Track Record & Performance Benchmarks</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-mono text-zinc-400 mb-1">Shipped Releases</label>
                <input
                  type="text"
                  value={formData.stats.shippedTitles}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, shippedTitles: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Frametime Budget</label>
                <input
                  type="text"
                  value={formData.stats.lumenFrametime}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, lumenFrametime: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Experience Years</label>
                <input
                  type="text"
                  value={formData.stats.experienceYears}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, experienceYears: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-zinc-400 mb-1">Lighting Rigs/Passes</label>
                <input
                  type="text"
                  value={formData.stats.shadowPasses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stats: { ...formData.stats, shadowPasses: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Design Philosophy */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800">
              03. Philosophy Statement
            </h4>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Philosophy Header</label>
              <input
                type="text"
                value={formData.philosophyTitle}
                onChange={(e) => setFormData({ ...formData, philosophyTitle: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Philosophy Text</label>
              <textarea
                rows={3}
                value={formData.philosophyText}
                onChange={(e) => setFormData({ ...formData, philosophyText: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 focus:outline-none focus:border-red-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section 4: Engine Toolset Matrix */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-semibold text-red-500 uppercase tracking-wider pb-1 border-b border-zinc-800 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              <span>04. Toolset & Engine Matrix</span>
            </h4>

            <div className="space-y-3">
              {formData.tools.map((toolGroup, idx) => (
                <div key={idx} className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={toolGroup.category}
                      onChange={(e) => handleUpdateToolCategory(idx, e.target.value)}
                      className="w-1/3 px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs font-semibold text-zinc-100 font-mono"
                    />
                    <input
                      type="text"
                      value={toolGroup.items.join(', ')}
                      onChange={(e) => handleUpdateToolItems(idx, e.target.value)}
                      placeholder="Comma separated tools..."
                      className="flex-1 px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
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
              <span>Save & Update Website</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
