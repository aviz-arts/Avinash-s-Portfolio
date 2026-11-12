import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  Sparkles,
  HelpCircle,
  Sliders,
} from 'lucide-react';
import { DEFAULT_CONTACT_OPTIONS } from '../../utils/portfolioStorage';

interface ContactOptionsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOptions: string[];
  onSave: (newOptions: string[]) => void;
}

const PRESET_SUGGESTIONS = [
  'Gameplay Systems & Combat Verbs (Loops & Pacing)',
  'Level Architecture & 3D Encounter Blockouts',
  'UE5 Lighting Art & Dynamic Lumen Polish',
  'Lead Game Designer / Creative Director Opportunity',
  'Frametime Profiling & 60 FPS Console Optimization',
  'Milestone Freelance & Lighting Contract',
  'General Coffee Chat / Design Mentorship',
];

export const ContactOptionsEditorModal: React.FC<ContactOptionsEditorModalProps> = ({
  isOpen,
  onClose,
  currentOptions,
  onSave,
}) => {
  const [options, setOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOptions(currentOptions && currentOptions.length > 0 ? [...currentOptions] : [...DEFAULT_CONTACT_OPTIONS]);
      setNewOptionInput('');
      setErrorMsg('');
    }
  }, [isOpen, currentOptions]);

  if (!isOpen) return null;

  const handleUpdateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1) {
      setErrorMsg('You must have at least one option in the dropdown list.');
      return;
    }
    const next = options.filter((_, i) => i !== index);
    setOptions(next);
    setErrorMsg('');
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...options];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    setOptions(next);
  };

  const handleMoveDown = (index: number) => {
    if (index === options.length - 1) return;
    const next = [...options];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    setOptions(next);
  };

  const handleAddNewOption = (textToAdd?: string) => {
    const val = (textToAdd || newOptionInput).trim();
    if (!val) return;
    if (options.includes(val)) {
      setErrorMsg('This option already exists in the list.');
      return;
    }
    setOptions([...options, val]);
    setNewOptionInput('');
    setErrorMsg('');
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset dropdown options to the default 5 options?')) {
      setOptions([...DEFAULT_CONTACT_OPTIONS]);
      setErrorMsg('');
    }
  };

  const handleSave = () => {
    const cleaned = options.map((o) => o.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      setErrorMsg('Please specify at least one valid dropdown option.');
      return;
    }
    onSave(cleaned);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 text-zinc-200 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-500 shadow-sm shadow-red-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-red-500 tracking-wider font-semibold uppercase">
                CONTACT FORM CUSTOMIZATION
              </div>
              <h3 className="text-xl font-display font-bold text-white">
                Edit "Project Focus / Role" Options
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed font-light">
          Customize the dropdown options that visitors and studios see when choosing their project inquiry focus. Edit any text line, reorder, or add custom services.
        </p>

        {errorMsg && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs font-mono text-red-300">
            {errorMsg}
          </div>
        )}

        {/* Existing Options List */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          <div className="text-[11px] font-mono text-zinc-400 font-semibold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Current Dropdown Options ({options.length})</span>
            <span className="text-zinc-600">Drag or use arrows to reorder</span>
          </div>

          {options.map((opt, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700 rounded-xl transition-colors group"
            >
              {/* Order number */}
              <span className="w-6 text-center text-[11px] font-mono font-bold text-zinc-500 shrink-0">
                {index + 1}.
              </span>

              {/* Editable Text Input */}
              <input
                type="text"
                value={opt}
                onChange={(e) => handleUpdateOption(index, e.target.value)}
                className="flex-1 px-3 py-1.5 bg-black/60 border border-zinc-800 focus:border-red-500 rounded-lg text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
                placeholder="Option label..."
              />

              {/* Reorder Buttons */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMoveUp(index)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 disabled:opacity-20 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Move Up"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === options.length - 1}
                  onClick={() => handleMoveDown(index)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-200 disabled:opacity-20 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Move Down"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Remove option"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Option Field */}
        <div className="pt-2 border-t border-zinc-900 space-y-3">
          <div className="text-[11px] font-mono text-zinc-400 font-semibold uppercase tracking-wider">
            Add New Option
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newOptionInput}
              onChange={(e) => setNewOptionInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddNewOption();
                }
              }}
              placeholder="e.g. Combat Loop Balancing & Weapon Tuning..."
              className="flex-1 px-3.5 py-2.5 bg-zinc-900/90 border border-zinc-800 focus:border-red-500 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => handleAddNewOption()}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Preset Suggestions */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-red-500" />
              <span>Quick Suggestions (Click to add):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_SUGGESTIONS.filter((s) => !options.includes(s))
                .slice(0, 4)
                .map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddNewOption(suggestion)}
                    className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/40 rounded-lg text-[10px] font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer text-left"
                  >
                    + {suggestion}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-zinc-900 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 text-zinc-400 hover:text-red-400 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-mono transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Options</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
