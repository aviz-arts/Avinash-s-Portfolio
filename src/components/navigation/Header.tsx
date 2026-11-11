import React, { useState } from 'react';
import { Menu, X, FileText, Mail, Home, Briefcase, User } from 'lucide-react';

interface HeaderProps {
  activeTab: 'home' | 'work' | 'about' | 'resume' | 'contact';
  onSelectTab: (tab: 'home' | 'work' | 'about' | 'resume' | 'contact') => void;
  onOpenContact: () => void;
  onOpenResume: () => void;
  avatarUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenContact,
  onOpenResume,
  avatarUrl = '/assets/aistudio/pic_fe23a188.jpg',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: 'home' | 'work' | 'about' | 'resume' | 'contact') => {
    setIsMobileMenuOpen(false);
    onSelectTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-6 py-3.5">
        {/* Zone 1: Portrait avatar + AVINASH heading + faded subtitle: Game Designer | Lighting Artist */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3.5 text-left group cursor-pointer shrink-0"
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-red-500/80 group-hover:border-red-400 transition-all duration-300 shadow-sm shadow-red-500/20 shrink-0">
            <img
              src={avatarUrl}
              alt="Avinash"
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-display font-black tracking-tight text-white group-hover:text-red-400 transition-colors uppercase leading-tight">
              AVINASH
            </span>
            <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors tracking-wider mt-0.5">
              Game Designer | Lighting Artist
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation tabs with animated active indicator */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase text-zinc-400 font-medium">
          {/* 1. Home Tab */}
          <button
            onClick={() => handleNavClick('home')}
            className={`relative py-1 transition-all duration-200 cursor-pointer ${
              activeTab === 'home' ? 'text-white font-bold' : 'hover:text-zinc-200'
            }`}
          >
            <span>Home</span>
            {activeTab === 'home' && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </button>

          {/* 2. Work Tab */}
          <button
            onClick={() => handleNavClick('work')}
            className={`relative py-1 transition-all duration-200 cursor-pointer ${
              activeTab === 'work' ? 'text-white font-bold' : 'hover:text-zinc-200'
            }`}
          >
            <span>Work</span>
            {activeTab === 'work' && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </button>

          {/* 3. About Tab */}
          <button
            onClick={() => handleNavClick('about')}
            className={`relative py-1 transition-all duration-200 cursor-pointer ${
              activeTab === 'about' ? 'text-white font-bold' : 'hover:text-zinc-200'
            }`}
          >
            <span>About</span>
            {activeTab === 'about' && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </button>

          {/* 4. Resume */}
          <button
            onClick={() => handleNavClick('resume')}
            className={`relative py-1 transition-all duration-200 cursor-pointer ${
              activeTab === 'resume' ? 'text-white font-bold' : 'hover:text-zinc-200'
            }`}
            title="Official Resume & Career Timeline"
          >
            <span>Resume</span>
            {activeTab === 'resume' && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </button>

          {/* 5. Contact */}
          <button
            onClick={() => handleNavClick('contact')}
            className={`relative py-1 transition-all duration-200 cursor-pointer ${
              activeTab === 'contact' ? 'text-white font-bold' : 'hover:text-zinc-200'
            }`}
            title="Let's Work Together · Contact"
          >
            <span>Contact</span>
            {activeTab === 'contact' && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            )}
          </button>
        </nav>

        {/* Zone 3: CTA action button + Mobile Menu Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => handleNavClick('contact')}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all duration-200 whitespace-nowrap shrink-0 font-sans shadow-md shadow-red-600/30 hover:shadow-red-600/50 cursor-pointer"
          >
            <span>Get In Touch</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-[#050505]/98 px-6 py-4 space-y-3 font-mono text-sm text-zinc-300 animate-in slide-in-from-top duration-200">
          <button
            onClick={() => handleNavClick('home')}
            className={`w-full text-left py-2 flex items-center gap-2.5 transition-colors ${
              activeTab === 'home' ? 'text-red-400 font-bold' : 'hover:text-red-400'
            }`}
          >
            <Home className="w-4 h-4 text-zinc-500" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleNavClick('work')}
            className={`w-full text-left py-2 flex items-center gap-2.5 transition-colors ${
              activeTab === 'work' ? 'text-red-400 font-bold' : 'hover:text-red-400'
            }`}
          >
            <Briefcase className="w-4 h-4 text-zinc-500" />
            <span>Work</span>
          </button>

          <button
            onClick={() => handleNavClick('about')}
            className={`w-full text-left py-2 flex items-center gap-2.5 transition-colors ${
              activeTab === 'about' ? 'text-red-400 font-bold' : 'hover:text-red-400'
            }`}
          >
            <User className="w-4 h-4 text-zinc-500" />
            <span>About</span>
          </button>

          <button
            onClick={() => handleNavClick('resume')}
            className={`w-full text-left py-2 flex items-center gap-2.5 transition-colors ${
              activeTab === 'resume' ? 'text-red-400 font-bold' : 'hover:text-red-400'
            }`}
          >
            <FileText className="w-4 h-4 text-red-400" />
            <span>Resume</span>
          </button>

          <button
            onClick={() => handleNavClick('contact')}
            className={`w-full text-left py-2 flex items-center gap-2.5 transition-colors ${
              activeTab === 'contact' ? 'text-red-400 font-bold' : 'hover:text-red-400'
            }`}
          >
            <Mail className="w-4 h-4 text-zinc-500" />
            <span>Contact</span>
          </button>

          <div className="pt-2 border-t border-zinc-800">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenContact();
              }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg text-xs font-sans text-center shadow-md shadow-red-600/25"
            >
              Get In Touch
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
