import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const CLOUD_GIST_FILENAME = 'portfolio-live-sync.json';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function resolveServerPort(): number {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      const parsed = Number(args[i + 1]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    } else if (args[i].startsWith('--port=')) {
      const parsed = Number(args[i].slice('--port='.length));
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }

  if (IS_PRODUCTION && process.env.PORT) {
    const prodPort = Number(process.env.PORT);
    if (Number.isFinite(prodPort) && prodPort > 0) return prodPort;
  }

  const defaultAppPort = Number(process.env.DEFAULT_APP_PORT);
  if (Number.isFinite(defaultAppPort) && defaultAppPort > 0) return defaultAppPort;

  const envPort = Number(process.env.PORT);
  const nginxPort = Number(process.env.NGINX_PORT);
  if (Number.isFinite(envPort) && envPort > 0 && envPort !== nginxPort) {
    return envPort;
  }

  return 3000;
}

const PORT = resolveServerPort();
const HOST = '0.0.0.0';
const PUBLISHED_FILE_PATH = path.resolve(process.cwd(), 'src/data/publishedPortfolio.ts');
const PUBLISHED_JSON_PATH = path.resolve(process.cwd(), 'public/published-portfolio.json');
const PUBLIC_UPLOADS_DIR = path.resolve(process.cwd(), 'public/uploads');

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
};

function sanitizeSlug(name?: string): string {
  const base = (name || 'media')
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 36);
  return base || 'media';
}

async function persistDataUrlToUploads(dataUrl: string, suggestedName?: string): Promise<string> {
  const match = dataUrl.match(/^data:([a-zA-Z0-9.+/-]+)(?:;[^,]*)?;base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return dataUrl;

  const mime = match[1].toLowerCase();
  const ext = MIME_TO_EXT[mime];
  if (!ext) return dataUrl;

  const buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
  if (buffer.length === 0) return dataUrl;

  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12);
  const slug = sanitizeSlug(suggestedName);
  const fileName = `${slug}-${hash}.${ext}`;

  await fs.promises.mkdir(PUBLIC_UPLOADS_DIR, { recursive: true });
  const targetPath = path.join(PUBLIC_UPLOADS_DIR, fileName);

  if (!fs.existsSync(targetPath)) {
    const tmpPath = `${targetPath}.tmp`;
    await fs.promises.writeFile(tmpPath, buffer);
    await fs.promises.rename(tmpPath, targetPath);
  }

  return `/uploads/${fileName}`;
}

async function internalizeMediaDataUrls<T>(value: T, keyHint?: string): Promise<T> {
  if (typeof value === 'string') {
    if (
      value.startsWith('data:image/') ||
      value.startsWith('data:video/') ||
      value.startsWith('data:application/pdf')
    ) {
      return (await persistDataUrlToUploads(value, keyHint)) as unknown as T;
    }
    return value;
  }

  if (Array.isArray(value)) {
    const out = [];
    for (let i = 0; i < value.length; i++) {
      out.push(await internalizeMediaDataUrls(value[i], `${keyHint || 'item'}-${i}`));
    }
    return out as unknown as T;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const suggestedName =
      typeof record.filename === 'string'
        ? record.filename
        : typeof record.title === 'string'
        ? record.title
        : typeof record.id === 'string'
        ? record.id
        : keyHint;

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(record)) {
      out[k] = await internalizeMediaDataUrls(v, k === 'dataUrl' ? suggestedName : k);
    }
    return out as T;
  }

  return value;
}

function readPublishedTimestamp(): number {
  try {
    if (fs.existsSync(PUBLISHED_JSON_PATH)) {
      const jsonRaw = fs.readFileSync(PUBLISHED_JSON_PATH, 'utf-8');
      const parsed = JSON.parse(jsonRaw);
      if (parsed && Number(parsed.publishedAt) > 0) {
        return Number(parsed.publishedAt);
      }
    }
  } catch {
    // Fallback to TS file check
  }

  try {
    if (!fs.existsSync(PUBLISHED_FILE_PATH)) return 0;
    const raw = fs.readFileSync(PUBLISHED_FILE_PATH, 'utf-8');
    const match = raw.match(/"?publishedAt"?\s*:\s*(\d+)/);
    return match ? Number(match[1]) || 0 : 0;
  } catch {
    return 0;
  }
}

function buildSafePayload(payload: {
  publishedAt: number;
  projects: unknown;
  profile: unknown;
  siteContent: unknown;
  customSections: unknown;
  resumeMilestones: unknown;
  resumePdf: unknown;
}) {
  return {
    publishedAt: payload.publishedAt,
    projects: payload.projects ?? null,
    profile: payload.profile ?? null,
    siteContent: payload.siteContent ?? null,
    customSections: payload.customSections ?? null,
    resumeMilestones: payload.resumeMilestones ?? null,
    resumePdf: payload.resumePdf ?? null,
  };
}

