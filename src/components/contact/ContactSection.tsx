import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Copy,
  Check,
  Send,
  ExternalLink,
  MapPin,
  Youtube,
  Linkedin,
  Instagram,
  GraduationCap,
  Github,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { SiteContent, CustomSection } from '../../utils/portfolioStorage';
import { EditableText } from '../common/EditableText';
import { CustomSectionRenderer } from '../portfolio/CustomSectionRenderer';

interface ContactSectionProps {
  siteContent: SiteContent;
  isOwner?: boolean;
  onUpdateSiteContent?: (key: keyof SiteContent, value: string) => void;
  customSections?: CustomSection[];
  onUpdateCustomSection?: (id: string, updated: Partial<CustomSection>) => void;
  onDeleteCustomSection?: (id: string) => void;
  onAddSectionClick?: (tab: 'home' | 'work' | 'about' | 'resume' | 'contact') => void;
  onEditSectionClick?: (section: CustomSection) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  siteContent,
  isOwner = false,
  onUpdateSiteContent,
  customSections = [],
  onUpdateCustomSection,
  onDeleteCustomSection,
  onAddSectionClick,
  onEditSectionClick,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: 'Game Design & Core Mechanics',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const email = siteContent.contactEmail || 'avinashr5904@gmail.com';
  const phone = siteContent.contactPhone || '+91 9361287193';

