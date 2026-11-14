import {
  CustomSection,
  OwnerProfile,
  OwnerSessionSnapshot,
  ResumeMilestone,
  SiteContent,
  StoredResumePdf,
  createOwnerSessionSnapshot,
} from './portfolioStorage';
import { ProjectItem } from '../types/portfolio';

export interface PortfolioDataDocument {
  version: number;
  updatedAt: number;
  projects: ProjectItem[];
  profile: OwnerProfile;
  siteContent: SiteContent;
  customSections: CustomSection[];
  resumeMilestones: ResumeMilestone[];
  resumePdf: StoredResumePdf | null;
}

export interface GitHubSyncStatus {
  configured: boolean;
  hasToken: boolean;
  hasRepo: boolean;
  owner: string | null;
  repo: string | null;
  branch: string;
  path: string;
  canWriteLocal: boolean;
}

export interface GitHubPullResult {
  ok: boolean;
  source?: 'github' | 'local-file' | 'bundled-file';
  updatedAt: number;
  sha?: string;
  data?: PortfolioDataDocument;
  notConfigured?: boolean;
  error?: string;
}

export interface GitHubCommitResult {
  ok: boolean;
  committedToGitHub?: boolean;
  savedToLocalFile?: boolean;
  commitSha?: string;
  commitUrl?: string;
  fileSha?: string;
  updatedAt?: number;
  notConfigured?: boolean;
  error?: string;
}

export function parseGitHubRepoSlug(
  repoInput: string,
  ownerInput: string = ''
): { owner: string; repo: string } {
  const cleanedRepo = (repoInput || '').trim();
  const cleanedOwner = (ownerInput || '').trim();

  const urlMatch = cleanedRepo.match(
    /github\.com\/([^/]+)\/([^/\s#?]+?)(?:\.git)?(?:[/?#]|$)/i
  );
  if (urlMatch) {
    return {
      owner: urlMatch[1].trim(),
      repo: urlMatch[2].trim(),
    };
  }

  if (cleanedRepo.includes('/')) {
    const parts = cleanedRepo
      .split('/')
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1].replace(/\.git$/i, ''),
      };
    }
  }

  return {
    owner: cleanedOwner,
    repo: cleanedRepo.replace(/\.git$/i, ''),
  };
}

export function encodeBase64Utf8(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf-8').toString('base64');
  }
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeBase64Utf8(base64: string): string {
  const clean = (base64 || '').replace(/\s+/g, '');
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(clean, 'base64').toString('utf-8');
  }
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function isValidPortfolioDocument(candidate: any): candidate is PortfolioDataDocument {
  return Boolean(
    candidate &&
      typeof candidate === 'object' &&
      Array.isArray(candidate.projects) &&
      candidate.profile &&
      typeof candidate.profile === 'object' &&
      candidate.siteContent &&
      typeof candidate.siteContent === 'object' &&
      Array.isArray(candidate.customSections) &&
      Array.isArray(candidate.resumeMilestones)
  );
}

export function buildPortfolioDataDocument(
  snapshot: OwnerSessionSnapshot,
  updatedAt: number = Date.now()
): PortfolioDataDocument {
  const safe = createOwnerSessionSnapshot(snapshot);
  return {
    version: 1,
    updatedAt,
    projects: safe.projects,
    profile: safe.profile,
    siteContent: safe.siteContent,
    customSections: safe.customSections,
    resumeMilestones: safe.resumeMilestones,
    resumePdf: safe.resumePdf ?? null,
  };
}

export function snapshotFromPortfolioDocument(doc: PortfolioDataDocument): OwnerSessionSnapshot {
  return createOwnerSessionSnapshot({
    projects: doc.projects,
    profile: doc.profile,
    siteContent: doc.siteContent,
    customSections: doc.customSections,
    resumeMilestones: doc.resumeMilestones,
    resumePdf: doc.resumePdf ?? null,
  });
}