function formatPublishedPortfolioTs(safePayload: ReturnType<typeof buildSafePayload>): string {
  return `import { ProjectItem } from '../types/portfolio';

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
export const PUBLISHED_PORTFOLIO: PublishedPortfolioData = ${JSON.stringify(safePayload, null, 2)};
`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/publish-status', (_req, res) => {
    const canWriteToSource = !IS_PRODUCTION && fs.existsSync(PUBLISHED_FILE_PATH);
    res.json({
      canWriteToSource,
      publishedAt: readPublishedTimestamp(),
    });
  });

  app.post('/api/upload-media', async (req, res) => {
    if (IS_PRODUCTION) {
      res.status(403).json({
        ok: false,
        readOnly: true,
        error: 'Media disk uploads are disabled in static production mode.',
      });
      return;
    }

    try {
      const { dataUrl, filename } = req.body || {};
      if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        res.status(400).json({ ok: false, error: 'Missing valid base64 dataUrl.' });
        return;
      }

      const publicUrl = await persistDataUrlToUploads(dataUrl, typeof filename === 'string' ? filename : undefined);
      if (publicUrl === dataUrl) {
        res.status(400).json({ ok: false, error: 'Unsupported media format for static upload.' });
        return;
      }

      res.json({ ok: true, url: publicUrl });
    } catch (err) {
      console.error('Failed to persist uploaded media:', err);
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to save uploaded media file.',
      });
    }
  });

  app.post('/api/publish-portfolio', async (req, res) => {
    if (IS_PRODUCTION) {
      res.status(403).json({
        ok: false,
        readOnly: true,
        error: 'Source filesystem is read-only in static production mode.',
      });
      return;
    }

    try {
      const body = req.body;
      if (!body || typeof body !== 'object') {
        res.status(400).json({ ok: false, error: 'Invalid portfolio payload.' });
        return;
      }

      const publishedAt = Number(body.publishedAt) || Date.now();
      const isReset = Boolean(body.reset);

      const rawPayload = isReset
        ? buildSafePayload({
            publishedAt,
            projects: null,
            profile: null,
            siteContent: null,
            customSections: null,
            resumeMilestones: null,
            resumePdf: null,
          })
        : buildSafePayload({
            publishedAt,
            projects: await internalizeMediaDataUrls(
              Array.isArray(body.projects) ? body.projects : null,
              'project'
            ),
            profile: await internalizeMediaDataUrls(
              body.profile && typeof body.profile === 'object' ? body.profile : null,
              'profile'
            ),
            siteContent: await internalizeMediaDataUrls(
              body.siteContent && typeof body.siteContent === 'object' ? body.siteContent : null,
              'site'
            ),
            customSections: await internalizeMediaDataUrls(
              Array.isArray(body.customSections) ? body.customSections : null,
              'section'
            ),
            resumeMilestones: await internalizeMediaDataUrls(
              Array.isArray(body.resumeMilestones) ? body.resumeMilestones : null,
              'milestone'
            ),
            resumePdf: await internalizeMediaDataUrls(
              body.resumePdf && typeof body.resumePdf === 'object' && body.resumePdf.dataUrl
                ? body.resumePdf
                : null,
              'resume'
            ),
          });

      const fileContent = formatPublishedPortfolioTs(rawPayload);

      const tsDir = path.dirname(PUBLISHED_FILE_PATH);
      if (!fs.existsSync(tsDir)) {
        fs.mkdirSync(tsDir, { recursive: true });
      }
      const tsTempPath = `${PUBLISHED_FILE_PATH}.tmp`;
      await fs.promises.writeFile(tsTempPath, fileContent, 'utf-8');
      await fs.promises.rename(tsTempPath, PUBLISHED_FILE_PATH);

      const jsonDir = path.dirname(PUBLISHED_JSON_PATH);
      if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
      }
      const jsonTempPath = `${PUBLISHED_JSON_PATH}.tmp`;
      await fs.promises.writeFile(jsonTempPath, JSON.stringify(rawPayload, null, 2), 'utf-8');
      await fs.promises.rename(jsonTempPath, PUBLISHED_JSON_PATH);

      res.json({ ok: true, publishedAt });
    } catch (err) {
      console.error('Failed to write publishedPortfolio.ts:', err);
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to persist portfolio source.',
      });
    }
  });

  app.get('/api/cloud-sync', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const cleanId = (val: unknown) => {
      const s = typeof val === 'string' ? val.trim() : '';
      const m = s.match(/gist\.github\.com\/(?:[^/]+\/)?([a-f0-9]{16,64})/i);
      return m ? m[1] : s.replace(/[^a-zA-Z0-9_-]/g, '');
    };
    const envGistId = cleanId(process.env.PORTFOLIO_GIST_ID || process.env.VITE_CLOUD_SYNC_GIST_ID || '');
    const envToken = (process.env.PORTFOLIO_GITHUB_TOKEN || '').trim();

    if (req.query?.status === '1') {
      res.json({
        serverConfigured: Boolean(envToken && envGistId),
        gistId: envGistId || undefined,
      });
      return;
    }

    const targetGistId = cleanId(req.query?.gistId) || envGistId;
    if (!targetGistId) {
      res.status(404).json({ ok: false, notConfigured: true, error: 'Cloud Sync Gist ID is not configured.' });
      return;
    }

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'avinash-portfolio-cloud-sync',
      };
      if (envToken) headers.Authorization = `Bearer ${envToken}`;

      const gistRes = await fetch(
        `https://api.github.com/gists/${encodeURIComponent(targetGistId)}?t=${Date.now()}`,
        { method: 'GET', headers }
      );
      if (!gistRes.ok) {
        res.status(gistRes.status).json({ ok: false, error: `GitHub Gist HTTP ${gistRes.status}` });
        return;
      }

      const gistData: any = await gistRes.json();
      const fileEntry: any =
        gistData?.files?.[CLOUD_GIST_FILENAME] ||
        (gistData?.files ? Object.values(gistData.files)[0] : null);
      if (!fileEntry) {
        res.status(404).json({ ok: false, error: 'Sync Gist has no portfolio file.' });
        return;
      }

      let rawContent = typeof fileEntry.content === 'string' ? fileEntry.content : '';
      if (fileEntry.truncated && typeof fileEntry.raw_url === 'string') {
        const rawRes = await fetch(`${fileEntry.raw_url}?t=${Date.now()}`);
        if (rawRes.ok) rawContent = await rawRes.text();
      }

      const parsed = JSON.parse(rawContent);
      const snapshot = parsed?.snapshot ?? parsed;
      res.json({
        ok: true,
        publishedAt: Number(parsed?.publishedAt) || 0,
        snapshot,
        gistId: targetGistId,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Cloud Sync read failed.',
      });
    }
  });

  app.post('/api/cloud-sync', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const cleanId = (val: unknown) => {
      const s = typeof val === 'string' ? val.trim() : '';
      const m = s.match(/gist\.github\.com\/(?:[^/]+\/)?([a-f0-9]{16,64})/i);
      return m ? m[1] : s.replace(/[^a-zA-Z0-9_-]/g, '');
    };
    const envGistId = cleanId(process.env.PORTFOLIO_GIST_ID || process.env.VITE_CLOUD_SYNC_GIST_ID || '');
    const envToken = (process.env.PORTFOLIO_GITHUB_TOKEN || '').trim();

    if (!envToken) {
      res.status(400).json({
        ok: false,
        notConfigured: true,
        error: 'PORTFOLIO_GITHUB_TOKEN is not configured on this server.',
      });
      return;
    }

    try {
      const { snapshot, publishedAt: rawTs, gistId } = req.body || {};
      if (!snapshot || typeof snapshot !== 'object' || !Array.isArray(snapshot.projects)) {
        res.status(400).json({ ok: false, error: 'Missing valid portfolio snapshot.' });
        return;
      }

      const publishedAt = Number(rawTs) || Date.now();
      const targetGistId = cleanId(gistId) || envGistId;
      const nextSnapshot = targetGistId
        ? {
            ...snapshot,
            siteContent: { ...(snapshot.siteContent || {}), cloudSyncGistId: targetGistId },
          }
        : snapshot;

      const endpoint = targetGistId
        ? `https://api.github.com/gists/${encodeURIComponent(targetGistId)}`
        : 'https://api.github.com/gists';

      const ghRes = await fetch(endpoint, {
        method: targetGistId ? 'PATCH' : 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${envToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'avinash-portfolio-cloud-sync',
        },
        body: JSON.stringify({
          description: 'Avinash Portfolio — Live Cross-Site Sync (Public Read, Owner Write)',
          ...(targetGistId ? {} : { public: true }),
          files: {
            [CLOUD_GIST_FILENAME]: {
              content: JSON.stringify({ version: 1, publishedAt, snapshot: nextSnapshot }, null, 2),
            },
          },
        }),
      });

      const ghData: any = await ghRes.json().catch(() => ({}));
      if (!ghRes.ok) {
        res.status(ghRes.status).json({
          ok: false,
          error: ghData?.message || `GitHub Gist write failed (HTTP ${ghRes.status})`,
        });
        return;
      }

      res.json({
        ok: true,
        gistId: cleanId(ghData?.id || targetGistId),
        publishedAt,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Cloud Sync write failed.',
      });
    }
  });

  // Serve uploaded media from public/uploads directly so newly uploaded images,
  // videos, and PDFs render immediately in preview without waiting on Vite watch
  app.use('/uploads', express.static(PUBLIC_UPLOADS_DIR));

  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
