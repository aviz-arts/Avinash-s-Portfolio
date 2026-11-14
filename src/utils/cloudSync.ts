import {
  OwnerSessionSnapshot,
  SiteContent,
  createOwnerSessionSnapshot,
} from './portfolioStorage';

const CLOUD_SYNC_STORAGE_KEY = 'avinash_portfolio_cloud_sync_v1';
const GIST_FILENAME = 'portfolio-live-sync.json';
const MAX_INLINE_CLOUD_ASSET_BYTES = 1_500_000;

export interface CloudSyncCredentials {
  gistId: string;
  githubToken: string;
}

export interface CloudPullResult {
  ok: boolean;
  publishedAt: number;
  snapshot?: OwnerSessionSnapshot;
  gistId?: string;
  notConfigured?: boolean;
  error?: string;
}

export interface CloudPushResult {
  ok: boolean;
  gistId?: string;
  publishedAt?: number;
  warnings?: string[];
  error?: string;
}

const memoryCloudCreds = new Map<string, string>();

function readCloudItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // Fallback to memory
    }
  }
  return memoryCloudCreds.get(key) || null;
}

function writeCloudItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore quota
    }
  }
  memoryCloudCreds.set(key, value);
}

function deleteCloudItem(key: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }
  memoryCloudCreds.delete(key);
}

export function extractGistId(input: string): string {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  // Accept full GitHub Gist URLs like https://gist.github.com/user/<id>
  const urlMatch = trimmed.match(/gist\.github\.com\/(?:[^/]+\/)?([a-f0-9]{16,64})/i);
  if (urlMatch) return urlMatch[1];
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function getStoredCloudSyncCredentials(): CloudSyncCredentials | null {
  try {
    const raw = readCloudItem(CLOUD_SYNC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        gistId: extractGistId(String(parsed.gistId || '')),
        githubToken: String(parsed.githubToken || '').trim(),
      };
    }
  } catch {
    return null;
  }
  return null;
}

export function saveStoredCloudSyncCredentials(creds: CloudSyncCredentials): void {
  const clean: CloudSyncCredentials = {
    gistId: extractGistId(creds.gistId),
    githubToken: (creds.githubToken || '').trim(),
  };
  writeCloudItem(CLOUD_SYNC_STORAGE_KEY, JSON.stringify(clean));
}

export function clearStoredCloudSyncCredentials(): void {
  deleteCloudItem(CLOUD_SYNC_STORAGE_KEY);
}

export function resolveEffectiveCloudGistId(siteContent?: Partial<SiteContent>): string {
  const stored = getStoredCloudSyncCredentials()?.gistId;
  if (stored) return stored;
  const fromContent = extractGistId(siteContent?.cloudSyncGistId || '');
  if (fromContent) return fromContent;
  const fromEnv =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_CLOUD_SYNC_GIST_ID
      ? extractGistId(String((import.meta as any).env.VITE_CLOUD_SYNC_GIST_ID))
      : '';
  return fromEnv;
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to encode media blob'));
      reader.readAsDataURL(blob);
    });
  }
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

async function inlineLocalUploadUrls<T>(
  value: T,
  warnings: string[]
): Promise<T> {
  if (typeof value === 'string') {
    if (value.startsWith('/uploads/') && typeof fetch === 'function') {
      try {
        const res = await fetch(value);
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 0 && blob.size <= MAX_INLINE_CLOUD_ASSET_BYTES) {
            return (await blobToDataUrl(blob)) as unknown as T;
          }
          if (blob.size > MAX_INLINE_CLOUD_ASSET_BYTES) {
            warnings.push(
              `${value} (${(blob.size / (1024 * 1024)).toFixed(1)}MB) exceeds 1.5MB live cloud limit and will sync after Vercel redeploy.`
            );
          }
        }
      } catch {
        // Keep path as-is
      }
    }
    return value;
  }

  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) {
      out.push(await inlineLocalUploadUrls(item, warnings));
    }
    return out as unknown as T;
  }

  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = await inlineLocalUploadUrls(v, warnings);
    }
    return out as T;
  }

  return value;
}

