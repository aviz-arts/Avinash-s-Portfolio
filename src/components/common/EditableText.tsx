import React, { useState, useEffect, useRef } from 'react';
import { Edit3, Check, X } from 'lucide-react';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  isOwner: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  className?: string;
  multiline?: boolean;
  label?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  isOwner,
  as: Component = 'span',
  className = '',
  multiline = false,
  label,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  if (!isOwner) {
    return <Component className={className}>{value}</Component>;
  }

  const handleSave = () => {
    setIsEditing(false);
    if (draft.trim() !== value) {
      onChange(draft.trim());
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <span className="relative inline-block w-full z-20" onClick={(e) => e.stopPropagation()}>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            rows={3}
            className={`w-full p-2 bg-zinc-900 border-2 border-red-500 rounded-lg text-zinc-100 font-sans text-xs focus:outline-none shadow-2xl resize-y ${className}`}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className={`w-full px-2 py-1 bg-zinc-900 border-2 border-red-500 rounded text-zinc-100 font-sans text-xs focus:outline-none shadow-2xl ${className}`}
          />
        )}
        <span className="absolute -top-7 right-0 flex items-center gap-1 bg-zinc-950 px-2 py-0.5 rounded border border-red-500/40 text-[10px] font-mono text-red-400 shadow-md">
          <span>{label || 'Edit'}</span>
          <span className="text-zinc-500">· Enter to save</span>
        </span>
      </span>
    );
  }

  return (
    <Component
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title={`Owner: Click to edit "${label || 'text'}"`}
      className={`group/edit relative cursor-pointer hover:outline-dashed hover:outline-1 hover:outline-red-500/80 hover:bg-red-500/10 rounded px-1 -mx-1 transition-all ${className}`}
    >
      {value}
      <span className="inline-block opacity-0 group-hover/edit:opacity-100 transition-opacity ml-1.5 align-middle">
        <Edit3 className="w-3 h-3 text-red-500 inline" />
      </span>
    </Component>
  );
};