export async function fetchGitHubContentStatus(): Promise<GitHubSyncStatus> {
  try {
    const res = await fetch(`/api/github-content?status=1&t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json') || !res.ok) {
      return {
        configured: false,
        hasToken: false,
        hasRepo: false,
        owner: null,
        repo: null,
        branch: 'main',
        path: 'data.json',
        canWriteLocal: false,
      };
    }
    const data = await res.json();
    return {
      configured: Boolean(data?.configured),
      hasToken: Boolean(data?.hasToken),
      hasRepo: Boolean(data?.hasRepo),
      owner: data?.owner || null,
      repo: data?.repo || null,
      branch: data?.branch || 'main',
      path: data?.path || 'data.json',
      canWriteLocal: Boolean(data?.canWriteLocal),
    };
  } catch {
    return {
      configured: false,
      hasToken: false,
      hasRepo: false,
      owner: null,
      repo: null,
      branch: 'main',
      path: 'data.json',
      canWriteLocal: false,
    };
  }
}

export async function fetchPortfolioDataFromGitHub(): Promise<GitHubPullResult> {
  try {
    const res = await fetch(`/api/github-content?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
    });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return {
        ok: false,
        updatedAt: 0,
        notConfigured: true,
        error: 'Server API route /api/github-content is unavailable.',
      };
    }
    const payload = await res.json();
    if (!res.ok || !payload?.ok || !isValidPortfolioDocument(payload.data)) {
      return {
        ok: false,
        updatedAt: 0,
        notConfigured: Boolean(payload?.notConfigured) || res.status === 404,
        error: payload?.error || `Failed to read data.json (HTTP ${res.status})`,
      };
    }

    return {
      ok: true,
      source: payload.source,
      sha: payload.sha,
      updatedAt: Number(payload.updatedAt) || Number(payload.data.updatedAt) || 0,
      data: payload.data,
    };
  } catch (err) {
    return {
      ok: false,
      updatedAt: 0,
      error: err instanceof Error ? err.message : 'Network error reading data.json.',
    };
  }
}

export async function commitPortfolioDataToGitHub(
  snapshot: OwnerSessionSnapshot,
  options?: {
    updatedAt?: number;
    commitMessage?: string;
    keepalive?: boolean;
  }
): Promise<GitHubCommitResult> {
  try {
    const updatedAt =
      typeof options?.updatedAt === 'number' && options.updatedAt > 0
        ? options.updatedAt
        : Date.now();
    const document = buildPortfolioDataDocument(snapshot, updatedAt);
    const bodyString = JSON.stringify({
      data: document,
      commitMessage:
        options?.commitMessage?.trim() || 'chore(portfolio): update data.json via Owner Mode',
    });

    const canKeepalive = Boolean(options?.keepalive) && bodyString.length < 60_000;

    const res = await fetch('/api/github-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      keepalive: canKeepalive,
      body: bodyString,
    });

    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      return {
        ok: false,
        error: `Unexpected server response (${res.status}) when committing data.json.`,
      };
    }

    const payload = await res.json();
    if (res.ok && payload?.ok) {
      return {
        ok: true,
        committedToGitHub: Boolean(payload.committedToGitHub),
        savedToLocalFile: Boolean(payload.savedToLocalFile),
        commitSha: payload.commitSha || undefined,
        commitUrl: payload.commitUrl || undefined,
        fileSha: payload.fileSha || undefined,
        updatedAt: Number(payload.updatedAt) || updatedAt,
        notConfigured: Boolean(payload.notConfigured),
      };
    }

    return {
      ok: false,
      notConfigured: Boolean(payload?.notConfigured),
      error: payload?.error || `Failed to commit data.json (HTTP ${res.status})`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error committing data.json.',
    };
  }
}

export function createDataJsonExportString(
  snapshot: OwnerSessionSnapshot,
  updatedAt: number = Date.now()
): string {
  return JSON.stringify(buildPortfolioDataDocument(snapshot, updatedAt), null, 2) + '\n';
}

export function parseDataJsonImportString(rawInput: string): {
  ok: boolean;
  data?: PortfolioDataDocument;
  error?: string;
} {
  try {
    const trimmed = (rawInput || '').trim();
    if (!trimmed) {
      return { ok: false, error: 'Paste valid data.json content first.' };
    }
    const parsed = JSON.parse(trimmed);
    if (!isValidPortfolioDocument(parsed)) {
      return { ok: false, error: 'Invalid data.json format — missing required portfolio sections.' };
    }
    return { ok: true, data: parsed };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not parse JSON.',
    };
  }
}
