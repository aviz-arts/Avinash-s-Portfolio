import React from 'react';
import { CustomSection, CustomSectionItem } from '../../utils/portfolioStorage';
import { EditableText } from '../common/EditableText';
import { Plus, Trash2, Edit3, MoveUp, MoveDown, ExternalLink, Sparkles, Layers, Box } from 'lucide-react';

interface CustomSectionRendererProps {
  sections: CustomSection[];
  tab: 'home' | 'work' | 'about';
  isOwner: boolean;
  onUpdateSection: (id: string, updated: Partial<CustomSection>) => void;
  onDeleteSection: (id: string) => void;
  onAddSectionClick?: (tab: 'home' | 'work' | 'about') => void;
  onEditSectionClick?: (section: CustomSection) => void;
}

export const CustomSectionRenderer: React.FC<CustomSectionRendererProps> = ({
  sections,
  tab,
  isOwner,
  onUpdateSection,
  onDeleteSection,
  onAddSectionClick,
  onEditSectionClick,
}) => {
  // Filter sections assigned to this tab
  const tabSections = sections
    .filter((sec) => sec.tab === tab && (isOwner || sec.visible !== false))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (tabSections.length === 0 && !isOwner) {
    return null;
  }

  const handleUpdateItem = (
    sectionId: string,
    itemId: string,
    key: keyof CustomSectionItem,
    value: string
  ) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;
    const updatedItems = sec.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, [key]: value };
      }
      return item;
    });
    onUpdateSection(sectionId, { items: updatedItems });
  };

  const handleAddItem = (sectionId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;
    const newItem: CustomSectionItem = {
      id: `item-${Date.now()}`,
      title: 'New Showcase Card',
      subtitle: 'Technical Focus / Subtitle',
      description: 'Detail the workflow, technical metric, level geometry constraint, or lighting pass here.',
      tag: 'New Entry',
    };
    onUpdateSection(sectionId, { items: [...sec.items, newItem] });
  };

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;
    if (confirm('Delete this card from the section?')) {
      const updatedItems = sec.items.filter((item) => item.id !== itemId);
      onUpdateSection(sectionId, { items: updatedItems });
    }
  };

  return (
    <div className="space-y-16 my-12">
      {tabSections.map((sec) => (
        <div
          key={sec.id}
          className={`relative p-8 md:p-10 rounded-3xl border transition-all ${
            sec.visible === false
              ? 'bg-zinc-950/40 border-dashed border-zinc-800 opacity-60'
              : 'bg-zinc-900/30 border-zinc-800/80 shadow-xl'
          }`}
        >
          {/* Owner Quick Controls Bar */}
          {isOwner && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 mb-8 border-b border-zinc-800/80 bg-zinc-900/60 -mx-8 -mt-8 md:-mx-10 md:-mt-10 p-4 rounded-t-3xl">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/60">
                  Custom Section ({sec.tab.toUpperCase()} TAB)
                </span>
                {sec.visible === false && (
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[11px]">
                    Hidden from Visitors
                  </span>
                )}
                <span className="text-zinc-500">Layout: {sec.layout}</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => handleAddItem(sec.id)}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium flex items-center gap-1 transition-colors shadow-sm shadow-red-600/30"
                  title="Add another card or item to this section"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Card</span>
                </button>
                {onEditSectionClick && (
                  <button
                    onClick={() => onEditSectionClick(sec)}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1 transition-colors"
                    title="Change section layout, tab, or settings"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-red-400" />
                    <span>Settings</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Delete custom section "${sec.title}"?`)) {
                      onDeleteSection(sec.id);
                    }
                  }}
                  className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg flex items-center gap-1 transition-colors"
                  title="Delete this entire section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* Section Header */}
          <div className="max-w-3xl mb-10">
            <div className="text-xs font-mono text-red-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-500" />
              <EditableText
                value={sec.kicker}
                onChange={(val) => onUpdateSection(sec.id, { kicker: val })}
                isOwner={isOwner}
                label="Section Kicker"
              />
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-zinc-100 tracking-tight">
              <EditableText
                value={sec.title}
                onChange={(val) => onUpdateSection(sec.id, { title: val })}
                isOwner={isOwner}
                label="Section Title"
                as="span"
              />
            </h3>
            {sec.description && (
              <p className="text-sm text-zinc-400 leading-relaxed mt-2.5">
                <EditableText
                  value={sec.description}
                  onChange={(val) => onUpdateSection(sec.id, { description: val })}
                  isOwner={isOwner}
                  label="Section Description"
                  multiline={true}
                  as="span"
                />
              </p>
            )}
          </div>

          {/* Content Layouts */}
          {sec.layout === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sec.items.map((item) => (
                <div
                  key={item.id}
                  className="group relative p-6 bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col justify-between transition-all"
                >
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteItem(sec.id, item.id)}
                      className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950/80 rounded-lg border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="space-y-3">
                    {item.tag && (
                      <div className="text-xs font-mono text-red-400 tracking-wide">
                        <EditableText
                          value={item.tag}
                          onChange={(v) => handleUpdateItem(sec.id, item.id, 'tag', v)}
                          isOwner={isOwner}
                          label="Card Tag"
                        />
                      </div>
                    )}

                    <h4 className="text-base sm:text-lg font-display font-semibold text-zinc-100 leading-snug">
                      <EditableText
                        value={item.title}
                        onChange={(v) => handleUpdateItem(sec.id, item.id, 'title', v)}
                        isOwner={isOwner}
                        label="Card Title"
                        as="span"
                      />
                    </h4>

                    {item.subtitle && (
                      <div className="text-xs font-mono text-zinc-400">
                        <EditableText
                          value={item.subtitle}
                          onChange={(v) => handleUpdateItem(sec.id, item.id, 'subtitle', v)}
                          isOwner={isOwner}
                          label="Card Subtitle"
                        />
                      </div>
                    )}

                    <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                      <EditableText
                        value={item.description}
                        onChange={(v) => handleUpdateItem(sec.id, item.id, 'description', v)}
                        isOwner={isOwner}
                        label="Card Description"
                        multiline={true}
                        as="span"
                      />
                    </p>
                  </div>

                  {item.linkText && (
                    <div className="pt-4 mt-4 border-t border-zinc-800/80">
                      <span className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors inline-flex items-center gap-1">
                        <EditableText
                          value={item.linkText}
                          onChange={(v) => handleUpdateItem(sec.id, item.id, 'linkText', v)}
                          isOwner={isOwner}
                          label="Link Text"
                        />
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {sec.layout === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sec.items.map((item) => (
                <div
                  key={item.id}
                  className="group relative p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col justify-between"
                >
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteItem(sec.id, item.id)}
                      className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950/80 rounded-lg border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="space-y-3">
                    {item.tag && (
                      <div className="text-xs font-mono text-red-400 font-medium tracking-wide">
                        <EditableText
                          value={item.tag}
                          onChange={(v) => handleUpdateItem(sec.id, item.id, 'tag', v)}
                          isOwner={isOwner}
                          label="Item Tag"
                        />
                      </div>
                    )}
                    <h4 className="text-lg font-display font-semibold text-zinc-100">
                      <EditableText
                        value={item.title}
                        onChange={(v) => handleUpdateItem(sec.id, item.id, 'title', v)}
                        isOwner={isOwner}
                        label="Item Title"
                        as="span"
                      />
                    </h4>
                    {item.subtitle && (
                      <div className="text-xs font-mono text-zinc-400">
                        <EditableText
                          value={item.subtitle}
                          onChange={(v) => handleUpdateItem(sec.id, item.id, 'subtitle', v)}
                          isOwner={isOwner}
                          label="Item Subtitle"
                        />
                      </div>
                    )}
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      <EditableText
                        value={item.description}
                        onChange={(v) => handleUpdateItem(sec.id, item.id, 'description', v)}
                        isOwner={isOwner}
                        label="Item Description"
                        multiline={true}
                        as="span"
                      />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sec.layout === 'feature' && (
            <div className="space-y-4">
              {sec.items.map((item) => (
                <div
                  key={item.id}
                  className="group relative p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteItem(sec.id, item.id)}
                      className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950/80 rounded-lg border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete feature item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-3">
                      {item.tag && (
                        <span className="text-xs font-mono text-red-400">
                          <EditableText
                            value={item.tag}
                            onChange={(v) => handleUpdateItem(sec.id, item.id, 'tag', v)}
                            isOwner={isOwner}
                            label="Feature Tag"
                          />
                        </span>
                      )}
                      {item.subtitle && (
                        <span className="text-xs font-mono text-zinc-500">
                          <EditableText
                            value={item.subtitle}
                            onChange={(v) => handleUpdateItem(sec.id, item.id, 'subtitle', v)}
                            isOwner={isOwner}
                            label="Feature Subtitle"
                          />
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-display font-semibold text-zinc-100">
                      <EditableText
                        value={item.title}
                        onChange={(v) => handleUpdateItem(sec.id, item.id, 'title', v)}
                        isOwner={isOwner}
                        label="Feature Title"
                        as="span"
                      />
                    </h4>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      <EditableText
                        value={item.description}
                        onChange={(v) => handleUpdateItem(sec.id, item.id, 'description', v)}
                        isOwner={isOwner}
                        label="Feature Description"
                        multiline={true}
                        as="span"
                      />
                    </p>
                  </div>

                  {item.linkText && (
                    <div className="shrink-0">
                      <span className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-mono inline-flex items-center gap-1.5">
                        <EditableText
                          value={item.linkText}
                          onChange={(v) => handleUpdateItem(sec.id, item.id, 'linkText', v)}
                          isOwner={isOwner}
                          label="Button Text"
                        />
                        <ExternalLink className="w-3 h-3 text-red-500" />
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Inline Owner Add Section prompt */}
      {isOwner && onAddSectionClick && (
        <div className="text-center py-6 border-2 border-dashed border-zinc-800 hover:border-red-500/50 rounded-2xl transition-colors">
          <button
            onClick={() => onAddSectionClick(tab)}
            className="px-5 py-2.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/60 rounded-xl text-xs font-mono inline-flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-red-500" />
            <span>+ Add New Section in {tab.toUpperCase()} Tab</span>
          </button>
          <p className="text-[11px] font-mono text-zinc-500 mt-2">
            Organize new accolades, technical breakdowns, level mechanics, or studio rigs.
          </p>
        </div>
      )}
    </div>
  );
};
