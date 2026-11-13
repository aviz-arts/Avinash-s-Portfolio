import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectItem } from './types/portfolio';
import { filterProjects } from './utils/lightingLogic';
import { getAdaptiveGridClass } from './utils/layoutHelpers';
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
import { OwnerBar, DeploySyncState } from './components/owner/OwnerBar';
import { OwnerLoginModal } from './components/owner/OwnerLoginModal';
import { ProjectEditorModal } from './components/owner/ProjectEditorModal';
import { ProfileEditorModal } from './components/owner/ProfileEditorModal';
import { ResumeUploaderModal } from './components/resume/ResumeUploaderModal';
import { SiteContentEditorModal } from './components/owner/SiteContentEditorModal';
import { SectionManagerModal } from './components/owner/SectionManagerModal';
import { UnsavedChangesModal } from './components/owner/UnsavedChangesModal';
import { OwnerSecurityModal } from './components/owner/OwnerSecurityModal';
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
  isRecognizedOwnerDevice,
  setRecognizedOwnerDevice,
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
  LevelDesignCardItem,
  resolveLevelCards,
  OwnerSessionSnapshot,
  createOwnerSessionSnapshot,
  getChangedOwnerSections,
  saveOwnerSessionSnapshot,
  getStoredOwnerSessionBaseline,
  saveStoredOwnerSessionBaseline,
  clearStoredOwnerSessionBaseline,
  syncLocalStorageWithPublishedBundle,
  checkServerPublishStatus,
  publishPortfolioToServer,
  generatePublishedPortfolioTsSource,
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
  Plus,
  Trash2,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'work' | 'about' | 'resume' | 'contact'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [siteContentEditorTab, setSiteContentEditorTab] = useState<'hero' | 'studio' | 'works' | 'reels' | 'level' | 'about' | 'contact' | 'footer'>('hero');

  // Synchronize any newer deployed bundle with stale browser localStorage BEFORE initial reads
  const bundleSyncStatusRef = useRef<'refreshed_from_deploy' | 'has_pending_local_edits' | 'in_sync' | null>(null);
  if (bundleSyncStatusRef.current === null) {
    bundleSyncStatusRef.current = syncLocalStorageWithPublishedBundle();
  }

  // Persistent State
  const [projects, setProjects] = useState<ProjectItem[]>(() => getStoredProjects());
  const [profile, setProfile] = useState<OwnerProfile>(() => getStoredProfile());
  const [siteContent, setSiteContent] = useState<SiteContent>(() => getStoredSiteContent());
  const [resumePdf, setResumePdf] = useState<StoredResumePdf | null>(() => getStoredResumePdf());
  const [customSections, setCustomSections] = useState<CustomSection[]>(() => getStoredCustomSections());
  const [resumeMilestones, setResumeMilestones] = useState<ResumeMilestone[]>(() => getStoredResumeMilestones());
  const [deploySyncState, setDeploySyncState] = useState<DeploySyncState>('checking');
  const canWriteToSourceRef = useRef(false);
  const lastPublishedHashRef = useRef<string | null>(null);

  // Owner Mode State (Private: Only visible to Owner Avinash)
  const [isOwner, setIsOwner] = useState<boolean>(() => isOwnerSessionActive());
  const [isOwnerDevice, setIsOwnerDevice] = useState<boolean>(() => isRecognizedOwnerDevice());
  const [showSecretOwnerTrigger, setShowSecretOwnerTrigger] = useState<boolean>(false);
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
  const [ownerSessionBaseline, setOwnerSessionBaseline] = useState<OwnerSessionSnapshot | null>(() => {
    if (!isOwnerSessionActive()) return null;
    const savedBaseline = getStoredOwnerSessionBaseline();
    if (savedBaseline) return savedBaseline;
    const initial = createOwnerSessionSnapshot({
      projects: getStoredProjects(),
      profile: getStoredProfile(),
      siteContent: getStoredSiteContent(),
      customSections: getStoredCustomSections(),
      resumeMilestones: getStoredResumeMilestones(),
      resumePdf: getStoredResumePdf(),
    });
    saveStoredOwnerSessionBaseline(initial);
    return initial;
  });
  const [pendingOwnerCloseAction, setPendingOwnerCloseAction] = useState<'logout' | 'forgetDevice' | null>(null);
  const [pendingCloseModalMode, setPendingCloseModalMode] = useState<'unsaved' | 'confirmForget'>('unsaved');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Private owner trigger flag: ONLY true if already logged in as owner, recognized owner device, or explicitly invoked via ?owner/shortcut
  const showOwnerTrigger = isOwner || isOwnerDevice || showSecretOwnerTrigger;

  // Check URL query on mount (?owner, ?admin, or ?edit)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('owner') || params.has('admin') || params.has('edit')) {
        setShowSecretOwnerTrigger(true);
        setIsOwnerLoginOpen(true);
      }
    }
  }, []);

  // Shortcut Ctrl+Shift+E (or Cmd+Shift+E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowSecretOwnerTrigger(true);
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

  const currentOwnerSnapshot = useMemo<OwnerSessionSnapshot>(
    () => ({
      projects,
      profile,
      siteContent,
      customSections,
      resumeMilestones,
      resumePdf,
    }),
    [projects, profile, siteContent, customSections, resumeMilestones, resumePdf]
  );

  const currentOwnerSnapshotRef = useRef<OwnerSessionSnapshot>(currentOwnerSnapshot);
  currentOwnerSnapshotRef.current = currentOwnerSnapshot;

  const flushPublishToServer = async (
    snapshot: OwnerSessionSnapshot,
    options?: { reset?: boolean }
  ): Promise<boolean> => {
    if (!canWriteToSourceRef.current) return false;
    const hash = JSON.stringify(snapshot);
    setDeploySyncState('saving');
    const result = await publishPortfolioToServer(snapshot, options);
    if (result.ok) {
      lastPublishedHashRef.current = hash;
      setDeploySyncState('synced');
      return true;
    }
    if (result.readOnly) {
      canWriteToSourceRef.current = false;
      setDeploySyncState('readonly');
    } else {
      setDeploySyncState('error');
    }
    return false;
  };

  // Detect whether preview dev server can persist changes directly to source bundle
  // and immediately rescue any pre-existing preview localStorage edits into publishedPortfolio.ts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const status = await checkServerPublishStatus();
      if (cancelled) return;
      canWriteToSourceRef.current = status.canWriteToSource;
      if (!status.canWriteToSource) {
        setDeploySyncState('readonly');
        return;
      }

      const initialSnapshot = currentOwnerSnapshotRef.current;
      const initialHash = JSON.stringify(initialSnapshot);

      if (bundleSyncStatusRef.current === 'has_pending_local_edits') {
        setDeploySyncState('saving');
        const res = await publishPortfolioToServer(initialSnapshot);
        if (cancelled) return;
        if (res.ok) {
          lastPublishedHashRef.current = initialHash;
          setDeploySyncState('synced');
        } else {
          setDeploySyncState(res.readOnly ? 'readonly' : 'error');
        }
      } else {
        lastPublishedHashRef.current = initialHash;
        setDeploySyncState('synced');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Automatically sync any Owner Mode changes to src/data/publishedPortfolio.ts in preview
  useEffect(() => {
    if (!canWriteToSourceRef.current) return;
    const nextHash = JSON.stringify(currentOwnerSnapshot);
    if (lastPublishedHashRef.current === null || nextHash === lastPublishedHashRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      void flushPublishToServer(currentOwnerSnapshot);
    }, 400);

    return () => clearTimeout(timer);
  }, [currentOwnerSnapshot]);

  const handleDownloadPublishedModule = () => {
    const tsSource = generatePublishedPortfolioTsSource(currentOwnerSnapshot, Date.now());
    const blob = new Blob([tsSource], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'publishedPortfolio.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showBanner('Downloaded publishedPortfolio.ts — place it in src/data/ before deploying.');
  };

  const changedOwnerSections = useMemo(
    () => (isOwner ? getChangedOwnerSections(ownerSessionBaseline, currentOwnerSnapshot) : []),
    [isOwner, ownerSessionBaseline, currentOwnerSnapshot]
  );

  const hasUnsavedOwnerEdits = changedOwnerSections.length > 0;

  // Warn before browser tab reload/close when Owner Mode has unsaved edits
  useEffect(() => {
    if (!isOwner || !hasUnsavedOwnerEdits) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOwner, hasUnsavedOwnerEdits]);

  // Filter projects using pure tested logic
  const effectiveCategory = selectedCategory === 'unity' ? 'all' : selectedCategory;
  const filteredProjects = filterProjects(projects, effectiveCategory, searchQuery);

  const handleOpenInStudio = () => {
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

  // Single-line text update handler for EditableText and custom fields
  const handleUpdateSiteLine = <K extends keyof SiteContent>(key: K, val: any) => {
    setSiteContent((prev) => updateSiteContentKey(key, val, prev));
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
          showBanner(`Import failed: ${result.error || 'Invalid backup file'}`);
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
      void flushPublishToServer(
        {
          projects: res.projects,
          profile: res.profile,
          siteContent: res.siteContent,
          customSections: res.customSections,
          resumeMilestones: res.resumeMilestones,
          resumePdf: null,
        },
        { reset: true }
      );
      showBanner('Portfolio reset to default showcase data.');
    }
  };

  const executeCloseOwnerMode = (action: 'logout' | 'forgetDevice', bannerMsg?: string) => {
    setOwnerSession(false);
    setIsOwner(false);
    setIsPreviewMode(false);
    setIsSecurityModalOpen(false);
    clearStoredOwnerSessionBaseline();
    setOwnerSessionBaseline(null);
    setPendingOwnerCloseAction(null);

    if (action === 'forgetDevice') {
      setRecognizedOwnerDevice(false);
      setIsOwnerDevice(false);
      setShowSecretOwnerTrigger(false);
      showBanner(bannerMsg || 'Owner button is now 100% hidden on this device.');
    } else {
      showBanner(bannerMsg || 'Signed out of owner mode.');
    }
  };

  const handleSaveAllOwnerChanges = () => {
    saveOwnerSessionSnapshot(currentOwnerSnapshot);
    const freshBaseline = createOwnerSessionSnapshot(currentOwnerSnapshot);
    setOwnerSessionBaseline(freshBaseline);
    saveStoredOwnerSessionBaseline(freshBaseline);
    void flushPublishToServer(currentOwnerSnapshot);
    showBanner(
      canWriteToSourceRef.current
        ? 'All Owner Mode changes saved & synced for deployment.'
        : 'All Owner Mode changes saved.'
    );
  };

  const handleLogout = () => {
    if (hasUnsavedOwnerEdits) {
      setPendingCloseModalMode('unsaved');
      setPendingOwnerCloseAction('logout');
      return;
    }
    executeCloseOwnerMode('logout');
  };

  const handleForgetDevice = () => {
    if (hasUnsavedOwnerEdits) {
      setPendingCloseModalMode('unsaved');
      setPendingOwnerCloseAction('forgetDevice');
      return;
    }
    setPendingCloseModalMode('confirmForget');
    setPendingOwnerCloseAction('forgetDevice');
  };

  const handleSaveAndCloseOwnerMode = () => {
    const action = pendingOwnerCloseAction || 'logout';
    saveOwnerSessionSnapshot(currentOwnerSnapshot);
    void flushPublishToServer(currentOwnerSnapshot);
    executeCloseOwnerMode(
      action,
      action === 'forgetDevice'
        ? 'Changes saved and Owner button hidden on this device.'
        : 'All changes saved and Owner Mode closed.'
    );
  };

  const handleDiscardAndCloseOwnerMode = () => {
    const action = pendingOwnerCloseAction || 'logout';
    if (ownerSessionBaseline) {
      const restored = createOwnerSessionSnapshot(ownerSessionBaseline);
      setProjects(restored.projects);
      setProfile(restored.profile);
      setSiteContent(restored.siteContent);
      setCustomSections(restored.customSections);
      setResumeMilestones(restored.resumeMilestones);
      setResumePdf(restored.resumePdf);
      saveOwnerSessionSnapshot(restored);
      void flushPublishToServer(restored);
    }
    executeCloseOwnerMode(
      action,
      action === 'forgetDevice'
        ? 'Changes discarded and Owner button hidden on this device.'
        : 'Changes discarded and Owner Mode closed.'
    );
  };

  const handleLoginSuccess = () => {
    const snapshot = createOwnerSessionSnapshot(currentOwnerSnapshot);
    setOwnerSessionBaseline(snapshot);
    saveStoredOwnerSessionBaseline(snapshot);
    setOwnerSession(true);
    setRecognizedOwnerDevice(true);
    setIsOwnerDevice(true);
    setShowSecretOwnerTrigger(true);
    setIsOwner(true);
    setIsPreviewMode(false);
    showBanner('Welcome back, Avinash! Owner Mode is unlocked.');
  };

  const ownerCanEdit = isOwner && !isPreviewMode;
  const showHomeHeroText = siteContent.homeShowHeroText !== false;
  const showHomePortrait = siteContent.homeShowPortrait !== false;
  const showStudioSection = siteContent.workShowStudio !== false;
  const showWorksSection = siteContent.workShowWorksGrid !== false;
  const showReelsSection = siteContent.workShowReels !== false;
  const showReelPlayer = siteContent.workShowReelPlayer !== false;
  const showAbSlider = siteContent.workShowAbSlider !== false;
  const visibleReelsCount = (showReelPlayer ? 1 : 0) + (showAbSlider ? 1 : 0);
  const showLevelDesignSection = siteContent.workShowLevelDesign !== false;
  const levelCards = resolveLevelCards(siteContent);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col selection:bg-red-500/30 selection:text-white print:bg-white print:text-zinc-950">
      {/* Unique Smooth Interactive Cursor */}
      <div className="print:hidden">
        <CustomCursor />
      </div>

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
          onAddNewSection={() => handleOpenAddSection(activeTab)}
          onAddNewMilestone={() => {
            setActiveTab('about');
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
            setTimeout(() => {
              const el = document.getElementById('career-timeline');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }, 150);
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
          onForgetDevice={handleForgetDevice}
          hasCustomResumePdf={Boolean(resumePdf)}
          hasUnsavedChanges={hasUnsavedOwnerEdits}
          onSaveChanges={handleSaveAllOwnerChanges}
          onOpenSecurity={() => setIsSecurityModalOpen(true)}
          deploySyncState={deploySyncState}
          onDownloadPublishedModule={handleDownloadPublishedModule}
        />
      )}

      {/* Floating status banner */}
      {statusBanner && (
        <div className="print:hidden fixed bottom-6 right-6 z-50 bg-red-600 text-white font-mono text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-300">
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
        onOpenOwnerLogin={() => setIsOwnerLoginOpen(true)}
        isOwner={isOwner}
        showOwnerTrigger={showOwnerTrigger}
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

          <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 relative z-10">
            {(showHomeHeroText || showHomePortrait) && (
              <div
                className={
                  showHomeHeroText && showHomePortrait
                    ? 'grid grid-cols-1 lg:grid-cols-12 gap-10 items-center'
                    : 'max-w-4xl mx-auto'
                }
              >
                {/* Left Column: Headlines & Actions */}
                {showHomeHeroText && (
                  <div className={showHomePortrait ? 'lg:col-span-7' : 'w-full'}>
                    {/* Owner Background Video & Section Controls */}
                    {ownerCanEdit && (
                      <div className="mb-3 flex flex-wrap items-center gap-2">
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
                        <button
                          onClick={() => handleUpdateSiteLine('homeShowHeroText', false)}
                          className="px-2.5 py-1 text-[11px] font-mono text-red-300 bg-red-950/30 border border-red-900/50 rounded-lg hover:bg-red-900/50 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Remove hero intro block (re-enable via Manage Sections)"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove Hero Text</span>
                        </button>
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
                        onClick={() => {
                          setActiveTab('resume');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 rounded-xl text-sm transition-all flex items-center gap-2 font-mono cursor-pointer"
                        title="Open Resume Tab"
                      >
                        <Download className="w-4 h-4 text-red-500" />
                        <span>Download Resume</span>
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
                )}

                {/* Right Column: Clean Artist Portrait Card with Direct Inquiry */}
                {showHomePortrait && (
                  <div className={showHomeHeroText ? 'lg:col-span-5' : 'max-w-md mx-auto'}>
                    <div className="relative group max-w-sm mx-auto lg:max-w-none">
                      {/* Subtle rim-lighting bloom */}
                      <div className="absolute -inset-1 bg-gradient-to-tr from-red-600/20 via-zinc-800/10 to-red-600/30 rounded-3xl blur-xl opacity-70 group-hover:opacity-100 transition duration-500" />

                      <div className="relative bg-zinc-900/80 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                        {/* Portrait Image */}
                        <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] w-full overflow-hidden bg-zinc-950">
                          <img
                            src={siteContent.avatarUrl || DEFAULT_AVATAR_URL}
                            alt="Avinash - Game Designer & Lighting Artist"
                            className="w-full h-full object-cover object-top filter contrast-105 group-hover:scale-102 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />

                          {ownerCanEdit && (
                            <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                              <button
                                onClick={() => setIsProfileEditorOpen(true)}
                                className="text-red-300 hover:text-white text-[11px] font-mono font-semibold flex items-center gap-1 bg-zinc-950/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-red-800/60 transition-colors cursor-pointer"
                                title="Upload or update artist portrait"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Edit Photo</span>
                              </button>
                              <button
                                onClick={() => handleUpdateSiteLine('homeShowPortrait', false)}
                                className="p-1.5 bg-zinc-950/85 hover:bg-red-900/80 text-red-400 border border-red-900/60 rounded-lg transition-colors cursor-pointer"
                                title="Remove Portrait Card"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Card Footer: Direct Inquiry Only */}
                        <div className="p-4 bg-zinc-950/85 border-t border-zinc-800/80 flex items-center justify-end text-xs font-mono">
                          <button
                            onClick={() => {
                              setActiveTab('contact');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
                          >
                            <span>Direct Inquiry</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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
        {showStudioSection && (
          <section id="studio" className="py-12 sm:py-16 lg:py-20 bg-zinc-950/60 border-b border-zinc-800/80">
            <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
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

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="text-xs font-mono text-zinc-400 flex items-center gap-3 bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl shrink-0">
                    <EditableText
                      value={siteContent.studioModesBadge}
                      onChange={(v) => handleUpdateSiteLine('studioModesBadge', v)}
                      isOwner={ownerCanEdit}
                      label="Studio Modes Badge"
                    />
                  </div>
                  {ownerCanEdit && (
                    <button
                      onClick={() => handleUpdateSiteLine('workShowStudio', false)}
                      className="px-2.5 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer"
                      title="Remove 3D Studio section (restore in Manage Sections)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Section</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Three.js Studio Component */}
              <LightingStudio />
            </div>
          </section>
        )}

        {/* 4. Filterable Featured Works Portfolio (Work) */}
        {showWorksSection && (
          <section id="work" className="py-14 sm:py-20 border-b border-zinc-800/80 scroll-mt-6">
            <div id="featured" className="scroll-mt-16" />
            <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
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
                <div className="flex flex-wrap items-center gap-3">
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
                    <>
                      <button
                        onClick={handleAddNewProject}
                        className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm shadow-red-600/30 cursor-pointer"
                      >
                        <span>+ New Project</span>
                      </button>
                      <button
                        onClick={() => handleUpdateSiteLine('workShowWorksGrid', false)}
                        className="px-2.5 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer"
                        title="Remove Featured Works section (restore in Manage Sections)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Section</span>
                      </button>
                    </>
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
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`px-4 py-2 text-xs font-medium rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      effectiveCategory === tab.id
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
                <div className={getAdaptiveGridClass(filteredProjects.length, 'cards')}>
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
            </div>
          </section>
        )}

        {/* 5. Cinematic Video Reels & A/B Lighting Comparison Section */}
        {showReelsSection && (
          <section id="reels" className="py-14 sm:py-20 bg-zinc-950/60 border-b border-zinc-800/80">
            <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                <div className="max-w-2xl">
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

                {ownerCanEdit && (
                  <button
                    onClick={() => handleUpdateSiteLine('workShowReels', false)}
                    className="px-2.5 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-xl text-xs font-mono flex items-center gap-1 self-start md:self-auto cursor-pointer"
                    title="Remove Reels & A/B section (restore in Manage Sections)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Section</span>
                  </button>
                )}
              </div>

              {/* Adaptive Showcase Grid: 2 Columns or Full Width when 1 remains */}
              {visibleReelsCount > 0 && (
                <div className={`${getAdaptiveGridClass(visibleReelsCount, 'split')} gap-8 items-start`}>
                  {/* Left Column: Live Cinematic Video Reel Player */}
                  {showReelPlayer && (
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
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono px-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl">
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
                          className="text-zinc-500 hover:text-red-400 text-[10px] cursor-pointer"
                          title="Reset to procedural"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateSiteLine('workShowReelPlayer', false)}
                        className="px-2 py-0.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Remove Video Reel Player"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
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
                  )}

                  {/* Right Column: Interactive Before/After Split Slider */}
                  {showAbSlider && (
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
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono px-3 py-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl">
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
                          className="text-zinc-500 hover:text-red-400 text-[10px] cursor-pointer"
                          title="Reset to procedural passes"
                        >
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateSiteLine('workShowAbSlider', false)}
                        className="px-2 py-0.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                        title="Remove A/B Inspection Slider"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
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
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 6. Level Design Blockout Showcase */}
        {showLevelDesignSection && (
          <section id="level-design" className="py-14 sm:py-20 border-b border-zinc-800/80">
            <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                <div className="max-w-2xl">
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

                {ownerCanEdit && (
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    <button
                      onClick={() => {
                        const nextCard: LevelDesignCardItem = {
                          id: `level-card-${Date.now()}`,
                          title: 'New Spatial Pillar',
                          description: 'Describe encounter pacing, spatial flow, or environmental sightline framing.',
                          tag: 'Unreal Engine 5.4 · Level Design',
                          icon: 'compass',
                        };
                        handleUpdateSiteLine('levelCards', [...levelCards, nextCard]);
                      }}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono flex items-center gap-1.5 shadow-sm shadow-red-600/30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Card</span>
                    </button>
                    <button
                      onClick={() => handleUpdateSiteLine('workShowLevelDesign', false)}
                      className="px-2.5 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer"
                      title="Remove Level Design section (restore in Manage Sections)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Section</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Adaptive Level Design Focus Cards */}
              {levelCards.length > 0 && (
                <div className={getAdaptiveGridClass(levelCards.length, 'cards')}>
                  {levelCards.map((card, cardIdx) => {
                    const iconKind = card.icon || (cardIdx % 3 === 1 ? 'layers' : cardIdx % 3 === 2 ? 'sparkles' : 'compass');
                    return (
                      <div key={card.id} className="relative p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4">
                        {ownerCanEdit && (
                          <button
                            onClick={() =>
                              handleUpdateSiteLine(
                                'levelCards',
                                levelCards.filter((c) => c.id !== card.id)
                              )
                            }
                            className="absolute top-4 right-4 p-1.5 bg-zinc-950/80 hover:bg-red-900/60 text-zinc-500 hover:text-red-400 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Delete card"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            iconKind === 'layers'
                              ? 'bg-red-950/40 border border-red-800/60 text-red-400'
                              : 'bg-zinc-900 border border-zinc-700 text-zinc-200'
                          }`}
                        >
                          {iconKind === 'layers' ? (
                            <Layers className="w-5 h-5" />
                          ) : iconKind === 'sparkles' ? (
                            <Sparkles className="w-5 h-5" />
                          ) : (
                            <Compass className="w-5 h-5" />
                          )}
                        </div>
                        <h3 className="text-lg font-display font-semibold text-zinc-100 pr-8">
                          <EditableText
                            value={card.title}
                            onChange={(v) =>
                              handleUpdateSiteLine(
                                'levelCards',
                                levelCards.map((c) => (c.id === card.id ? { ...c, title: v } : c))
                              )
                            }
                            isOwner={ownerCanEdit}
                            label={`Card ${cardIdx + 1} Title`}
                            as="span"
                          />
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          <EditableText
                            value={card.description}
                            onChange={(v) =>
                              handleUpdateSiteLine(
                                'levelCards',
                                levelCards.map((c) => (c.id === card.id ? { ...c, description: v } : c))
                              )
                            }
                            isOwner={ownerCanEdit}
                            label={`Card ${cardIdx + 1} Description`}
                            multiline={true}
                            as="span"
                          />
                        </p>
                        <div className="pt-2 text-xs font-mono text-zinc-500">
                          <EditableText
                            value={card.tag}
                            onChange={(v) =>
                              handleUpdateSiteLine(
                                'levelCards',
                                levelCards.map((c) => (c.id === card.id ? { ...c, tag: v } : c))
                              )
                            }
                            isOwner={ownerCanEdit}
                            label={`Card ${cardIdx + 1} Tag`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Custom Sections assigned to WORK tab */}
        {customSections.some((s) => s.tab === 'work' && s.visible !== false) && (
          <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 py-10">
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
        )}
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
        {/* 7. About, Toolset & Interactive Career Timeline */}
        <AboutSection
          onOpenContact={() => {
            setActiveTab('contact');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          profile={profile}
          onUpdateProfile={handleSaveProfile}
          siteContent={siteContent}
          isOwner={ownerCanEdit}
          onUpdateSiteContent={handleUpdateSiteLine}
          milestones={resumeMilestones}
          onUpdateMilestone={handleUpdateResumeMilestone}
          onCreateMilestone={handleCreateResumeMilestone}
          onDeleteMilestone={handleDeleteResumeMilestone}
        />

        {/* Custom Sections assigned to ABOUT tab (e.g. Hardware Rig, Look-dev Pipeline) */}
        {customSections.some((s) => s.tab === 'about' && s.visible !== false) && (
          <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 pb-12">
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
        )}
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
        {/* Dedicated Resume Page (CV, PDF Download & Proficiencies) */}
        <ResumeSection
          profile={profile}
          resumePdf={resumePdf}
          onDownloadResume={handleDownloadResume}
          onOpenResumeUploader={() => setIsResumeUploaderOpen(true)}
          isOwner={ownerCanEdit}
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
      <footer className="print:hidden py-12 border-t border-zinc-800/80 bg-[#000000] text-zinc-500 text-xs font-mono">
        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 flex flex-col sm:flex-row items-center justify-between gap-6">
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

          {/* Owner badge (Only visible when logged in) */}
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
        options={siteContent.contactProjectOptions}
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
        siteContent={siteContent}
        onUpdateSiteContent={handleUpdateSiteLine}
        initialTab={sectionManagerTargetTab}
        initialSectionToEdit={editingCustomSection}
      />

      {/* Save Changes Before Closing Owner Mode Modal */}
      <UnsavedChangesModal
        isOpen={pendingOwnerCloseAction !== null}
        mode={pendingCloseModalMode}
        closeAction={pendingOwnerCloseAction}
        changedSections={changedOwnerSections}
        onSaveAndClose={handleSaveAndCloseOwnerMode}
        onDiscardAndClose={handleDiscardAndCloseOwnerMode}
        onConfirmForgetOnly={() => executeCloseOwnerMode('forgetDevice')}
        onCancel={() => setPendingOwnerCloseAction(null)}
      />

      {/* Owner-Only 2FA QR & Passcode Security Vault */}
      {isOwner && (
        <OwnerSecurityModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          onStatusMessage={showBanner}
        />
      )}
    </div>
  );
}