export async function preparePortableCloudSnapshot(
  snapshot: OwnerSessionSnapshot,
  gistId?: string
): Promise<{ portable: OwnerSessionSnapshot; warnings: string[] }> {
  const warnings: string[] = [];
  const cloned = createOwnerSessionSnapshot(snapshot);
  if (gistId) {
    cloned.siteContent.cloudSyncGistId = gistId;
  }
  const portable = await inlineLocalUploadUrls(cloned, warnings);
  return { portable, warnings };
}

export function isValidSnapshotPayload(candidate: any): candidate is OwnerSessionSnapshot {
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

export async function checkServerCloudSyncStatus(): Promise<{
  serverConfigured: boolean;
  gistId?: string;
}> {
  try {
    const res = await fetch('/api/cloud-sync?status=1', {
      method: 'GET',
      cache: 'no-store',
    });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json') || !res.ok) {
      return { serverConfigured: false };
    }
    const data = await res.json();
    return {
      serverConfigured: Boolean(data?.serverConfigured),
      gistId: data?.gistId ? extractGistId(String(data.gistId)) : undefined,
    };
  } catch {
    return { serverConfigured: false };
  }
}

export async function fetchSnapshotFromCloud(gistIdInput?: string): Promise<CloudPullResult> {
  const cleanGistId = extractGistId(gistIdInput || '');

  // If no public Gist ID is embedded on client yet, check if server/Vercel env has one
  if (!cleanGistId) {
    try {
      const serverRes = await fetch(`/api/cloud-sync?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
      });
      const ct = serverRes.headers.get('content-type') || '';
      if (ct.includes('application/json') && serverRes.ok) {
        const data = await serverRes.json();
        if (data?.ok && isValidSnapshotPayload(data.snapshot)) {
          return {
            ok: true,
            publishedAt: Number(data.publishedAt) || 0,
            snapshot: data.snapshot,
            gistId: data.gistId ? extractGistId(String(data.gistId)) : undefined,
          };
        }
      }
    } catch {
      // Ignore if endpoint absent
    }
    return { ok: false, publishedAt: 0, notConfigured: true };
  }

  try {
    const res = await fetch(`https://api.github.com/gists/${encodeURIComponent(cleanGistId)}?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });

    if (!res.ok) {
      return {
        ok: false,
        publishedAt: 0,
        error: res.status === 404 ? 'Sync Gist not found. Verify your Gist ID.' : `Cloud pull HTTP ${res.status}`,
      };
    }

    const gistData = await res.json();
    const fileEntry =
      gistData?.files?.[GIST_FILENAME] ||
      (gistData?.files ? Object.values(gistData.files)[0] : null);

    if (!fileEntry) {
      return { ok: false, publishedAt: 0, error: 'Sync Gist has no portfolio data yet.' };
    }

    let rawContent = typeof fileEntry.content === 'string' ? fileEntry.content : '';
    if (fileEntry.truncated && typeof fileEntry.raw_url === 'string') {
      const rawRes = await fetch(`${fileEntry.raw_url}?t=${Date.now()}`, { cache: 'no-store' });
      if (rawRes.ok) {
        rawContent = await rawRes.text();
      }
    }

    const parsed = JSON.parse(rawContent);
    const snapshot = parsed?.snapshot ?? parsed;
    const publishedAt = Number(parsed?.publishedAt) || 0;

    if (!isValidSnapshotPayload(snapshot)) {
      return { ok: false, publishedAt: 0, error: 'Remote Cloud Sync JSON format is invalid.' };
    }

    return {
      ok: true,
      publishedAt,
      snapshot,
      gistId: cleanGistId,
    };
  } catch (err) {
    return {
      ok: false,
      publishedAt: 0,
      error: err instanceof Error ? err.message : 'Failed to fetch Cloud Sync data.',
    };
  }
}

export async function pushSnapshotToCloud(
  snapshot: OwnerSessionSnapshot,
  publishedAt: number = Date.now(),
  overrideCreds?: Partial<CloudSyncCredentials>
): Promise<CloudPushResult> {
  const storedCreds = getStoredCloudSyncCredentials();
  const token = (overrideCreds?.githubToken ?? storedCreds?.githubToken ?? '').trim();
  const targetGistId = extractGistId(
    overrideCreds?.gistId || storedCreds?.gistId || snapshot.siteContent?.cloudSyncGistId || ''
  );

  const { portable, warnings } = await preparePortableCloudSnapshot(snapshot, targetGistId);

  // Path 1: Direct GitHub Gist sync using Owner's browser token (works on static Vercel AND Preview)
  if (token) {
    try {
      const payloadString = JSON.stringify(
        {
          version: 1,
          publishedAt,
          snapshot: portable,
        },
        null,
        2
      );

      const endpoint = targetGistId
        ? `https://api.github.com/gists/${encodeURIComponent(targetGistId)}`
        : 'https://api.github.com/gists';

      const res = await fetch(endpoint, {
        method: targetGistId ? 'PATCH' : 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Avinash Portfolio — Live Cross-Site Sync (Public Read, Owner Write)',
          ...(targetGistId ? {} : { public: true }),
          files: {
            [GIST_FILENAME]: {
              content: payloadString,
            },
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          ok: false,
          error:
            res.status === 401 || res.status === 403
              ? 'GitHub Token rejected or missing "gist" scope. Check token permissions.'
              : data?.message || `GitHub Gist sync failed (HTTP ${res.status})`,
        };
      }

      const finalGistId = extractGistId(String(data?.id || targetGistId));
      saveStoredCloudSyncCredentials({ gistId: finalGistId, githubToken: token });

      // Ensure snapshot updated Gist ID if freshly created
      if (!targetGistId && finalGistId) {
        const patchedContent = JSON.stringify(
          {
            version: 1,
            publishedAt,
            snapshot: {
              ...portable,
              siteContent: { ...portable.siteContent, cloudSyncGistId: finalGistId },
            },
          },
          null,
          2
        );
        await fetch(`https://api.github.com/gists/${encodeURIComponent(finalGistId)}`, {
          method: 'PATCH',
          headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: { [GIST_FILENAME]: { content: patchedContent } },
          }),
        }).catch(() => {});
      }

      return {
        ok: true,
        gistId: finalGistId,
        publishedAt,
        warnings,
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Network error pushing to Cloud Gist.',
      };
    }
  }

  // Path 2: Server/Vercel serverless /api/cloud-sync fallback (when env vars configured)
  try {
    const serverRes = await fetch('/api/cloud-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publishedAt,
        snapshot: portable,
        gistId: targetGistId || undefined,
      }),
    });
    const ct = serverRes.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await serverRes.json();
      if (serverRes.ok && data?.ok) {
        return {
          ok: true,
          gistId: data.gistId ? extractGistId(String(data.gistId)) : targetGistId,
          publishedAt,
          warnings,
        };
      }
      return {
        ok: false,
        error: data?.error || 'Cloud Sync is not configured yet.',
      };
    }
  } catch {
    // Fallback error below
  }

  return {
    ok: false,
    error: 'Cloud Sync token not configured on this browser. Open Cloud Sync in Owner Bar to connect.',
  };
}

export function createSyncPackageString(
  snapshot: OwnerSessionSnapshot,
  publishedAt: number = Date.now()
): string {
  const safe = createOwnerSessionSnapshot(snapshot);
  return JSON.stringify(
    {
      format: 'AVIZ_PORTFOLIO_SYNC_V1',
      publishedAt,
      snapshot: safe,
    },
    null,
    2
  );
}

export function parseSyncPackageString(rawInput: string): {
  ok: boolean;
  publishedAt?: number;
  snapshot?: OwnerSessionSnapshot;
  error?: string;
} {
  try {
    const trimmed = (rawInput || '').trim();
    if (!trimmed) {
      return { ok: false, error: 'Paste a Sync Package JSON or publishedPortfolio snapshot first.' };
    }
    const parsed = JSON.parse(trimmed);
    const snapshotCandidate = parsed?.snapshot ?? parsed;
    if (!isValidSnapshotPayload(snapshotCandidate)) {
      return { ok: false, error: 'Invalid Sync Package format — missing portfolio sections.' };
    }
    return {
      ok: true,
      publishedAt: Number(parsed?.publishedAt) || Date.now(),
      snapshot: snapshotCandidate,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not parse Sync Package JSON.',
    };
  }
}
