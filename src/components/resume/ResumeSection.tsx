import React from 'react';
import {
  Download,
  Printer,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  CheckCircle2,
  Compass,
  Layers,
} from 'lucide-react';
import {
  OwnerProfile,
  StoredResumePdf,
  SiteContent,
  CustomSection,
  StatCardItem,
  ResumeSkillItem,
  ResumeEducationItem,
  LevelDesignCardItem,
  resolveResumeBenchmarks,
  resolveResumeSkills,
  resolveResumeEducation,
  resolveLevelCards,
} from '../../utils/portfolioStorage';
import {
  getBalancedContainerClass,
  getBalancedItemSpanClass,
} from '../../utils/layoutHelpers';
import { EditableText } from '../common/EditableText';
import { CustomSectionRenderer } from '../portfolio/CustomSectionRenderer';

interface ResumeSectionProps {
  profile: OwnerProfile;
  resumePdf: StoredResumePdf | null;
  onDownloadResume: () => void;
  onOpenResumeUploader: () => void;
  isOwner?: boolean;
  siteContent?: SiteContent;
  onUpdateSiteContent?: (key: keyof SiteContent, value: any) => void;
  customSections?: CustomSection[];
  onUpdateCustomSection?: (id: string, updated: Partial<CustomSection>) => void;
  onDeleteCustomSection?: (id: string) => void;
  onAddSectionClick?: (tab: 'home' | 'work' | 'about' | 'resume' | 'contact') => void;
  onEditSectionClick?: (section: CustomSection) => void;
}

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  profile,
  resumePdf,
  onDownloadResume,
  onOpenResumeUploader,
  isOwner = false,
  siteContent,
  onUpdateSiteContent,
  customSections = [],
  onUpdateCustomSection,
  onDeleteCustomSection,
  onAddSectionClick,
  onEditSectionClick,
}) => {
  const benchmarks = resolveResumeBenchmarks(siteContent);
  const skills = resolveResumeSkills(siteContent);
  const educationList = resolveResumeEducation(siteContent);
  const levelCards = resolveLevelCards(siteContent);

  const showBenchmarks =
    siteContent?.resumeShowBenchmarks !== false && (benchmarks.length > 0 || isOwner);
  const showExecutiveProfile = siteContent?.resumeShowExecutiveProfile !== false;
  const showSkills =
    siteContent?.resumeShowSkills !== false && (skills.length > 0 || isOwner);
  const showEducation =
    siteContent?.resumeShowEducation !== false && (educationList.length > 0 || isOwner);
  const showCoreCompetency = siteContent?.workShowLevelDesign !== false;

  const handlePrint = () => {
    window.print();
  };

  // Benchmark CRUD
  const handleAddBenchmark = () => {
    const next: StatCardItem[] = [
      ...benchmarks,
      {
        id: `bench-${Date.now()}`,
        value: 'UE5.4',
        label: 'Custom Benchmark Metric',
      },
    ];
    onUpdateSiteContent?.('resumeBenchmarks', next);
  };

  const handleUpdateBenchmark = (id: string, patch: Partial<StatCardItem>) => {
    const next = benchmarks.map((b) => (b.id === id ? { ...b, ...patch } : b));
    onUpdateSiteContent?.('resumeBenchmarks', next);
  };

  const handleDeleteBenchmark = (id: string) => {
    const next = benchmarks.filter((b) => b.id !== id);
    onUpdateSiteContent?.('resumeBenchmarks', next);
  };

  // Skills CRUD
  const handleAddSkill = () => {
    const next: ResumeSkillItem[] = [
      ...skills,
      {
        id: `rskill-${Date.now()}`,
        category: 'New Technical Area',
        items: 'Systems Architecture, Blueprints, Unreal Engine 5.4 Tools',
      },
    ];
    onUpdateSiteContent?.('resumeSkills', next);
  };

  const handleUpdateSkill = (id: string, patch: Partial<ResumeSkillItem>) => {
    const next = skills.map((s) => (s.id === id ? { ...s, ...patch } : s));
    onUpdateSiteContent?.('resumeSkills', next);
  };

  const handleDeleteSkill = (id: string) => {
    const next = skills.filter((s) => s.id !== id);
    onUpdateSiteContent?.('resumeSkills', next);
  };

  // Education CRUD
  const handleAddEducation = () => {
    const next: ResumeEducationItem[] = [
      ...educationList,
      {
        id: `redu-${Date.now()}`,
        degree: 'Certification or Academic Credential',
        details: 'Institution · Specialization',
        badge: 'Unreal Engine 5',
      },
    ];
    onUpdateSiteContent?.('resumeEducation', next);
  };

  const handleUpdateEducation = (id: string, patch: Partial<ResumeEducationItem>) => {
    const next = educationList.map((e) => (e.id === id ? { ...e, ...patch } : e));
    onUpdateSiteContent?.('resumeEducation', next);
  };

  const handleDeleteEducation = (id: string) => {
    const next = educationList.filter((e) => e.id !== id);
    onUpdateSiteContent?.('resumeEducation', next);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] py-12 sm:py-16 bg-[#050505] print:min-h-0 print:py-0 print:bg-white">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-14 relative z-10 space-y-8 print:px-0 print:space-y-5">
        {/* Top Action Bar & Header Banner */}
        <div className="p-5 sm:p-8 bg-zinc-950/90 border border-zinc-800 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-6 print:border-zinc-300 print:border-b print:border-t-0 print:border-x-0 print:rounded-none print:bg-white print:p-0 print:pb-4 print:shadow-none print:backdrop-blur-none">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-red-500 print:text-red-700 uppercase tracking-widest font-semibold">
              <FileText className="w-4 h-4 shrink-0" />
              <EditableText
                value={siteContent?.resumeHeaderKicker || 'OFFICIAL CURRICULUM VITAE'}
                onChange={(v) => onUpdateSiteContent?.('resumeHeaderKicker', v)}
                isOwner={isOwner}
                label="Resume Kicker"
                as="span"
              />
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-black text-white print:text-zinc-950 tracking-tight">
              <EditableText
                value={siteContent?.resumeHeaderHeadline || `${profile.name} — Resume`}
                onChange={(v) => onUpdateSiteContent?.('resumeHeaderHeadline', v)}
                isOwner={isOwner}
                label="Resume Headline"
                as="span"
              />
            </h1>

            <div className="text-xs font-mono text-zinc-400 print:text-zinc-600 flex flex-wrap items-center gap-3">
              <span className="text-red-400 print:text-red-700 font-semibold">
                <EditableText
                  value={siteContent?.resumeHeaderRole || profile.title}
                  onChange={(v) => onUpdateSiteContent?.('resumeHeaderRole', v)}
                  isOwner={isOwner}
                  label="Resume Role"
                  as="span"
                />
              </span>
              <span className="text-zinc-600 print:text-zinc-400">·</span>
              <EditableText
                value={siteContent?.resumeHeaderEngine || 'Unreal Engine 5.4 · C++ & Blueprints'}
                onChange={(v) => onUpdateSiteContent?.('resumeHeaderEngine', v)}
                isOwner={isOwner}
                label="Resume Engine & Tools"
                as="span"
              />
              <span className="text-zinc-600 print:text-zinc-400">·</span>
              <EditableText
                value={siteContent?.resumeHeaderAvailability || 'Available for Lead & Senior Roles'}
                onChange={(v) => onUpdateSiteContent?.('resumeHeaderAvailability', v)}
                isOwner={isOwner}
                label="Resume Availability"
                as="span"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 print:hidden">
            <button
              onClick={onDownloadResume}
              className="px-5 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-red-600/30 cursor-pointer font-sans"
              title="Download official PDF resume"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 rounded-xl text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer"
              title="Print or save as browser PDF"
            >
              <Printer className="w-4 h-4 text-zinc-400" />
              <span>Print</span>
            </button>

            {isOwner && (
              <button
                onClick={onOpenResumeUploader}
                className="px-3.5 py-3 bg-red-950/50 hover:bg-red-900/60 text-red-300 border border-red-800/60 rounded-xl text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Upload or replace your custom PDF resume file"
              >
                <Upload className="w-3.5 h-3.5 text-red-400" />
                <span>{resumePdf ? 'Replace PDF' : 'Upload PDF'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status notice if custom resume PDF is uploaded */}
        {resumePdf && (
          <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-2xl flex items-center justify-between text-xs font-mono text-zinc-300 print:hidden">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
              <span>
                Active Custom PDF: <strong className="text-white">{resumePdf.filename}</strong>
              </span>
            </div>
            <button
              onClick={onDownloadResume}
              className="text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Download Attached File</span>
              <Download className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* 1. Production Benchmarks Strip */}
        {showBenchmarks && (
          <div className="space-y-3 print:break-inside-avoid">
            {isOwner && (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono print:hidden">
                <span className="text-[11px] uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Production Benchmarks ({benchmarks.length})</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddBenchmark}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Benchmark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSiteContent?.('resumeShowBenchmarks', false)}
                    className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-red-400 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    title="Remove this Benchmarks section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Section</span>
                  </button>
                </div>
              </div>
            )}

            {benchmarks.length > 0 && (
              <div className={getBalancedContainerClass(benchmarks.length, 'stats')}>
                {benchmarks.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`${getBalancedItemSpanClass(idx, benchmarks.length, 'stats')} group relative p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1 print:bg-zinc-50 print:border-zinc-300 print:p-3.5 print:rounded-xl`}
                  >
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeleteBenchmark(item.id)}
                        className="absolute top-2.5 right-2.5 p-1 text-zinc-500 hover:text-red-400 bg-zinc-900 rounded border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer print:hidden"
                        title="Remove benchmark card"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    <div
                      className={`text-2xl font-display font-extrabold ${
                        item.highlight || idx === 1
                          ? 'text-red-500 print:text-red-700'
                          : 'text-white print:text-zinc-950'
                      }`}
                    >
                      <EditableText
                        value={item.value}
                        onChange={(v) => handleUpdateBenchmark(item.id, { value: v })}
                        isOwner={isOwner}
                        label="Benchmark Value"
                        as="span"
                      />
                    </div>
                    <div className="text-xs font-mono text-zinc-500 print:text-zinc-600">
                      <EditableText
                        value={item.label}
                        onChange={(v) => handleUpdateBenchmark(item.id, { label: v })}
                        isOwner={isOwner}
                        label="Benchmark Label"
                        as="span"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Executive Design Profile Summary */}
        {showExecutiveProfile && (
          <div className="relative bg-zinc-950/80 border border-zinc-800 rounded-3xl p-8 space-y-3 print:bg-white print:border-zinc-300 print:p-5 print:rounded-xl print:break-inside-avoid">
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-widest text-red-500 print:text-red-700 font-semibold">
                <EditableText
                  value={siteContent?.resumeExecutiveKicker || 'EXECUTIVE DESIGN PROFILE'}
                  onChange={(v) => onUpdateSiteContent?.('resumeExecutiveKicker', v)}
                  isOwner={isOwner}
                  label="Executive Kicker"
                />
              </div>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => onUpdateSiteContent?.('resumeShowExecutiveProfile', false)}
                  className="px-2.5 py-1 text-[11px] font-mono text-zinc-400 hover:text-red-400 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-red-500/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer print:hidden"
                  title="Remove Executive Profile section"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Section</span>
                </button>
              )}
            </div>

            <p className="text-sm sm:text-base text-zinc-300 print:text-zinc-800 font-light leading-relaxed text-justify">
              <EditableText
                value={
                  siteContent?.resumeExecutiveText ||
                  profile.leadCopy ||
                  'Professional Game Designer specializing in core gameplay loops, mechanics, player pacing, and level architecture — powered by a lifelong hobby and passion as a Lighting Artist.'
                }
                onChange={(v) => onUpdateSiteContent?.('resumeExecutiveText', v)}
                isOwner={isOwner}
                label="Executive Narrative"
                multiline={true}
                as="span"
              />
            </p>
          </div>
        )}

        {/* 3. Custom Sections for Resume Tab */}
        <CustomSectionRenderer
          sections={customSections}
          tab="resume"
          isOwner={isOwner}
          onUpdateSection={onUpdateCustomSection}
          onDeleteSection={onDeleteCustomSection}
          onAddSectionClick={onAddSectionClick}
          onEditSectionClick={onEditSectionClick}
        />

        {/* Owner Quick-Add Section bar on Resume tab */}
        {isOwner && (
          <div className="p-4 bg-zinc-950/60 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono print:hidden">
            <span className="text-zinc-400">
              Need another Benchmarks KPI strip, Callout box, or custom cards section in Resume?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAddSectionClick?.('resume')}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-red-600/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Section to Resume</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Technical Competencies Matrix (Dynamic + Adaptive Grid) */}
        {showSkills && (
          <div className="p-6 sm:p-8 bg-zinc-950/80 border border-zinc-800 rounded-3xl space-y-6 print:bg-white print:border-zinc-300 print:p-5 print:rounded-xl print:break-inside-avoid">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-mono uppercase tracking-widest text-red-500 print:text-red-700 font-semibold">
                <EditableText
                  value={siteContent?.resumeSkillsHeading || 'TECHNICAL MATRIX & PROFICIENCIES'}
                  onChange={(v) => onUpdateSiteContent?.('resumeSkillsHeading', v)}
                  isOwner={isOwner}
                  label="Technical Matrix Heading"
                  as="span"
                />
              </div>

              {isOwner && (
                <div className="flex items-center gap-2 text-xs font-mono print:hidden">
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Proficiency</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSiteContent?.('resumeShowSkills', false)}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Remove Technical Matrix section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Section</span>
                  </button>
                </div>
              )}
            </div>

            {skills.length > 0 && (
              <div className={`${getBalancedContainerClass(skills.length, 'split')} text-xs`}>
                {skills.map((skill, idx) => (
                  <div
                    key={skill.id}
                    className={`${getBalancedItemSpanClass(idx, skills.length, 'split')} group relative p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-1.5 print:bg-zinc-50 print:border-zinc-300 print:rounded-xl`}
                  >
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSkill(skill.id)}
                        className="absolute top-3 right-3 p-1 text-zinc-500 hover:text-red-400 bg-zinc-950 rounded border border-zinc-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer print:hidden"
                        title="Remove skill block"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}

                    <div className="font-mono font-bold text-white print:text-zinc-950 pr-6">
                      <EditableText
                        value={skill.category}
                        onChange={(v) => handleUpdateSkill(skill.id, { category: v })}
                        isOwner={isOwner}
                        label="Skill Category"
                        as="span"
                      />
                    </div>
                    <div className="text-zinc-400 print:text-zinc-700 font-light leading-relaxed text-justify">
                      <EditableText
                        value={skill.items}
                        onChange={(v) => handleUpdateSkill(skill.id, { items: v })}
                        isOwner={isOwner}
                        label="Skill Details"
                        multiline={true}
                        as="span"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. Education & Accreditations (Dynamic + Add/Remove) */}
        {showEducation && (
          <div className="p-6 sm:p-8 bg-zinc-950/80 border border-zinc-800 rounded-3xl space-y-4 print:bg-white print:border-zinc-300 print:p-5 print:rounded-xl print:break-inside-avoid">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-mono uppercase tracking-widest text-red-500 print:text-red-700 font-semibold">
                <EditableText
                  value={siteContent?.resumeEducationHeading || 'EDUCATION & ACCREDITATIONS'}
                  onChange={(v) => onUpdateSiteContent?.('resumeEducationHeading', v)}
                  isOwner={isOwner}
                  label="Education Heading"
                  as="span"
                />
              </div>

              {isOwner && (
                <div className="flex items-center gap-2 text-xs font-mono print:hidden">
                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Credential</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSiteContent?.('resumeShowEducation', false)}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                    title="Remove Education section"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Section</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {educationList.map((edu) => (
                <div
                  key={edu.id}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-2 first:pt-0 border-t border-zinc-900 first:border-t-0 print:border-zinc-200"
                >
                  <div>
                    <div className="font-semibold text-white print:text-zinc-950 font-display text-sm">
                      <EditableText
                        value={edu.degree}
                        onChange={(v) => handleUpdateEducation(edu.id, { degree: v })}
                        isOwner={isOwner}
                        label="Degree / Certification"
                        as="span"
                      />
                    </div>
                    <div className="text-zinc-400 print:text-zinc-600 font-mono mt-0.5">
                      <EditableText
                        value={edu.details}
                        onChange={(v) => handleUpdateEducation(edu.id, { details: v })}
                        isOwner={isOwner}
                        label="Institution / Honors"
                        as="span"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-[11px] text-red-400 print:bg-zinc-100 print:border-zinc-300 print:text-red-700">
                      <EditableText
                        value={edu.badge}
                        onChange={(v) => handleUpdateEducation(edu.id, { badge: v })}
                        isOwner={isOwner}
                        label="Credential Badge"
                        as="span"
                      />
                    </span>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 bg-zinc-900 border border-zinc-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer print:hidden"
                        title="Remove credential"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Core Competency / Game Design Focus Section (Moved from Work Tab) */}
        {showCoreCompetency && (
          <section
            id="level-design"
            className="p-6 sm:p-8 bg-zinc-950/80 border border-zinc-800 rounded-3xl space-y-8 print:bg-white print:border-zinc-300 print:p-5 print:rounded-xl print:break-inside-avoid"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex-1">
                <div className="text-xs font-mono text-red-500 print:text-red-700 uppercase tracking-wider mb-2">
                  <EditableText
                    value={siteContent?.levelKicker || 'Primary Profession · Game Design'}
                    onChange={(v) => onUpdateSiteContent?.('levelKicker', v)}
                    isOwner={isOwner}
                    label="Core Competency Kicker"
                  />
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-zinc-100 print:text-zinc-950">
                  <EditableText
                    value={siteContent?.levelHeadline || 'Core Competency'}
                    onChange={(v) => onUpdateSiteContent?.('levelHeadline', v)}
                    isOwner={isOwner}
                    label="Core Competency Headline"
                    as="span"
                  />
                </h2>
                <p className="text-sm text-zinc-400 print:text-zinc-700 mt-2 leading-relaxed text-justify">
                  <EditableText
                    value={
                      siteContent?.levelDescription ||
                      'Great game design balances player agency, mechanical depth, and intuitive guidance. Here is how core loops, encounter spaces, and player feedback systems are architected from paper to engine.'
                    }
                    onChange={(v) => onUpdateSiteContent?.('levelDescription', v)}
                    isOwner={isOwner}
                    label="Core Competency Description"
                    multiline={true}
                    as="span"
                  />
                </p>
              </div>

              {isOwner && (
                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto print:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      const nextCard: LevelDesignCardItem = {
                        id: `level-card-${Date.now()}`,
                        title: 'New Spatial Pillar',
                        description:
                          'Describe encounter pacing, spatial flow, or environmental sightline framing.',
                        tag: 'Unreal Engine 5.4 · Level Design',
                        icon: 'compass',
                      };
                      onUpdateSiteContent?.('levelCards', [...levelCards, nextCard]);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono flex items-center gap-1.5 shadow-sm shadow-red-600/30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSiteContent?.('workShowLevelDesign', false)}
                    className="px-2.5 py-1.5 bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-xl text-xs font-mono flex items-center gap-1 cursor-pointer"
                    title="Remove Core Competency section (restore in Manage Sections)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Section</span>
                  </button>
                </div>
              )}
            </div>

            {levelCards.length > 0 && (
              <div className={getBalancedContainerClass(levelCards.length, 'cards')}>
                {levelCards.map((card, cardIdx) => {
                  const iconKind =
                    card.icon ||
                    (cardIdx % 3 === 1 ? 'layers' : cardIdx % 3 === 2 ? 'sparkles' : 'compass');
                  return (
                    <div
                      key={card.id}
                      className={`${getBalancedItemSpanClass(
                        cardIdx,
                        levelCards.length,
                        'cards'
                      )} relative p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col justify-between gap-4 h-full print:bg-zinc-50 print:border-zinc-300`}
                    >
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSiteContent?.(
                              'levelCards',
                              levelCards.filter((c) => c.id !== card.id)
                            )
                          }
                          className="absolute top-4 right-4 p-1.5 bg-zinc-950/80 hover:bg-red-900/60 text-zinc-500 hover:text-red-400 border border-zinc-800 rounded-lg transition-colors cursor-pointer print:hidden"
                          title="Delete card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="space-y-4">
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
                        <h3 className="text-lg font-display font-semibold text-zinc-100 print:text-zinc-950 pr-8">
                          <EditableText
                            value={card.title}
                            onChange={(v) =>
                              onUpdateSiteContent?.(
                                'levelCards',
                                levelCards.map((c) => (c.id === card.id ? { ...c, title: v } : c))
                              )
                            }
                            isOwner={isOwner}
                            label={`Card ${cardIdx + 1} Title`}
                            as="span"
                          />
                        </h3>
                        <p className="text-xs text-zinc-400 print:text-zinc-700 leading-relaxed text-justify">
                          <EditableText
                            value={card.description}
                            onChange={(v) =>
                              onUpdateSiteContent?.(
                                'levelCards',
                                levelCards.map((c) =>
                                  c.id === card.id ? { ...c, description: v } : c
                                )
                              )
                            }
                            isOwner={isOwner}
                            label={`Card ${cardIdx + 1} Description`}
                            multiline={true}
                            as="span"
                          />
                        </p>
                      </div>
                      <div className="pt-2 border-t border-zinc-800/60 print:border-zinc-300 text-xs font-mono text-zinc-500 print:text-zinc-600">
                        <EditableText
                          value={card.tag}
                          onChange={(v) =>
                            onUpdateSiteContent?.(
                              'levelCards',
                              levelCards.map((c) => (c.id === card.id ? { ...c, tag: v } : c))
                            )
                          }
                          isOwner={isOwner}
                          label={`Card ${cardIdx + 1} Tag`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