  const handleUpdate = (key: keyof SiteContent, val: string) => {
    if (onUpdateSiteContent) {
      onUpdateSiteContent(key, val);
    }
  };

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] py-16 sm:py-24 overflow-hidden bg-[#050505]">
      {/* Atmospheric ambient lighting & vignette */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-red-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[300px] bg-zinc-800/20 blur-[130px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#050505]/70 to-[#000000]" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10 space-y-16">
        {/* 1. Header Display: Kicker + Let's Work Together */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="text-xs font-mono tracking-widest text-red-500 uppercase font-semibold">
            <EditableText
              value={siteContent.contactKicker || 'GET IN TOUCH'}
              onChange={(v) => handleUpdate('contactKicker', v)}
              isOwner={isOwner}
              label="Contact Kicker"
            />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black text-white tracking-tight">
            <EditableText
              value={siteContent.contactHeadline || "Let's Work Together"}
              onChange={(v) => handleUpdate('contactHeadline', v)}
              isOwner={isOwner}
              label="Contact Headline"
              as="span"
            />
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed max-w-xl mx-auto pt-2">
            <EditableText
              value={
                siteContent.contactSubtitle ||
                "Have a project in mind? I'd love to hear about it. Reach out for collaborations, freelance work, or just to say hello."
              }
              onChange={(v) => handleUpdate('contactSubtitle', v)}
              isOwner={isOwner}
              label="Contact Subtitle"
              multiline={true}
              as="span"
            />
          </p>
        </div>

        {/* 2. Two Primary Cards: Email & Phone (Matching user reference layout) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: EMAIL */}
          <div className="relative group bg-zinc-950/80 hover:bg-zinc-900/80 border border-zinc-800/90 hover:border-red-500/60 rounded-3xl p-7 transition-all duration-300 shadow-xl backdrop-blur-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-red-500 group-hover:scale-105 group-hover:border-red-500/40 transition-all duration-300">
                  <Mail className="w-5 h-5 text-red-500" />
                </div>

                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Copy email address"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-red-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  EMAIL
                </div>
                <div className="text-lg sm:text-xl font-display font-bold text-white group-hover:text-red-400 transition-colors mt-0.5 break-all">
                  <EditableText
                    value={email}
                    onChange={(v) => handleUpdate('contactEmail', v)}
                    isOwner={isOwner}
                    label="Contact Email"
                  />
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                <EditableText
                  value={
                    siteContent.contactEmailNote ||
                    'Best for project inquiries and collaborations. I typically respond within 24-48 hours.'
                  }
                  onChange={(v) => handleUpdate('contactEmailNote', v)}
                  isOwner={isOwner}
                  label="Email Note"
                  multiline={true}
                  as="span"
                />
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-zinc-900 flex items-center justify-between">
              <a
                href={`mailto:${email}?subject=Game%20Design%20%2F%20Lighting%20Inquiry`}
                className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
              >
                <span>Compose Mail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-[11px] font-mono text-zinc-500">Fast Turnaround</span>
            </div>
          </div>

          {/* Card 2: PHONE / WHATSAPP */}
          <div className="relative group bg-zinc-950/80 hover:bg-zinc-900/80 border border-zinc-800/90 hover:border-red-500/60 rounded-3xl p-7 transition-all duration-300 shadow-xl backdrop-blur-xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-red-500 group-hover:scale-105 group-hover:border-red-500/40 transition-all duration-300">
                  <Phone className="w-5 h-5 text-red-500" />
                </div>

                <button
                  type="button"
                  onClick={handleCopyPhone}
                  className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Copy phone number"
                >
                  {copiedPhone ? <Check className="w-3.5 h-3.5 text-red-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                  PHONE / WHATSAPP
                </div>
                <div className="text-lg sm:text-xl font-display font-bold text-white group-hover:text-red-400 transition-colors mt-0.5">
                  <EditableText
                    value={phone}
                    onChange={(v) => handleUpdate('contactPhone', v)}
                    isOwner={isOwner}
                    label="Contact Phone"
                  />
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                <EditableText
                  value={
                    siteContent.contactPhoneNote ||
                    'For urgent matters or quick calls. Available during IST business hours.'
                  }
                  onChange={(v) => handleUpdate('contactPhoneNote', v)}
                  isOwner={isOwner}
                  label="Phone Note"
                  multiline={true}
                  as="span"
                />
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-zinc-900 flex items-center justify-between">
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="text-xs font-mono text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors"
              >
                <span>Direct Dial / WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-[11px] font-mono text-zinc-500">IST Business Hours</span>
            </div>
          </div>
        </div>

        {/* 3. Direct Message Inquiry Form */}
        <div className="max-w-2xl mx-auto bg-zinc-950/90 border border-zinc-800/90 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-display font-bold text-white">Send Direct Message</h3>
          </div>

          {isSubmitted ? (
            <div className="p-6 bg-zinc-900/80 border border-red-500/40 rounded-2xl text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/60 text-red-400 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-display font-bold text-white">Message Transmitted</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Thank you, {formData.name || 'there'}! Your inquiry regarding "{formData.projectType}" has been registered. You can also reach me directly at{' '}
                <a href={`mailto:${email}`} className="text-red-400 underline">
                  {email}
                </a>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({ name: '', email: '', projectType: 'Game Design & Core Mechanics', message: '' });
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 rounded-xl transition-colors cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-400 mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alex@studio.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Project Focus / Role</label>
                <select
                  value={formData.projectType}
                  onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 focus:outline-none focus:border-red-500 transition-colors cursor-pointer"
                >
                  <option value="Game Design & Core Mechanics">Game Design & Core Mechanics (Loops & Pacing)</option>
                  <option value="Level Design & 3D Blockout">Level Design & 3D Arena Blockout</option>
                  <option value="Unreal Engine 5 Lighting Art (Passion)">Unreal Engine 5 Lighting Art (Passion)</option>
                  <option value="Lead Role / Full-Time Studio Opportunity">Lead Role / Full-Time Studio Opportunity</option>
                  <option value="General Consultation">General Inquiry / Coffee Chat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Project Details / Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Share a brief overview of your game, timeline, or requirements..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition-colors font-sans shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Message</span>
              </button>
            </form>
          )}
        </div>

        {/* 4. CONNECT ON SOCIAL (Icons matching user reference) */}
        <div className="space-y-5 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-semibold">
            CONNECT ON SOCIAL
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {/* YouTube */}
            <a
              href={siteContent.socialYoutubeUrl || 'https://youtube.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-red-500/60 hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all duration-300 shadow-md group"
              title="YouTube"
            >
              <Youtube className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>

            {/* LinkedIn */}
            <a
              href={siteContent.socialLinkedinUrl || 'https://linkedin.com/in/avinash'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-red-500/60 hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all duration-300 shadow-md group"
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>

            {/* ArtStation */}
            <a
              href={siteContent.socialArtstationUrl || 'https://artstation.com/avinash'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-red-500/60 hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all duration-300 shadow-md group"
              title="ArtStation"
            >
              <svg className="w-5 h-5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M12 2L1 21h4.6l2.1-4h8.6l2.1 4H23L12 2zm-1.8 12.8L12 9.2l1.8 5.6h-3.6z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href={siteContent.socialInstagramUrl || 'https://instagram.com/avinash'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-red-500/60 hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all duration-300 shadow-md group"
              title="Instagram"
            >
              <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>

            {/* Academic / Scholar / Certifications */}
            <a
              href={siteContent.socialEducationUrl || '#'}
              className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-red-500/60 hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all duration-300 shadow-md group"
              title="Academic & Unreal Certifications"
            >
              <GraduationCap className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>

            {/* GitHub */}
            <a
              href={siteContent.socialGithubUrl || 'https://github.com/avinash'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800/90 hover:border-red-500/60 hover:bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-red-400 transition-all duration-300 shadow-md group"
              title="GitHub / Dev Prototypes"
            >
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>

        {/* 5. Location Badge (Matching user reference) */}
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-400 pt-4">
          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
          <span>
            <EditableText
              value={siteContent.contactLocationText || 'Based in India · Available Worldwide'}
              onChange={(v) => handleUpdate('contactLocationText', v)}
              isOwner={isOwner}
              label="Location Text"
            />
          </span>
        </div>

        {/* 6. Custom Sections assigned to Contact tab */}
        <CustomSectionRenderer
          sections={customSections}
          tab="contact"
          isOwner={isOwner}
          onUpdateSection={onUpdateCustomSection}
          onDeleteSection={onDeleteCustomSection}
          onAddSectionClick={onAddSectionClick}
          onEditSectionClick={onEditSectionClick}
        />

        {/* Owner Quick-Add Section bar on Contact tab */}
        {isOwner && (
          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
            <span className="text-zinc-400">
              Want to add a custom showcase, direct FAQ, or testimonial section to Contact?
            </span>
            <button
              type="button"
              onClick={() => onAddSectionClick?.('contact')}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-red-600/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>+ Add Section to Contact</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
