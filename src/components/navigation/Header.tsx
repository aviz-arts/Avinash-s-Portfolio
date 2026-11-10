import React, { useState } from 'react';
import { Menu, X, FileText, Mail, Home, Briefcase, User, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenContact: () => void;
  onOpenResume: () => void;
  activeSection?: string;
  avatarUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenContact,
  onOpenResume,
  activeSection = 'home',
  avatarUrl = '/assets/aistudio/pic_fe23a188.jpg',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (sectionId === 'resume') {
      onOpenResume();
    } else if (sectionId === 'contact') {
      onOpenContact();
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#050505]/95 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-6 py-4">
        {/* Zone 1: Portrait avatar + single text wordmark linking to top/home */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 text-left group cursor-pointer shrink-0"
        >
          <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-red-500/80 group-hover:border-red-400 transition-colors shadow-sm shadow-red-500/20 shrink-0">
            <img
              src={avatarUrl}
              alt="Avinash"
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                // Fallback to stylized initial if image not found
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="text-base sm:text-lg font-display font-bold tracking-tight text-white group-hover:text-red-400 transition-colors whitespace-nowrap">
            Avinash <span className="hidden lg:inline text-zinc-400 font-normal text-sm font-mono">— Game Designer & Lighting Artist</span>
          </div>
        </button>

        {/* Zone 2: 5 clean navigation tabs: Home, Work, About, Resume, Contact */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium tracking-wide uppercase text-zinc-400 font-mono">
          {/* 1. Home */}
          <button
            onClick={() => handleNavClick('home')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
              activeSection === 'home' ? 'text-red-400 font-bold' : ''
            }`}
          >
            Home
          </button>

          {/* 2. Work */}
          <button
            onClick={() => handleNavClick('work')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
              activeSection === 'work' || activeSection === 'featured' ? 'text-red-400 font-bold' : ''
            }`}
          >
            Work
          </button>

          {/* 3. About */}
          <button
            onClick={() => handleNavClick('about')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white cursor-pointer ${
              activeSection === 'about' ? 'text-red-400 font-bold' : ''
            }`}
          >
            About
          </button>

          {/* 4. Resume */}
          <button
            onClick={() => handleNavClick('resume')}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-red-400 cursor-pointer flex items-center gap-1.5"
          >
            <span>Resume</span>
          </button>

          {/* 5. Contact */}
          <button
            onClick={() => handleNavClick('contact')}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-red-400 cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* Zone 3: CTA action button + Mobile Menu Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenContact}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors whitespace-nowrap shrink-0 font-sans shadow-md shadow-red-600/25"
          >
            <span>Get In Touch</span>
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Home, Work, About, Resume, Contact) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-[#050505]/98 px-6 py-4 space-y-3 font-mono text-sm text-zinc-300 animate-in slide-in-from-top duration-200">
          <button
            onClick={() => handleNavClick('home')}
            className="w-full text-left py-2 hover:text-red-400 flex items-center gap-2.5 transition-colors"
          >
            <Home className="w-4 h-4 text-zinc-500" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleNavClick('work')}
            className="w-full text-left py-2 hover:text-red-400 flex items-center gap-2.5 transition-colors"
          >
            <Briefcase className="w-4 h-4 text-zinc-500" />
            <span>Work</span>
          </button>

          <button
            onClick={() => handleNavClick('about')}
            className="w-full text-left py-2 hover:text-red-400 flex items-center gap-2.5 transition-colors"
          >
            <User className="w-4 h-4 text-zinc-500" />
            <span>About</span>
          </button>

          <button
            onClick={() => handleNavClick('resume')}
            className="w-full text-left py-2 hover:text-red-400 flex items-center gap-2.5 transition-colors text-red-400"
          >
            <FileText className="w-4 h-4 text-red-400" />
            <span>Resume</span>
          </button>

          <button
            onClick={() => handleNavClick('contact')}
            className="w-full text-left py-2 hover:text-red-400 flex items-center gap-2.5 transition-colors"
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
