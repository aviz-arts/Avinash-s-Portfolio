import React from 'react';
import { CustomSection, CustomSectionItem } from '../../utils/portfolioStorage';
import { getAdaptiveGridClass } from '../../utils/layoutHelpers';
import { EditableText } from '../common/EditableText';
import { Plus, Trash2, Edit3, ExternalLink, Sparkles } from 'lucide-react';

interface CustomSectionRendererProps {
  sections: CustomSection[];
  tab: 'home' | 'work' | 'about' | 'resume' | 'contact';
  isOwner: boolean;
  onUpdateSection?: (id: string, updated: Partial<CustomSection>) => void;
  onDeleteSection?: (id: string) => void;
  onAddSectionClick?: (tab: 'home' | 'work' | 'about' | 'resume' | 'contact') => void;
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
  // Filter sections assigned to this tab — synchronized so hidden/removed sections stay off-page in both Owner and Visitor modes
  const tabSections = sections
    .filter((sec) => sec.tab === tab && sec.visible !== false)
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
    onUpdateSection?.(sectionId, { items: updatedItems });
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
    onUpdateSection?.(sectionId, { items: [...sec.items, newItem] });
  };

  const handleDeleteItem = (sectionId: string, itemId: string) => {
    const sec = sections.find((s) => s.id === sectionId);
    if (!sec) return;
    const updatedItems = sec.items.filter((item) => item.id !== itemId);
    onUpdateSection?.(sectionId, { items: updatedItems });
  };

  return (
    <div className="space-y-8 mt-8 print:mt-4 print:space-y-5">
      {tabSections.map((sec) => (
        <div
          key={sec.id}
          className="relative p-6 sm:p-8 rounded-3xl border bg-zinc-900/30 border-zinc-800/80 shadow-xl transition-all print:p-5 print:rounded-xl print:bg-white print:border-zinc-300 print:shadow-none print:break-inside-avoid"
        >
          {/* Owner Quick Controls Bar */}
          {isOwner && (
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-zinc-800/80 bg-zinc-900/60 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 p-4 rounded-t-3xl print:hidden">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-800/60">
                  Custom Section ({sec.tab.toUpperCase()} TAB)
                </span>
                <span className="text-zinc-500">Layout: {sec.layout}</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => handleAddItem(sec.id)}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium flex items-center gap-1 transition-colors shadow-sm shadow-red-600/30 cursor-pointer"
                  title="Add another card or item to this section"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Card</span>
                </button>
                {onEditSectionClick && (
                  <button
                    onClick={() => onEditSectionClick(sec)}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Change section layout, tab, or settings"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-red-400" />
                    <span>Settings</span>
                  </button>
                )}
                <button
                  onClick={() => onDeleteSection?.(sec.id)}
                  className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Remove this section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}

          {/* Section Header */}
          <div className="max-w-3xl mb-6">
            <div className="text-xs font-mono text-red-500 print:text-red-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-red-500 print:text-red-700" />
              <EditableText
                value={sec.kicker}
                onChange={(val) => onUpdateSection?.(sec.id, { kicker: val })}
                isOwner={isOwner}
                label="Section Kicker"
              />
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-zinc-100 print:text-zinc-950 tracking-tight">
              <EditableText
                value={sec.title}
                onChange={(val) => onUpdateSection?.(sec.id, { title: val })}
                isOwner={isOwner}
                label="Section Title"
                as="span"
              />
            </h3>
            {sec.description && (
              <p className="text-sm text-zinc-400 print:text-zinc-700 leading-relaxed mt-2.5">
                <EditableText
                  value={sec.description}
                  onChange={(val) => onUpdateSection?.(sec.id, { description: val })}
                  isOwner={isOwner}
                  label="Section Description"
                  multiline={true}
                  as="span"
                />
              </p>
            )}
          </div>

          {/* Empty state if cards removed */}
          {sec.items.length === 0 && sec.layout !== 'callout' && (
            <div className="p-6 border border-dashed border-zinc-800 rounded-2xl text-center text-xs font-mono text-zinc-500 space-y-2">
              <p>No cards in this section yet.</p>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleAddItem(sec.id)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Card</span>
                </button>
              )}
            </div>
          )}

          {/* Content Layouts */}
          {sec.layout === 'cards' && sec.items.length > 0 && (
            <div className={getAdaptiveGridClass(sec.items.length, 'cards')}>
              {sec.items.map((item) => (
                <div
                  key={item.id}
                  className="group relative p-6 bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800 rounded-2xl flex flex-col transition-all h-full print:bg-zinc-50 print:border-zinc-300"
                >
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteItem(sec.id, item.id)}
                      className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-950/80 rounded-lg border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer"
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

                    <h4 className="text-base sm:text-lg font-display font-semibold text-zinc-100 print:text-zinc-950 leading-snug">
                      <EditableText
                        value={item.title}
                        onChange={(v) => handleUpdateItem(sec.id, item.id, 'title', v)}
                        isOwner={isOwner}
                        label="Card Title"
                        as="span"
                      />
                    </h4>

                    {item.subtitle && (
                      <div className="text-xs font-mono text-zinc-400 print:text-zinc-600">
                        <EditableText
                          value={item.subtitle}
                          onChange={(v) => handleUpdateItem(sec.id, item.id, 'subtitle', v)}
                          isOwner={isOwner}
                          label="Card Subtitle"
                        />
                      </div>
                    )}

                    <p className="text-xs text-zinc-400 print:text-zinc-700 leading-relaxed pt-1">
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
                    <div className="pt-4 mt-auto border-t border-zinc-800/80">
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

          {sec.layout === 'split' && sec.items.length > 0 && (
            <div className={getAdaptiveGridClass(sec.items.length, 'split')}>
              {sec.items.map((item) => (
                <div
                  key={item.id}
                  className="group relative p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex flex-col h-full"
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

          {/* Stats KPI Strip Layout */}
          {sec.layout === 'stats' && (
            <div className="space-y-4">
              {sec.items.length > 0 && (
                <div className={getAdaptiveGridClass(sec.items.length, 'stats')}>
                  {sec.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="group relative p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1 transition-all hover:border-zinc-700 print:bg-zinc-50 print:border-zinc-300"
                    >
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteItem(sec.id, item.id)}
                        className="absolute top-2.5 right-2.5 p-1 text-zinc-500 hover:text-red-400 bg-zinc-900 rounded border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity print:hidden cursor-pointer"
                        title="Delete stat metric"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <div
                      className={`text-2xl font-display font-extrabold ${
                        idx === 1 || item.tag?.toLowerCase().includes('red')
                          ? 'text-red-500 print:text-red-700'
                          : 'text-white print:text-zinc-950'
                      }`}
                    >
                      <EditableText
                        value={item.title}
                        onChange={(v) => handleUpdateItem(sec.id, item.id, 'title', v)}
                        isOwner={isOwner}
                        label="Stat Metric"
                        as="span"
                      />
                    </div>
                    <div className="text-xs font-mono text-zinc-500 print:text-zinc-600 leading-snug">
                      <EditableText
                        value={item.subtitle || item.description}
                        onChange={(v) => handleUpdateItem(sec.id, item.id, 'subtitle', v)}
                        isOwner={isOwner}
                        label="Stat Label"
                        as="span"
                      />
                    </div>
                  </div>
                  ))}
                </div>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleAddItem(sec.id)}
                  className="text-[11px] font-mono text-red-400 hover:underline flex items-center gap-1 cursor-pointer print:hidden"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Stat Card</span>
                </button>
              )}
            </div>
          )}

          {/* Callout / Executive Profile Banner Layout */}
          {sec.layout === 'callout' && (
            <div className="p-8 bg-zinc-950/80 border border-zinc-800 rounded-3xl space-y-3 print:bg-zinc-50 print:border-zinc-300 print:p-5 print:rounded-xl">
              <div className="text-xs font-mono uppercase tracking-widest text-red-500 print:text-red-700 font-semibold">
                <EditableText
                  value={sec.kicker || 'EXECUTIVE PROFILE'}
                  onChange={(val) => onUpdateSection?.(sec.id, { kicker: val })}
                  isOwner={isOwner}
                  label="Callout Kicker"
                />
              </div>
              <p className="text-sm sm:text-base text-zinc-300 print:text-zinc-800 font-light leading-relaxed">
                <EditableText
                  value={sec.description || sec.title}
                  onChange={(val) => onUpdateSection?.(sec.id, { description: val })}
                  isOwner={isOwner}
                  label="Executive Narrative Copy"
                  multiline={true}
                  as="span"
                />
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Inline Owner Add Section prompt */}
      {isOwner && onAddSectionClick && (
        <div className="text-center py-6 border-2 border-dashed border-zinc-800 hover:border-red-500/50 rounded-2xl transition-colors print:hidden">
          <button
            onClick={() => onAddSectionClick(tab)}
            className="px-5 py-2.5 bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/60 rounded-xl text-xs font-mono inline-flex items-center gap-2 transition-all shadow-sm cursor-pointer"
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
