import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectItem } from './types/portfolio';
import { filterProjects } from './utils/lightingLogic';
import { Header } from './components/navigation/Header';
import { LightingStudio } from './components/studio/LightingStudio';
import { ProjectCard } from './components/portfolio/ProjectCard';
import { ProjectDetailModal } from './components/portfolio/ProjectDetailModal';
import { CinematicVideoPlayer } from './components/portfolio/CinematicVideoPlayer';
import { LightingComparisonSlider } from './components/portfolio/LightingComparisonSlider';
import { AboutSection } from './components/about/AboutSection';
import { ContactSection } from './components/contact/ContactSection';
import { ResumeSection } from './components/resume/ResumeSection';
import { ContactModal } from './components/contact/ContactModal';
import { OwnerBar } from './components/owner/OwnerBar';
import { OwnerLoginModal } from './components/owner/OwnerLoginModal';
import { ProjectEditorModal } from './components/owner/ProjectEditorModal';
import { ProfileEditorModal } from './components/owner/ProfileEditorModal';
import { ResumeUploaderModal } from './components/resume/ResumeUploaderModal';
import { SiteContentEditorModal } from './components/owner/SiteContentEditorModal';
import { SectionManagerModal } from './components/owner/SectionManagerModal';
import { CustomSectionRenderer } from './components/portfolio/CustomSectionRenderer';
import { EditableText } from './components/common/EditableText';
import { CustomCursor } from './components/common/CustomCursor';
import {
  getStoredProjects,
  saveStoredProjects,
  getStoredProfile,
  saveStoredProfile,
  getStoredSiteContent,
  saveStoredSiteContent,
  updateSiteContentKey,
  getStoredResumePdf,
  saveStoredResumePdf,
  generateDefaultResumePdfDataUrl,
  getStoredCustomSections,
  saveStoredCustomSections,
  updateCustomSection,
  deleteCustomSection,
  createCustomSection,
  getStoredResumeMilestones,
  saveStoredResumeMilestones,
  createResumeMilestone,
  updateResumeMilestone,
  deleteResumeMilestone,
  isOwnerSessionActive,
  setOwnerSession,
  createProject,
  updateProject,
  deleteProject,
  resetPortfolioToDefaults,
  exportPortfolioBackup,
  importPortfolioBackup,
  OwnerProfile,
  SiteContent,
  StoredResumePdf,
  CustomSection,
  ResumeMilestone,
  DEFAULT_AVATAR_URL,
} from './utils/portfolioStorage';
import {
  Compass,
  Zap,
  Layers,
  ArrowRight,
  Search,
  Sparkles,
  Box,
  Lock,
  CheckCircle2,
  Download,
  FileText,
  Upload,
  Image as ImageIcon,
  Film,
  RotateCcw,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'work' | 'about' | 'resume' | 'contact'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [studioScene, setStudioScene] = useState<'cyberpunk' | 'crypt' | 'turret'>('cyberpunk');
  const [siteContentEditorTab, setSiteContentEditorTab] = useState<'hero' | 'studio' | 'works' | 'reels' | 'level' | 'about' | 'contact' | 'footer'>('hero');

  // Persistent State
  const [projects, setProjects] = useState<ProjectItem[]>(() => getStoredProjects());
  const [profile, setProfile] = useState<OwnerProfile>(() => getStoredProfile());
  const [siteContent, setSiteContent] = useState<SiteContent>(() => getStoredSiteContent());
  const [resumePdf, setResumePdf] = useState<StoredResumePdf | null>(() => getStoredResumePdf());
  const [customSections, setCustomSections] = useState<CustomSection[]>(() => getStoredCustomSections());
  const [resumeMilestones, setResumeMilestones] = useState<ResumeMilestone[]>(() => getStoredResumeMilestones());

  // Owner Mode State
  const [isOwner, setIsOwner] = useState<boolean>(() => isOwnerSessionActive());
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isOwnerLoginOpen, setIsOwnerLoginOpen] = useState(false);
  const [isProjectEditorOpen, setIsProjectEditorOpen] = useState(false);
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isResumeUploaderOpen, setIsResumeUploaderOpen] = useState(false);
  const [isSiteContentEditorOpen, setIsSiteContentEditorOpen] = useState(false);
  const [isSectionManagerOpen, setIsSectionManagerOpen] = useState(false);
  const [sectionManagerTargetTab, setSectionManagerTargetTab] = useState<'home' | 'work' | 'about' | 'resume' | 'contact'>('work');
  const [editingCustomSection, setEditingCustomSection] = useState<CustomSection | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check URL query on mount (?owner or ?admin)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('owner') || params.has('admin')) {
        setIsOwnerLoginOpen(true);
      }
    }
  }, []);

  // Shortcut Ctrl+Shift+E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (isOwner) {
          setIsPreviewMode((prev) => !prev);
        } else {
          setIsOwnerLoginOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwner]);

  const showBanner = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner(null);
    }, 4000);
  };

  // Filter projects using pure tested logic
  const filteredProjects = filterProjects(projects, selectedCategory, searchQuery);

  const handleOpenInStudio = (scene: 'cyberpunk' | 'crypt' | 'turret') => {
    setStudioScene(scene);
    setActiveTab('work');
    setTimeout(() => {
      const studioEl = document.getElementById('studio');
      if (studioEl) {
        studioEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  };

  // Direct Resume PDF Download Trigger
  const handleDownloadResume = () => {
    if (resumePdf && resumePdf.dataUrl) {
      const a = document.createElement('a');
      a.href = resumePdf.dataUrl;
      a.download = resumePdf.filename || 'Avinash_Game_Designer_Lighting_Artist_Resume.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showBanner(`Downloading Resume: ${resumePdf.filename}`);
    } else {
      if (isOwner && !isPreviewMode) {
        setIsResumeUploaderOpen(true);
        showBanner('Upload your custom Resume PDF here.');
      } else {
        const fallbackUrl = generateDefaultResumePdfDataUrl(profile);
        const a = document.createElement('a');
        a.href = fallbackUrl;
        a.download = `${profile.name}_Game_Designer_Lighting_Artist_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showBanner('Downloading official portfolio resume summary PDF.');
      }
    }
  };

  // Single-line text update handler for EditableText
  const handleUpdateSiteLine = <K extends keyof SiteContent>(key: K, val: string) => {
    const updated = updateSiteContentKey(key, val, siteContent);
    setSiteContent(updated);
    showBanner(`Updated: ${String(key)}`);
  };

  // Owner Handlers
  const handleAddNewProject = () => {
    setEditingProject(null);
    setIsProjectEditorOpen(true);
  };

  const handleEditProject = (proj: ProjectItem) => {
    setEditingProject(proj);
    setIsProjectEditorOpen(true);
  };

  const handleDeleteProject = (id: string) => {
    const updated = deleteProject(id, projects);
    setProjects(updated);
    showBanner('Project deleted successfully.');
  };

  const handleSaveProject = (savedProj: ProjectItem) => {
    if (editingProject) {
      const updated = updateProject(savedProj.id, savedProj, projects);
      setProjects(updated);
      showBanner(`Project "${savedProj.title}" updated.`);
    } else {
      const updated = createProject(savedProj, projects);
      setProjects(updated);
      showBanner(`New project "${savedProj.title}" published!`);
    }
  };

  const handleSaveProfile = (newProfile: OwnerProfile) => {
    saveStoredProfile(newProfile);
    setProfile(newProfile);
    if (newProfile.avatarUrl && newProfile.avatarUrl !== siteContent.avatarUrl) {
      handleUpdateSiteLine('avatarUrl', newProfile.avatarUrl);
    }
    showBanner('Site profile and experience updated.');
  };

  // Custom Sections Handlers (Add or manage sections in tabs)
  const handleUpdateCustomSection = (id: string, updated: Partial<CustomSection>) => {
    const res = updateCustomSection(id, updated, customSections);
    setCustomSections(res);
    showBanner('Custom section updated.');
  };

  const handleDeleteCustomSection = (id: string) => {
    const res = deleteCustomSection(id, customSections);
    setCustomSections(res);
    showBanner('Custom section deleted.');
  };

  const handleSaveCustomSections = (newSections: CustomSection[]) => {
    saveStoredCustomSections(newSections);
    setCustomSections(newSections);
    showBanner('Tab sections saved successfully!');
  };

  const handleOpenAddSection = (tab: 'home' | 'work' | 'about' | 'resume' | 'contact' = 'work') => {
    setEditingCustomSection(null);
    setSectionManagerTargetTab(tab);
    setIsSectionManagerOpen(true);
  };

  const handleOpenEditSection = (section: CustomSection) => {
    setEditingCustomSection(section);
    setSectionManagerTargetTab(section.tab);
    setIsSectionManagerOpen(true);
  };

  // Resume Milestones Handlers (Interactive timeline & photo upload)
  const handleUpdateResumeMilestone = (id: string, updated: Partial<ResumeMilestone>) => {
    const res = updateResumeMilestone(id, updated, resumeMilestones);
    setResumeMilestones(res);
    showBanner('Career milestone updated.');
  };

  const handleCreateResumeMilestone = (milestone: ResumeMilestone) => {
    const res = createResumeMilestone(milestone, resumeMilestones);
    setResumeMilestones(res);
    showBanner('New career milestone published!');
  };

  const handleDeleteResumeMilestone = (id: string) => {
    const res = deleteResumeMilestone(id, resumeMilestones);
    setResumeMilestones(res);
    showBanner('Milestone deleted.');
  };

  const handleExportBackup = () => {
    const jsonStr = exportPortfolioBackup(projects, profile, siteContent, customSections, resumeMilestones);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avinash_portfolio_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showBanner('Portfolio backup exported to JSON.');
  };

  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importPortfolioBackup(content);
        if (result.success && result.projects && result.profile) {
          setProjects(result.projects);
          setProfile(result.profile);
          if (result.siteContent) {
            setSiteContent(result.siteContent);
          }
          if (result.customSections) {
            setCustomSections(result.customSections);
          }
          if (result.resumeMilestones) {
            setResumeMilestones(result.resumeMilestones);
          }
          if (result.resumePdf) {
            setResumePdf(result.resumePdf);
          }
          showBanner('Portfolio and site copy restored successfully from backup.');
        } else {
          alert(`Import failed: ${result.error || 'Invalid backup file'}`);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDefaults = () => {
    if (confirm('Reset your portfolio, site copy, and profile to the original factory default showcase?')) {
      const res = resetPortfolioToDefaults();
      setProjects(res.projects);
      setProfile(res.profile);
      setSiteContent(res.siteContent);
      setCustomSections(res.customSections);
      setResumeMilestones(res.resumeMilestones);
      setResumePdf(null);
      showBanner('Portfolio reset to default showcase data.');
    }
  };

  const handleLogout = () => {
    setOwnerSession(false);
    setIsOwner(false);
    setIsPreviewMode(false);
    showBanner('Signed out of owner mode.');
  };

  const handleLoginSuccess = () => {
    setOwnerSession(true);
    setIsOwner(true);
    setIsPreviewMode(false);
    showBanner('Owner mode unlocked! Every line of text is now editable.');
  };

  const ownerCanEdit = isOwner && !isPreviewMode;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col selection:bg-red-500/30 selection:text-white">
      {/* Unique Smooth Interactive Cursor */}
      <CustomCursor />

      {/* Hidden file input for backup imports */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Owner Control Bar (Visible when owner is logged in) */}
      {isOwner && (
        <OwnerBar
          onAddNewProject={handleAddNewProject}
          onAddNewSection={() => handleOpenAddSection('work')}
          onAddNewMilestone={() => {
            setActiveTab('resume');
            const newId = `milestone-${Date.now()}`;
            handleCreateResumeMilestone({
              id: newId,
              year: `${new Date().getFullYear()} — Present`,
              role: 'Senior Game Designer & Technical Lighting Lead',
              studio: 'Studio Name · Project Title',
              location: 'Remote',
              description: 'Describe core gameplay loops, mechanics architecture, and level pacing systems.',
              achievements: [
                'Engineered responsive combat traversal mechanics and encounter pacing.',
                'Applied diegetic lighting to reinforce subconscious player wayfinding at 60 FPS.',
              ],
              techStack: ['Unreal Engine 5.4', 'Game Design', 'Blueprints', 'Lumen GI'],
              photoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
              photoCaption: 'Mechanics blockout & sightline analysis pass',
            });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenSectionManager={() => {
            setEditingCustomSection(null);
            setIsSectionManagerOpen(true);
          }}
          onEditProfile={() => setIsProfileEditorOpen(true)}
          onOpenResumeUploader={() => setIsResumeUploaderOpen(true)}
          onOpenAllLinesEditor={() => setIsSiteContentEditorOpen(true)}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onResetDefaults={handleResetDefaults}
          isPreviewMode={isPreviewMode}
          onTogglePreview={() => setIsPreviewMode(!isPreviewMode)}
          onLogout={handleLogout}
          hasCustomResumePdf={Boolean(resumePdf)}
        />
      )}

      {/* Floating status banner */}
      {statusBanner && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-600 text-white font-mono text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* 1. Header (Home, Work, About, Resume, Contact) */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenContact={() => {
          setActiveTab('contact');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenResume={() => {
          setActiveTab('resume');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        avatarUrl={siteContent.avatarUrl || DEFAULT_AVATAR_URL}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="tab-home"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {/* 2. Hero Section (Home) */}
              <section id="home" className="relative pt-20 pb-16 md:pt-28 md:pb-24 border-b border-zinc-800/80 overflow-hidden bg-gradient-to-b from-[#080808] to-[#050505]">
          {/* Atmospheric Background Video (Very Low Opacity) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {siteContent.heroBackgroundVideoUrl ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                src={siteContent.heroBackgroundVideoUrl}
                className="w-full h-full object-cover opacity-15 filter contrast-125 saturate-50"
              />
            ) : (
              <video
                autoPlay
                loop
                muted
                playsInline
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                className="w-full h-full object-cover opacity-12 filter contrast-125 grayscale"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
            {/* Monochrome Gradients & Atmospheric Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#080808]/90 via-[#050505]/85 to-[#000000]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/10 via-black/40 to-black/80" />
          </div>

          {/* Subtle atmospheric ambient glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-red-600/10 blur-[130px] rounded-full pointer-events-none z-0" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-zinc-700/10 blur-[100px] rounded-full pointer-events-none z-0" />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Headlines & Actions (lg:col-span-7) */}
              <div className="lg:col-span-7">
                {/* Owner Background Video Trigger */}
                {ownerCanEdit && (
                  <div className="mb-3 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSiteContentEditorTab('hero');
                        setIsSiteContentEditorOpen(true);
                      }}
                      className="px-2.5 py-1 text-[11px] font-mono text-zinc-300 bg-zinc-900/90 border border-zinc-800 rounded-lg hover:border-red-500/60 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="Upload or change hero background video"
                    >
                      <Film className="w-3.5 h-3.5 text-red-500" />
                      <span>{siteContent.heroBackgroundVideoUrl ? '✓ Custom BG Video Active' : 'Upload Hero Background Video'}</span>
                    </button>
                    {siteContent.heroBackgroundVideoUrl && (
                      <button
                        onClick={() => handleUpdateSiteLine('heroBackgroundVideoUrl', '')}
                        className="text-[10px] font-mono text-zinc-500 hover:text-red-400 cursor-pointer"
                        title="Reset to default ambient background"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                )}

                {/* Unboxed Kicker (§1.A Zero-Pill Rule) */}
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-4 tracking-wide uppercase flex-wrap">
                  <span className="text-red-500 font-bold">
                    <EditableText
                      value={siteContent.heroKickerName}
                      onChange={(v) => handleUpdateSiteLine('heroKickerName', v)}
                      isOwner={ownerCanEdit}
                      label="Artist Name"
                    />
                  </span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>
                    <EditableText
                      value={siteContent.heroKickerSubtitle}
                      onChange={(v) => handleUpdateSiteLine('heroKickerSubtitle', v)}
                      isOwner={ownerCanEdit}
                      label="Engine & Focus"
                    />
                  </span>
                </div>

                {/* Refined Display Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-extrabold tracking-tight text-white leading-[1.08] text-balance">
                  <EditableText
                    value={siteContent.heroHeadline}
                    onChange={(v) => handleUpdateSiteLine('heroHeadline', v)}
                    isOwner={ownerCanEdit}
                    label="Display Headline"
                    as="span"
                  />
                </h1>

                {/* Lead copy */}
                <p className="text-base sm:text-lg text-zinc-300 leading-relaxed mt-6 max-w-2xl font-light">
                  <EditableText
                    value={siteContent.heroLeadCopy}
                    onChange={(v) => handleUpdateSiteLine('heroLeadCopy', v)}
                    isOwner={ownerCanEdit}
                    label="Hero Lead Narrative"
                    multiline={true}
                    as="span"
                  />
                </p>

                {/* Primary Call to Actions */}
                <div className="flex flex-wrap items-center gap-3.5 mt-8">
                  <button
                    onClick={() => {
                      setActiveTab('work');
                      setTimeout(() => {
                        const studioEl = document.getElementById('studio');
                        if (studioEl) {
                          studioEl.scrollIntoView({ behavior: 'smooth' });
                        }
                      }, 120);
                    }}
                    className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-sm transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 font-sans cursor-pointer"
                  >
                    <Box className="w-4 h-4 text-white" />
                    <EditableText
                      value={siteContent.heroLabCtaText}
                      onChange={(v) => handleUpdateSiteLine('heroLabCtaText', v)}
                      isOwner={ownerCanEdit}
                      label="Studio CTA Label"
                      as="span"
                    />
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('work');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-3 bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-700/80 rounded-xl text-sm transition-all flex items-center gap-2 font-sans cursor-pointer"
                  >
                    <EditableText
                      value={siteContent.heroCaseStudiesCtaText}
                      onChange={(v) => handleUpdateSiteLine('heroCaseStudiesCtaText', v)}
                      isOwner={ownerCanEdit}
                      label="Case Studies CTA Label"
                      as="span"
                    />
                    <ArrowRight className="w-4 h-4 text-red-400" />
                  </button>

                  <button
                    onClick={handleDownloadResume}
                    className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 rounded-xl text-sm transition-all flex items-center gap-2 font-mono cursor-pointer"
                    title="Download Resume PDF"
                  >
                    <Download className="w-4 h-4 text-red-500" />
                    <span>Download Resume PDF</span>
                  </button>

                  {ownerCanEdit && (
                    <button
                      onClick={handleAddNewProject}
                      className="px-3.5 py-3 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-sm transition-all flex items-center gap-1.5 font-sans cursor-pointer"
                    >
                      <span>+ Add Project</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: High-Fidelity Artist Portrait & Studio Card (lg:col-span-5) */}
              <div className="lg:col-span-5">
                <div className="relative group max-w-sm mx-auto lg:max-w-none">
                  {/* Subtle rim-lighting bloom */}
                  <div className="absolute -inset-1 bg-gradient-to-tr from-red-600/20 via-zinc-800/10 to-red-600/30 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500" />

                  <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                    {/* Top status bar */}
                    <div className="px-5 py-3 border-b border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-zinc-200 font-medium">Available for Lead Roles</span>
                      </div>
                      {ownerCanEdit ? (
                        <button
                          onClick={() => setIsProfileEditorOpen(true)}
                          className="text-red-400 hover:text-red-300 text-[11px] font-semibold flex items-center gap-1 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/60 transition-colors"
                          title="Upload or update artist portrait"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Edit Photo</span>
                        </button>
                      ) : (
                        <span className="text-red-400 text-[11px] font-semibold">Unreal Engine 5.4</span>
                      )}
                    </div>

                    {/* Portrait Image with subtle lighting contrast */}
                    <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] w-full overflow-hidden bg-zinc-950">
                      <img
                        src={siteContent.avatarUrl || DEFAULT_AVATAR_URL}
                        alt="Avinash - Game Designer & Lighting Artist"
                        className="w-full h-full object-cover object-top filter contrast-105 group-hover:scale-102 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

                      {/* Telemetry overlay card */}
                      <div className="absolute bottom-4 left-4 right-4 text-xs font-mono">
                        <div className="p-3.5 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 space-y-1.5 shadow-xl">
                          <div className="flex items-center justify-between">
                            <span className="text-white font-display font-bold text-base">Avinash</span>
                            <span className="text-red-400 text-[11px] font-semibold">100% Core Design</span>
                          </div>
                          <div className="text-[11px] text-zinc-300">
                            Game Designer (Profession) · Lighting Artist (Passion)
                          </div>
                          <div className="text-[10px] text-zinc-400 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between">
                            <span>Core Loops · Mechanics · Pacing</span>
                            <span>Lumen 60 FPS (Passion)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 bg-zinc-950/80 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                      <div className="text-zinc-400 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span>Game Systems & Atmosphere</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('contact');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                      >
                        <span>Direct Inquiry</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Production KPI Strip */}
            <div className="mt-16 pt-8 border-t border-zinc-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-zinc-400 font-mono text-xs">
              <div>
                <div className="text-2xl font-bold font-display text-white tabular-nums">
                  <EditableText
                    value={siteContent.stat1Value}
                    onChange={(v) => handleUpdateSiteLine('stat1Value', v)}
                    isOwner={ownerCanEdit}
                    label="Stat 1 Value"
                    as="span"
                  />
                </div>
                <div className="text-zinc-500 mt-0.5">
                  <EditableText
                    value={siteContent.stat1Label}
                    onChange={(v) => handleUpdateSiteLine('stat1Label', v)}
                    isOwner={ownerCanEdit}
                    label="Stat 1 Label"
                    as="span"
                  />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold font-display text-red-500 tabular-nums">
                  <EditableText
                    value={siteContent.stat2Value}
                    onChange={(v) => handleUpdateSiteLine('stat2Value', v)}
                    isOwner={ownerCanEdit}
                    label="Stat 2 Value"
                    as="span"
                  />
                </div>
                <div className="text-zinc-500 mt-0.5">
                  <EditableText
                    value={siteContent.stat2Label}
                    onChange={(v) => handleUpdateSiteLine('stat2Label', v)}
                    isOwner={ownerCanEdit}
                    label="Stat 2 Label"
                    as="span"
                  />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold font-display text-zinc-100 tabular-nums">
                  <EditableText
                    value={siteContent.stat3Value}
                    onChange={(v) => handleUpdateSiteLine('stat3Value', v)}
                    isOwner={ownerCanEdit}
                    label="Stat 3 Value"
                    as="span"
                  />
                </div>
                <div className="text-zinc-500 mt-0.5">
                  <EditableText
                    value={siteContent.stat3Label}
                    onChange={(v) => handleUpdateSiteLine('stat3Label', v)}
                    isOwner={ownerCanEdit}
                    label="Stat 3 Label"
                    as="span"
                  />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold font-display text-zinc-100 tabular-nums">
                  <EditableText
                    value={siteContent.stat4Value}
                    onChange={(v) => handleUpdateSiteLine('stat4Value', v)}
                    isOwner={ownerCanEdit}
                    label="Stat 4 Value"
                    as="span"
                  />
                </div>
                <div className="text-zinc-500 mt-0.5">
                  <EditableText
                    value={siteContent.stat4Label}
                    onChange={(v) => handleUpdateSiteLine('stat4Label', v)}
                    isOwner={ownerCanEdit}
                    label="Stat 4 Label"
                    as="span"
                  />
                </div>
              </div>
            </div>

            {/* Custom Sections assigned to HOME tab */}
            <CustomSectionRenderer
              sections={customSections}
              tab="home"
              isOwner={ownerCanEdit}
              onUpdateSection={handleUpdateCustomSection}
              onDeleteSection={handleDeleteCustomSection}
              onAddSectionClick={handleOpenAddSection}
              onEditSectionClick={handleOpenEditSection}
            />
          </div>
        </section>
      </motion.div>
    )}

    {activeTab === 'work' && (
      <motion.div
        key="tab-work"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* 3. Interactive 3D Scene Lighting Studio */}
        <section id="studio" className="py-20 bg-zinc-950/60 border-b border-zinc-800/80">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="text-xs font-mono text-red-500 uppercase tracking-wider mb-2">
                  <EditableText
                    value={siteContent.studioKicker}
                    onChange={(v) => handleUpdateSiteLine('studioKicker', v)}
                    isOwner={ownerCanEdit}
                    label="Studio Kicker"
                  />
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-100">
                  <EditableText
                    value={siteContent.studioHeadline}
                    onChange={(v) => handleUpdateSiteLine('studioHeadline', v)}
                    isOwner={ownerCanEdit}
                    label="Studio Heading"
                    as="span"
                  />
                </h2>
                <p className="text-sm text-zinc-400 max-w-xl mt-2">
                  <EditableText
                    value={siteContent.studioDescription}
                    onChange={(v) => handleUpdateSiteLine('studioDescription', v)}
                    isOwner={ownerCanEdit}
                    label="Studio Description"
                    multiline={true}
                    as="span"
                  />
                </p>
              </div>

              <div className="text-xs font-mono text-zinc-400 flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl shrink-0">
                <EditableText
                  value={siteContent.studioModesBadge}
                  onChange={(v) => handleUpdateSiteLine('studioModesBadge', v)}
                  isOwner={ownerCanEdit}
                  label="Studio Modes Badge"
                />
              </div>
            </div>

            {/* Three.js Studio Component */}
            <LightingStudio initialScene={studioScene} />
          </div>
        </section>

        {/* 4. Filterable Featured Works Portfolio (Work) */}
        <section id="work" className="py-20 border-b border-zinc-800/80 scroll-mt-6">
          <div id="featured" className="scroll-mt-16" />
          <div className="max-w-7xl mx-auto px-6">
            {/* Section Header & Filter Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="text-xs font-mono text-red-500 uppercase tracking-wider mb-2">
                  <EditableText
                    value={siteContent.worksKicker}
                    onChange={(v) => handleUpdateSiteLine('worksKicker', v)}
                    isOwner={ownerCanEdit}
                    label="Works Kicker"
                  />
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-100">
                  <EditableText
                    value={siteContent.worksHeadline}
                    onChange={(v) => handleUpdateSiteLine('worksHeadline', v)}
                    isOwner={ownerCanEdit}
                    label="Works Heading"
                    as="span"
                  />
                </h2>
              </div>

              {/* Search input and Add Project button */}
              <div className="flex items-center gap-3">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by tag, engine..."
                    className="w-full pl-9 pr-3 py-2 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors font-mono"
                  />
                </div>

                {ownerCanEdit && (
                  <button
                    onClick={handleAddNewProject}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-red-600/30"
                  >
                    <span>+ New Project</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Filter Tabs (§1.A Interactive Controls) */}
            <div className="flex flex-wrap items-center gap-2 mb-10 p-1.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl w-fit">
              {[
                { id: 'all', label: 'All Works' },
                { id: 'game-design', label: 'Game Design & Mechanics' },
                { id: 'lighting', label: 'Lighting Art (Passion)' },
                { id: 'unreal', label: 'Unreal Engine 5' },
                { id: 'unity', label: 'Unity HDRP' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap ${
                    selectedCategory === tab.id
                      ? 'bg-zinc-800 text-white shadow-sm border border-red-500/50 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div className="py-20 text-center text-zinc-500 font-mono text-sm border border-dashed border-zinc-800 rounded-2xl">
                No matching projects found for "{searchQuery}".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onSelect={(p) => setActiveProject(p)}
                    onOpenInStudio={handleOpenInStudio}
                    isOwner={ownerCanEdit}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
              </div>
            )}

            {/* Custom Sections assigned to WORK tab (e.g. Industry Recognition, Talks) */}
            <CustomSectionRenderer
              sections={customSections}
              tab="work"
              isOwner={ownerCanEdit}
              onUpdateSection={handleUpdateCustomSection}
              onDeleteSection={handleDeleteCustomSection}
              onAddSectionClick={handleOpenAddSection}
              onEditSectionClick={handleOpenEditSection}
            />
          </div>
        </section>

        {/* 5. Cinematic Video Reels & A/B Lighting Comparison Section */}
        <section id="reels" className="py-20 bg-zinc-950/60 border-b border-zinc-800/80">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-mono text-red-500 uppercase tracking-wider mb-2">
                <EditableText
                  value={siteContent.reelsKicker}
                  onChange={(v) => handleUpdateSiteLine('reelsKicker', v)}
                  isOwner={ownerCanEdit}
                  label="Reels Kicker"
                />
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-100">
                <EditableText
                  value={siteContent.reelsHeadline}
                  onChange={(v) => handleUpdateSiteLine('reelsHeadline', v)}
                  isOwner={ownerCanEdit}
                  label="Reels Heading"
                  as="span"
                />
              </h2>
              <p className="text-sm text-zinc-400 mt-2">
                <EditableText
                  value={siteContent.reelsDescription}
                  onChange={(v) => handleUpdateSiteLine('reelsDescription', v)}
                  isOwner={ownerCanEdit}
                  label="Reels Description"
                  multiline={true}
                  as="span"
                />
              </p>
            </div>

            {/* 2-Column Showcase: Interactive Reel + A/B Slider */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column: Live Cinematic Video Reel Player */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span className="font-semibold text-zinc-200">
                    <EditableText
                      value={siteContent.reelPlayerTitle}
                      onChange={(v) => handleUpdateSiteLine('reelPlayerTitle', v)}
                      isOwner={ownerCanEdit}
                      label="Reel Title"
                    />
                  </span>
                  <span>
                    <EditableText
                      value={siteContent.reelPlayerEngine}
                      onChange={(v) => handleUpdateSiteLine('reelPlayerEngine', v)}
                      isOwner={ownerCanEdit}
                      label="Reel Engine Tag"
                    />
                  </span>
                </div>

                {/* Owner Reel Controls (Only visible when logged in) */}
                {ownerCanEdit && (
                  <div className="flex items-center justify-between text-[11px] font-mono px-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-red-400" />
                      <span>{siteContent.customReelVideoUrl ? 'Custom Video Loaded' : 'Procedural Canvas Loop'}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSiteContentEditorTab('reels');
                          setIsSiteContentEditorOpen(true);
                        }}
                        className="px-2 py-0.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{siteContent.customReelVideoUrl ? 'Change Video' : 'Upload Video'}</span>
                      </button>
                      {siteContent.customReelVideoUrl && (
                        <button
                          onClick={() => handleUpdateSiteLine('customReelVideoUrl', '')}
                          className="text-zinc-500 hover:text-red-400 text-[10px]"
                          title="Reset to procedural"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <CinematicVideoPlayer
                  style="cyberpunk"
                  title={siteContent.reelPlayerTitle}
                  duration="0:42"
                  autoPlay={false}
                  videoUrl={siteContent.customReelVideoUrl}
                />
                <p className="text-xs text-zinc-500 leading-relaxed">
                  <EditableText
                    value={siteContent.reelPlayerCaption}
                    onChange={(v) => handleUpdateSiteLine('reelPlayerCaption', v)}
                    isOwner={ownerCanEdit}
                    label="Reel Caption"
                    multiline={true}
                  />
                </p>
              </div>

              {/* Right Column: Interactive Before/After Split Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                  <span className="font-semibold text-zinc-200">
                    <EditableText
                      value={siteContent.abSliderTitle}
                      onChange={(v) => handleUpdateSiteLine('abSliderTitle', v)}
                      isOwner={ownerCanEdit}
                      label="Slider Title"
                    />
                  </span>
                  <span>
                    <EditableText
                      value={siteContent.abSliderHint}
                      onChange={(v) => handleUpdateSiteLine('abSliderHint', v)}
                      isOwner={ownerCanEdit}
                      label="Slider Hint"
                    />
                  </span>
                </div>

                {/* Owner Slider Controls (Only visible when logged in) */}
                {ownerCanEdit && (
                  <div className="flex items-center justify-between text-[11px] font-mono px-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl">
                    <span className="text-zinc-400 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-red-400" />
                      <span>{siteContent.customAbSliderLeftUrl || siteContent.customAbSliderRightUrl ? 'Custom Passes Loaded' : 'Procedural Canvas Passes'}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSiteContentEditorTab('reels');
                          setIsSiteContentEditorOpen(true);
                        }}
                        className="px-2 py-0.5 bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Passes</span>
                      </button>
                      {(siteContent.customAbSliderLeftUrl || siteContent.customAbSliderRightUrl) && (
                        <button
                          onClick={() => {
                            handleUpdateSiteLine('customAbSliderLeftUrl', '');
                            handleUpdateSiteLine('customAbSliderRightUrl', '');
                          }}
                          className="text-zinc-500 hover:text-red-400 text-[10px]"
                          title="Reset to procedural passes"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <LightingComparisonSlider
                  style="crypt"
                  leftPass="clay"
                  rightPass="final"
                  leftLabel="Lighting Only (Clay)"
                  rightLabel="Final Composition"
                  leftImageUrl={siteContent.customAbSliderLeftUrl}
                  rightImageUrl={siteContent.customAbSliderRightUrl}
                />
                <p className="text-xs text-zinc-500 leading-relaxed">
                  <EditableText
                    value={siteContent.abSliderCaption}
                    onChange={(v) => handleUpdateSiteLine('abSliderCaption', v)}
                    isOwner={ownerCanEdit}
                    label="Slider Caption"
                    multiline={true}
                  />
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Level Design Blockout Showcase */}
        <section id="level-design" className="py-20 border-b border-zinc-800/80">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <div className="text-xs font-mono text-red-500 uppercase tracking-wider mb-2">
                <EditableText
                  value={siteContent.levelKicker}
                  onChange={(v) => handleUpdateSiteLine('levelKicker', v)}
                  isOwner={ownerCanEdit}
                  label="Level Kicker"
                />
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-zinc-100">
                <EditableText
                  value={siteContent.levelHeadline}
                  onChange={(v) => handleUpdateSiteLine('levelHeadline', v)}
                  isOwner={ownerCanEdit}
                  label="Level Headline"
                  as="span"
                />
              </h2>
              <p className="text-sm text-zinc-400 mt-2">
                <EditableText
                  value={siteContent.levelDescription}
                  onChange={(v) => handleUpdateSiteLine('levelDescription', v)}
                  isOwner={ownerCanEdit}
                  label="Level Description"
                  multiline={true}
                  as="span"
                />
              </p>
            </div>

            {/* 3-in-a-Row Level Design Focus Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-semibold text-zinc-100">
                  <EditableText
                    value={siteContent.levelCard1Title}
                    onChange={(v) => handleUpdateSiteLine('levelCard1Title', v)}
                    isOwner={ownerCanEdit}
                    label="Card 1 Title"
                    as="span"
                  />
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <EditableText
                    value={siteContent.levelCard1Desc}
                    onChange={(v) => handleUpdateSiteLine('levelCard1Desc', v)}
                    isOwner={ownerCanEdit}
                    label="Card 1 Description"
                    multiline={true}
                    as="span"
                  />
                </p>
                <div className="pt-2 text-xs font-mono text-zinc-500">
                  <EditableText
                    value={siteContent.levelCard1Tag}
                    onChange={(v) => handleUpdateSiteLine('levelCard1Tag', v)}
                    isOwner={ownerCanEdit}
                    label="Card 1 Tag"
                  />
                </div>
              </div>

              <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-semibold text-zinc-100">
                  <EditableText
                    value={siteContent.levelCard2Title}
                    onChange={(v) => handleUpdateSiteLine('levelCard2Title', v)}
                    isOwner={ownerCanEdit}
                    label="Card 2 Title"
                    as="span"
                  />
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <EditableText
                    value={siteContent.levelCard2Desc}
                    onChange={(v) => handleUpdateSiteLine('levelCard2Desc', v)}
                    isOwner={ownerCanEdit}
                    label="Card 2 Description"
                    multiline={true}
                    as="span"
                  />
                </p>
                <div className="pt-2 text-xs font-mono text-zinc-500">
                  <EditableText
                    value={siteContent.levelCard2Tag}
                    onChange={(v) => handleUpdateSiteLine('levelCard2Tag', v)}
                    isOwner={ownerCanEdit}
                    label="Card 2 Tag"
                  />
                </div>
              </div>

              <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-display font-semibold text-zinc-100">
                  <EditableText
                    value={siteContent.levelCard3Title}
                    onChange={(v) => handleUpdateSiteLine('levelCard3Title', v)}
                    isOwner={ownerCanEdit}
                    label="Card 3 Title"
                    as="span"
                  />
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <EditableText
                    value={siteContent.levelCard3Desc}
                    onChange={(v) => handleUpdateSiteLine('levelCard3Desc', v)}
                    isOwner={ownerCanEdit}
                    label="Card 3 Description"
                    multiline={true}
                    as="span"
                  />
                </p>
                <div className="pt-2 text-xs font-mono text-zinc-500">
                  <EditableText
                    value={siteContent.levelCard3Tag}
                    onChange={(v) => handleUpdateSiteLine('levelCard3Tag', v)}
                    isOwner={ownerCanEdit}
                    label="Card 3 Tag"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    )}

    {activeTab === 'about' && (
      <motion.div
        key="tab-about"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* 7. About & Toolset Section */}
        <AboutSection
          onOpenContact={() => {
            setActiveTab('contact');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          profile={profile}
          siteContent={siteContent}
          isOwner={ownerCanEdit}
          onUpdateSiteContent={handleUpdateSiteLine}
        />

        {/* Custom Sections assigned to ABOUT tab (e.g. Hardware Rig, Look-dev Pipeline) */}
        <div className="max-w-7xl mx-auto px-6 pb-20">
          <CustomSectionRenderer
            sections={customSections}
            tab="about"
            isOwner={ownerCanEdit}
            onUpdateSection={handleUpdateCustomSection}
            onDeleteSection={handleDeleteCustomSection}
            onAddSectionClick={handleOpenAddSection}
            onEditSectionClick={handleOpenEditSection}
          />
        </div>
      </motion.div>
    )}

    {activeTab === 'resume' && (
      <motion.div
        key="tab-resume"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Dedicated Resume Page with Interactive Timeline & Photo Upload */}
        <ResumeSection
          profile={profile}
          milestones={resumeMilestones}
          resumePdf={resumePdf}
          onDownloadResume={handleDownloadResume}
          onOpenResumeUploader={() => setIsResumeUploaderOpen(true)}
          isOwner={ownerCanEdit}
          onUpdateMilestone={handleUpdateResumeMilestone}
          onCreateMilestone={handleCreateResumeMilestone}
          onDeleteMilestone={handleDeleteResumeMilestone}
          siteContent={siteContent}
          onUpdateSiteContent={handleUpdateSiteLine}
          customSections={customSections}
          onUpdateCustomSection={handleUpdateCustomSection}
          onDeleteCustomSection={handleDeleteCustomSection}
          onAddSectionClick={handleOpenAddSection}
          onEditSectionClick={handleOpenEditSection}
        />
      </motion.div>
    )}

    {activeTab === 'contact' && (
      <motion.div
        key="tab-contact"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Dedicated Contact Page based on Reference Image */}
        <ContactSection
          siteContent={siteContent}
          isOwner={ownerCanEdit}
          onUpdateSiteContent={handleUpdateSiteLine}
          customSections={customSections}
          onUpdateCustomSection={handleUpdateCustomSection}
          onDeleteCustomSection={handleDeleteCustomSection}
          onAddSectionClick={handleOpenAddSection}
          onEditSectionClick={handleOpenEditSection}
        />
      </motion.div>
    )}
  </AnimatePresence>
</main>

      {/* 8. Quiet Footer */}
      <footer className="py-12 border-t border-zinc-800/80 bg-[#000000] text-zinc-500 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-zinc-300 font-semibold font-display">
              <EditableText
                value={siteContent.footerName}
                onChange={(v) => handleUpdateSiteLine('footerName', v)}
                isOwner={ownerCanEdit}
                label="Footer Name"
              />
            </span>
            <span>—</span>
            <span>
              <EditableText
                value={siteContent.footerRole}
                onChange={(v) => handleUpdateSiteLine('footerRole', v)}
                isOwner={ownerCanEdit}
                label="Footer Role"
              />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a
              href={`mailto:${siteContent.contactEmail}`}
              className="hover:text-red-400 transition-colors"
            >
              {siteContent.contactEmail}
            </a>
            <button
              onClick={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors cursor-pointer ${
                activeTab === 'home' ? 'text-red-400 font-semibold' : 'hover:text-red-400'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => {
                setActiveTab('work');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors cursor-pointer ${
                activeTab === 'work' ? 'text-red-400 font-semibold' : 'hover:text-white'
              }`}
            >
              Work
            </button>
            <button
              onClick={() => {
                setActiveTab('about');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors cursor-pointer ${
                activeTab === 'about' ? 'text-red-400 font-semibold' : 'hover:text-white'
              }`}
            >
              About
            </button>
            <button
              onClick={() => {
                setActiveTab('resume');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors cursor-pointer ${
                activeTab === 'resume' ? 'text-red-400 font-semibold' : 'hover:text-white'
              }`}
            >
              Resume
            </button>
            <button
              onClick={() => {
                setActiveTab('contact');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`transition-colors cursor-pointer ${
                activeTab === 'contact' ? 'text-red-400 font-semibold' : 'hover:text-white'
              }`}
            >
              Contact
            </button>
            <button
              onClick={handleDownloadResume}
              className="hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Download Resume PDF"
            >
              <Download className="w-3 h-3 text-red-500" />
              <span>PDF</span>
            </button>

            {/* Owner Access Trigger in Footer (Strictly only visible when owner is authenticated) */}
            {isOwner && (
              <button
                onClick={() => setIsSiteContentEditorOpen(true)}
                className="hover:text-red-400 transition-colors flex items-center gap-1.5 text-red-400 font-mono text-[11px] px-2 py-0.5 rounded bg-red-950/40 border border-red-900/60 cursor-pointer"
                title="Owner Mode Active: Click to edit all text lines"
              >
                <Lock className="w-3 h-3 text-red-500" />
                <span>Owner Mode Active</span>
              </button>
            )}
          </div>

          {/* Copyright with discrete double-click / triple-tap owner portal trigger (completely hidden from visitors) */}
          <div
            onDoubleClick={() => {
              if (!isOwner) setIsOwnerLoginOpen(true);
            }}
            onClick={(e) => {
              if (e.detail === 3 && !isOwner) {
                setIsOwnerLoginOpen(true);
              }
            }}
            title={isOwner ? undefined : "Avinash · Game Designer & Lighting Artist"}
            className="cursor-default select-none"
          >
            © {new Date().getFullYear()} <EditableText
              value={siteContent.footerCopyright}
              onChange={(v) => handleUpdateSiteLine('footerCopyright', v)}
              isOwner={ownerCanEdit}
              label="Footer Copyright"
              as="span"
            />
          </div>
        </div>
      </footer>

      {/* Case Study Detail Modal */}
      <ProjectDetailModal
        project={activeProject}
        onClose={() => setActiveProject(null)}
        onOpenInStudio={handleOpenInStudio}
        isOwner={ownerCanEdit}
        onEdit={handleEditProject}
      />

      {/* Contact Inquiry Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Resume PDF Uploader Modal */}
      <ResumeUploaderModal
        isOpen={isResumeUploaderOpen}
        onClose={() => setIsResumeUploaderOpen(false)}
        onUploadSuccess={(pdf) => {
          setResumePdf(pdf);
          showBanner(pdf ? `Resume PDF "${pdf.filename}" saved!` : 'Custom resume removed.');
        }}
        currentPdf={resumePdf}
      />

      {/* Site Content Master Editor Modal */}
      <SiteContentEditorModal
        isOpen={isSiteContentEditorOpen}
        content={siteContent}
        initialTab={siteContentEditorTab}
        onClose={() => setIsSiteContentEditorOpen(false)}
        onSave={(updated) => {
          saveStoredSiteContent(updated);
          setSiteContent(updated);
          showBanner('All website text lines updated successfully!');
        }}
      />

      {/* Owner Login Modal */}
      <OwnerLoginModal
        isOpen={isOwnerLoginOpen}
        onClose={() => setIsOwnerLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Project Creator/Editor Modal */}
      <ProjectEditorModal
        isOpen={isProjectEditorOpen}
        projectToEdit={editingProject}
        onClose={() => {
          setIsProjectEditorOpen(false);
          setEditingProject(null);
        }}
        onSave={handleSaveProject}
      />

      {/* Profile & Experience Editor Modal */}
      <ProfileEditorModal
        isOpen={isProfileEditorOpen}
        profile={profile}
        onClose={() => setIsProfileEditorOpen(false)}
        onSave={handleSaveProfile}
      />

      {/* Tab Section Manager Modal */}
      <SectionManagerModal
        isOpen={isSectionManagerOpen}
        onClose={() => {
          setIsSectionManagerOpen(false);
          setEditingCustomSection(null);
        }}
        sections={customSections}
        onSaveSections={handleSaveCustomSections}
        initialTab={sectionManagerTargetTab}
        initialSectionToEdit={editingCustomSection}
      />
    </div>
  );
}
