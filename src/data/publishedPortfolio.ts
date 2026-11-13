import { ProjectItem } from '../types/portfolio';

export interface PublishedPortfolioData {
  publishedAt: number;
  projects: ProjectItem[] | null;
  profile: Record<string, any> | null;
  siteContent: Record<string, any> | null;
  customSections: any[] | null;
  resumeMilestones: any[] | null;
  resumePdf: {
    dataUrl: string;
    filename: string;
    uploadedAt: string;
    sizeBytes?: number;
  } | null;
}

/**
 * Bundled Owner Mode snapshot written automatically by the preview dev server
 * so Vercel / production static builds always ship with your latest Owner edits.
 */
export const PUBLISHED_PORTFOLIO: PublishedPortfolioData = {
  publishedAt: 0,
  projects: null,
  profile: null,
  siteContent: null,
  customSections: null,
  resumeMilestones: null,
  resumePdf: null,
};
