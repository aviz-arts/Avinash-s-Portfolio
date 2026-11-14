import React, { useState } from 'react';

interface HeaderProps {
  activeTab: 'home' | 'work' | 'about' | 'resume' | 'contact';
  onSelectTab: (tab: 'home' | 'work' | 'about' | 'resume' | 'contact') => void;
  onOpenContact?: () => void;
  onOpenResume?: () => void;
  avatarUrl?: string;
  onOpenOwnerLogin?: () => void;
  isOwner?: boolean;
  showOwnerTrigger?: boolean;
}

const NAV_TABS: Array<{
  id: 'home' | 'work' | 'about' | 'resume' | 'contact';
  label: string;
  title?: string;
}> = [
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'resume', label: 'Resume', title: 'Official Resume & Benchmarks' },
  { id: 'contact', label: 'Contact', title: "Let's Work Together · Contact" },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  avatarUrl = '/assets/aistudio/pic_fe23a188.jpg',
  onOpenOwnerLogin,
}) => {
  const [avatarClicks, setAvatarClicks] = useState<number[]>([]);

  const handleNavClick = (tab: 'home' | 'work' | 'about' | 'resume' | 'contact') => {
    onSelectTab(tab);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const recent = [...avatarClicks.filter((t) => now - t < 1200), now];
    setAvatarClicks(recent);
    if (recent.length >= 3) {
      e.preventDefault();
      e.stopPropagation();
      onOpenOwnerLogin?.();
      setAvatarClicks([]);
      return;
    }
    handleNavClick('home');
  };

  return (
    <header className="print:hidden sticky top-0 z-40 bg-[#050505]/98 border-b border-zinc-800/80">
      <div className="w-full max-w-[1680px] mx-auto flex flex-wrap items-center justify-between gap-y-2.5 gap-x-2 md:flex-nowrap md:gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6 px-3.5 sm:px-6 lg:px-10 xl:px-14 py-3 md:py-3.5">
        {/* Zone 1: Portrait avatar + AVINASH heading + faded subtitle */}
        <button
          onClick={handleAvatarClick}
          className="order-1 flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer min-w-0 lg:justify-self-start"
          title="Avinash · Game Designer | Lighting Artist"
        >
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 border-red-500/80 group-hover:border-red-400 transition-colors duration-200 shadow-sm shadow-red-500/20 shrink-0">
            <img
              src={avatarUrl}
              alt="Avinash"
              decoding="async"
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base sm:text-xl font-display font-black tracking-tight text-white group-hover:text-red-400 transition-colors uppercase leading-tight truncate">
              AVINASH
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors tracking-wider mt-0.5 truncate">
              Game Designer | Lighting Artist
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation tabs directly in the header for Mobile, Tablet & Desktop */}
        <nav
          aria-label="Primary Navigation"
          className="order-3 w-full pt-2 border-t border-zinc-800/60 flex items-center justify-center gap-4 min-[400px]:gap-6 sm:gap-8 md:order-2 md:w-auto md:pt-0 md:border-t-0 md:gap-4 lg:gap-8 lg:justify-self-center shrink-0 text-[11px] sm:text-xs font-mono tracking-wider uppercase text-zinc-400 font-medium"
        >
          {NAV_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleNavClick(tab.id)}
                title={tab.title}
                className={`relative py-1 transition-colors duration-150 cursor-pointer whitespace-nowrap ${
                  isActive ? 'text-white font-bold' : 'hover:text-zinc-200'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: CTA action button (always visible, zero hamburger dropdown) */}
        <div className="order-2 md:order-3 flex items-center gap-3 shrink-0 lg:justify-self-end">
          <button
            onClick={() => handleNavClick('contact')}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0 font-sans shadow-md shadow-red-600/30 hover:shadow-red-600/50 cursor-pointer"
          >
            <span>Get In Touch</span>
          </button>
        </div>
      </div>
    </header>
  );
};
