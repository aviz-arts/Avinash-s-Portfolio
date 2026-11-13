import React, { useState, useRef, useEffect } from 'react';
import {
  Linkedin,
  Instagram,
  Youtube,
  Github,
  Edit2,
  ExternalLink,
  Check,
  X,
  Save,
} from 'lucide-react';
import { SiteContent } from '../../utils/portfolioStorage';

interface SocialShowcaseProps {
  siteContent: SiteContent;
  isOwner?: boolean;
  onUpdateSiteContent?: (key: keyof SiteContent, value: any) => void;
  onRemoveSection?: () => void;
}

interface SocialItem {
  id: string;
  name: string;
  key: keyof SiteContent;
  url: string;
  brandColor: string;
  renderIcon: (className?: string) => React.ReactNode;
}

export const SocialShowcase: React.FC<SocialShowcaseProps> = ({
  siteContent,
  isOwner = false,
  onUpdateSiteContent,
  onRemoveSection,
}) => {
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [draftUrl, setDraftUrl] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActiveEditingId(null);
      }
    };
    if (activeEditingId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activeEditingId]);

  const socialItems: SocialItem[] = [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      key: 'socialLinkedinUrl',
      url: siteContent.socialLinkedinUrl || 'https://linkedin.com/in/avinash',
      brandColor: '#0A66C2',
      renderIcon: (cls) => <Linkedin className={cls || 'w-5 h-5'} />,
    },
    {
      id: 'artstation',
      name: 'ArtStation',
      key: 'socialArtstationUrl',
      url: siteContent.socialArtstationUrl || 'https://artstation.com/avinash',
      brandColor: '#13AFF0',
      renderIcon: (cls) => (
        // Official ArtStation Emblem
        <svg
          role="img"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={cls || 'w-5 h-5'}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0 17.723l2.027 3.505h.001a2.424 2.424 0 0 0 2.164 1.333h13.457l-2.792-4.838H0zm24 .025c0-.484-.143-.935-.388-1.314L15.728 2.728a2.424 2.424 0 0 0-2.142-1.289H9.419L21.598 22.54l1.92-3.325c.378-.637.482-.919.482-1.467zm-11.129-3.462L7.428 4.858l-5.444 9.428h10.887z" />
        </svg>
      ),
    },
    {
      id: 'instagram',
      name: 'Instagram',
      key: 'socialInstagramUrl',
      url: siteContent.socialInstagramUrl || 'https://instagram.com/avinash',
      brandColor: '#E1306C',
      renderIcon: (cls) => <Instagram className={cls || 'w-5 h-5'} />,
    },
    {
      id: 'youtube',
      name: 'YouTube',
      key: 'socialYoutubeUrl',
      url: siteContent.socialYoutubeUrl || 'https://youtube.com',
      brandColor: '#FF0000',
      renderIcon: (cls) => <Youtube className={cls || 'w-5 h-5'} />,
    },
    {
      id: 'github',
      name: 'GitHub',
      key: 'socialGithubUrl',
      url: siteContent.socialGithubUrl || 'https://github.com/avinash',
      brandColor: '#FFFFFF',
      renderIcon: (cls) => <Github className={cls || 'w-5 h-5'} />,
    },
  ];

  const handleOpenEdit = (item: SocialItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveEditingId(item.id);
    setDraftUrl(item.url);
  };

  const handleSave = (item: SocialItem) => {
    let finalUrl = draftUrl.trim();
    if (finalUrl && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }
    if (onUpdateSiteContent) {
      onUpdateSiteContent(item.key, finalUrl);
    }
    setActiveEditingId(null);
  };

  const hiddenIds = new Set(siteContent.contactHiddenSocials || []);
  const visibleSocials = socialItems.filter((item) => !hiddenIds.has(item.id));
  const hiddenSocials = socialItems.filter((item) => hiddenIds.has(item.id));

  const handleHideSocial = (id: string) => {
    const next = Array.from(new Set([...(siteContent.contactHiddenSocials || []), id]));
    onUpdateSiteContent?.('contactHiddenSocials', next);
    setActiveEditingId(null);
  };

  const handleRestoreSocial = (id: string) => {
    const next = (siteContent.contactHiddenSocials || []).filter((x) => x !== id);
    onUpdateSiteContent?.('contactHiddenSocials', next);
  };

  if (visibleSocials.length === 0 && !isOwner) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 my-2">
      {/* Subtle label with Owner Section Remove */}
      <div className="flex items-center gap-3">
        <div className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase font-semibold">
          CONNECT ON SOCIAL
        </div>
        {isOwner && onRemoveSection && (
          <button
            type="button"
            onClick={onRemoveSection}
            className="text-[10px] font-mono text-zinc-500 hover:text-red-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 cursor-pointer"
            title="Remove Social Links section"
          >
            Remove Section
          </button>
        )}
      </div>

      {/* Clean Logos Row with On-Point Edit & Individual Remove */}
      <div className="flex flex-wrap items-center justify-center gap-3 relative">
        {visibleSocials.map((item) => {
          const isEditing = activeEditingId === item.id;

          return (
            <div key={item.id} className="relative group">
              {isOwner ? (
                // Owner Mode: Clicking opens the on-point edit popover directly on that logo
                <button
                  type="button"
                  onClick={(e) => handleOpenEdit(item, e)}
                  className={`relative w-12 h-12 rounded-2xl bg-zinc-950 border flex items-center justify-center text-zinc-400 hover:text-white transition-all duration-200 cursor-pointer shadow-md ${
                    isEditing
                      ? 'border-red-500 ring-2 ring-red-500/40 text-red-400 scale-105'
                      : 'border-zinc-800/90 hover:border-red-500/60 hover:bg-zinc-900'
                  }`}
                  title={`Edit ${item.name} link`}
                >
                  {item.renderIcon('w-5 h-5 transition-transform group-hover:scale-110')}

                  {/* On-point edit badge */}
                  <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-red-600 border border-zinc-950 flex items-center justify-center text-white shadow-sm">
                    <Edit2 className="w-2.5 h-2.5" />
                  </span>
                </button>
              ) : (
                // Visitor Mode: Normal clean logo link opening profile
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-red-500/60 hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all duration-200 shadow-md group"
                  title={item.name}
                >
                  {item.renderIcon('w-5 h-5 transition-transform group-hover:scale-110')}
                </a>
              )}

              {/* On-Point Edit Popover (Directly Anchored to this Logo) */}
              {isOwner && isEditing && (
                <div
                  ref={popoverRef}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-72 sm:w-80 p-3.5 bg-zinc-950 border border-red-500/80 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 text-left"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      <span className="text-red-500">{item.renderIcon('w-4 h-4')}</span>
                      <span className="text-xs font-mono font-bold text-white">
                        Edit {item.name} Link
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveEditingId(null)}
                      className="p-1 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-900 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="url"
                      autoFocus
                      value={draftUrl}
                      onChange={(e) => setDraftUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSave(item);
                        } else if (e.key === 'Escape') {
                          setActiveEditingId(null);
                        }
                      }}
                      placeholder={`https://${item.id}.com/...`}
                      className="w-full px-3 py-2 bg-black/90 border border-zinc-700 focus:border-red-500 rounded-xl text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors"
                    />

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-mono text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleHideSocial(item.id)}
                          className="px-2 py-1 text-[11px] font-mono text-red-400 hover:text-red-300 bg-red-950/40 border border-red-900/50 rounded-lg transition-colors cursor-pointer"
                          title={`Remove ${item.name} icon`}
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveEditingId(null)}
                          className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSave(item)}
                          className="px-3 py-1 text-[11px] font-mono font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1 shadow-sm shadow-red-600/30 cursor-pointer"
                        >
                          <Save className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Popover caret pointing down to the logo */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-solid border-t-red-500/80 border-t-8 border-x-transparent border-x-8 border-b-0 w-0 h-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Owner quick restore for individually removed social icons */}
      {isOwner && hiddenSocials.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-[10px] font-mono text-zinc-500">Add back:</span>
          {hiddenSocials.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleRestoreSocial(item.id)}
              className="px-2 py-0.5 text-[10px] font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer"
            >
              + {item.name}
            </button>
          ))}
        </div>
      )}

      {/* Owner helper prompt */}
      {isOwner && visibleSocials.length > 0 && (
        <p className="text-[10px] font-mono text-zinc-500">
          Owner Mode: Click any logo above to edit its link or remove it
        </p>
      )}
    </div>
  );
};
