import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

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

interface ResolvedGitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
}

function parseRepoTarget(rawRepo: string, rawOwner: string): { owner: string; repo: string } {
  const cleanedRepo = (rawRepo || '').trim();
  const cleanedOwner = (rawOwner || '').trim();

  const urlMatch = cleanedRepo.match(/github\.com\/([^/]+)\/([^/\s#?]+?)(?:\.git)?(?:[/?#]|$)/i);
  if (urlMatch) {
    return {
      owner: urlMatch[1].trim(),
      repo: urlMatch[2].trim(),
    };
  }

  if (cleanedRepo.includes('/')) {
    const parts = cleanedRepo.split('/').map((s) => s.trim()).filter(Boolean);
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

function resolveGitHubConfig(): ResolvedGitHubConfig {
  const token = (process.env.GITHUB_TOKEN || '').trim();
  const rawRepo = (
    process.env.GITHUB_REPO ||
    process.env.VERCEL_GIT_REPO_SLUG ||
    ''
  ).trim();
  const rawOwner = (
    process.env.GITHUB_OWNER ||
    process.env.VERCEL_GIT_REPO_OWNER ||
    ''
  ).trim();

  const { owner, repo } = parseRepoTarget(rawRepo, rawOwner);
  const branch = (
    process.env.GITHUB_BRANCH ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    'main'
  ).trim();
  const filePath = (process.env.GITHUB_DATA_PATH || 'data.json')
    .trim()
    .replace(/^\/+/, '');

  return { token, owner, repo, branch, filePath };
}

function isValidPortfolioData(candidate: any): boolean {
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

function buildGitHubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'avinash-portfolio-github-cms',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function fetchContentsEntry(config: ResolvedGitHubConfig) {
  const encodedPath = config.filePath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  const url = `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(
    config.repo
  )}/contents/${encodedPath}?ref=${encodeURIComponent(config.branch)}&t=${Date.now()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: buildGitHubHeaders(config.token),
  });

  if (!res.ok) {
    const errBody: any = await res.json().catch(() => ({}));
    return {
      ok: false as const,
      status: res.status,
      error: errBody?.message || `GitHub Contents API HTTP ${res.status}`,
    };
  }

  const entry: any = await res.json();
  let rawText = '';

  if (typeof entry?.content === 'string' && entry.content.trim().length > 0) {
    rawText = Buffer.from(entry.content.replace(/\s+/g, ''), 'base64').toString('utf-8');
  } else if (entry?.sha) {
    const blobUrl = `https://api.github.com/repos/${encodeURIComponent(
      config.owner
    )}/${encodeURIComponent(config.repo)}/git/blobs/${encodeURIComponent(entry.sha)}`;
    const blobRes = await fetch(blobUrl, {
      method: 'GET',
      headers: buildGitHubHeaders(config.token),
    });
    if (blobRes.ok) {
      const blobData: any = await blobRes.json();
      if (typeof blobData?.content === 'string') {
        rawText = Buffer.from(blobData.content.replace(/\s+/g, ''), 'base64').toString('utf-8');
      }
    }
  } else if (typeof entry?.download_url === 'string') {
    const dlRes = await fetch(entry.download_url, {
      headers: config.token ? { Authorization: `Bearer ${config.token}` } : {},
    });
    if (dlRes.ok) {
      rawText = await dlRes.text();
    }
  }

  return {
    ok: true as const,
    sha: typeof entry?.sha === 'string' ? entry.sha : undefined,
    rawText,
  };
}

async function commitContentsEntry(
  config: ResolvedGitHubConfig,
  formattedJson: string,
  commitMessage: string
) {
  const encodedPath = config.filePath
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  const endpoint = `https://api.github.com/repos/${encodeURIComponent(
    config.owner
  )}/${encodeURIComponent(config.repo)}/contents/${encodedPath}`;
  const base64Content = Buffer.from(formattedJson, 'utf-8').toString('base64');

  for (let attempt = 0; attempt < 2; attempt++) {
    const current = await fetchContentsEntry(config);
    if (!current.ok && current.status !== 404) {
      return {
        ok: false as const,
        status: current.status,
        error: current.error,
      };
    }

    const putBody: Record<string, string> = {
      message: commitMessage,
      content: base64Content,
      branch: config.branch,
    };
    if (current.ok && current.sha) {
      putBody.sha = current.sha;
    }

    const putRes = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        ...buildGitHubHeaders(config.token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(putBody),
    });

    const putData: any = await putRes.json().catch(() => ({}));
    if (putRes.ok) {
      return {
        ok: true as const,
        commitSha: String(putData?.commit?.sha || ''),
        commitUrl: String(putData?.commit?.html_url || ''),
        fileSha: String(putData?.content?.sha || ''),
      };
    }

    if (putRes.status === 409 && attempt === 0) {
      continue;
    }

    return {
      ok: false as const,
      status: putRes.status,
      error:
        putRes.status === 401 || putRes.status === 403
          ? 'GITHUB_TOKEN was rejected or lacks Contents Read/Write (repo) permission for this repository.'
          : putData?.message || `GitHub Contents commit failed (HTTP ${putRes.status})`,
    };
  }

  return {
    ok: false as const,
    status: 409,
    error: 'Conflict updating data.json after retry.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

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

      const publicUrl = await persistDataUrlToUploads(
        dataUrl,
        typeof filename === 'string' ? filename : undefined
      );
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

  app.get('/api/github-content', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const config = resolveGitHubConfig();
    const localDataPath = path.resolve(process.cwd(), config.filePath);

    if (req.query?.status === '1') {
      res.json({
        ok: true,
        configured: Boolean(config.token && config.owner && config.repo),
        hasToken: Boolean(config.token),
        hasRepo: Boolean(config.owner && config.repo),
        owner: config.owner || null,
        repo: config.repo || null,
        branch: config.branch,
        path: config.filePath,
        canWriteLocal: !IS_PRODUCTION,
      });
      return;
    }

    if (config.owner && config.repo) {
      try {
        const remote = await fetchContentsEntry(config);
        if (remote.ok && remote.rawText) {
          const parsed = JSON.parse(remote.rawText);
          if (isValidPortfolioData(parsed)) {
            res.json({
              ok: true,
              source: 'github',
              sha: remote.sha,
              updatedAt: Number(parsed.updatedAt) || 0,
              data: parsed,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('GitHub Contents read failed, falling back to local data.json:', err);
      }
    }

    try {
      if (fs.existsSync(localDataPath)) {
        const localRaw = await fs.promises.readFile(localDataPath, 'utf-8');
        const parsed = JSON.parse(localRaw);
        if (isValidPortfolioData(parsed)) {
          res.json({
            ok: true,
            source: 'local-file',
            updatedAt: Number(parsed.updatedAt) || 0,
            data: parsed,
          });
          return;
        }
      }
    } catch (err) {
      console.error('Failed reading local data.json:', err);
    }

    res.status(404).json({
      ok: false,
      notConfigured: true,
      error: 'No valid data.json found on GitHub or disk.',
    });
  });

  const handleGitHubCommit = async (req: express.Request, res: express.Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const config = resolveGitHubConfig();
    const localDataPath = path.resolve(process.cwd(), config.filePath);

    try {
      const body = req.body || {};
      const payload = body?.data ?? body;

      if (!isValidPortfolioData(payload)) {
        res.status(400).json({ ok: false, error: 'Invalid data.json portfolio payload.' });
        return;
      }

      const updatedAt = Number(payload.updatedAt) || Date.now();
      const nextDocument = {
        version: Number(payload.version) || 1,
        updatedAt,
        projects: payload.projects,
        profile: payload.profile,
        siteContent: payload.siteContent,
        customSections: payload.customSections,
        resumeMilestones: payload.resumeMilestones,
        resumePdf: payload.resumePdf ?? null,
      };
      const formattedJson = JSON.stringify(nextDocument, null, 2) + '\n';

      // Keep local data.json synchronized cleanly when running in writable dev/preview server
      let savedToLocalFile = false;
      if (!IS_PRODUCTION) {
        const dir = path.dirname(localDataPath);
        await fs.promises.mkdir(dir, { recursive: true });
        const tmpPath = `${localDataPath}.tmp`;
        await fs.promises.writeFile(tmpPath, formattedJson, 'utf-8');
        await fs.promises.rename(tmpPath, localDataPath);
        savedToLocalFile = true;
      }

      if (!config.token || !config.owner || !config.repo) {
        if (savedToLocalFile) {
          res.json({
            ok: true,
            committedToGitHub: false,
            savedToLocalFile: true,
            notConfigured: true,
            updatedAt,
            message:
              'Saved to local data.json. Set GITHUB_TOKEN and GITHUB_REPO in Vercel Environment Variables to commit directly to GitHub.',
          });
          return;
        }

        res.status(400).json({
          ok: false,
          notConfigured: true,
          error: !config.token
            ? 'GITHUB_TOKEN is not configured in Vercel Environment Variables.'
            : 'GITHUB_REPO (e.g. username/repo) is not configured in Vercel Environment Variables.',
        });
        return;
      }

      const commitMessage =
        typeof body?.commitMessage === 'string' && body.commitMessage.trim()
          ? body.commitMessage.trim()
          : `chore(portfolio): update ${config.filePath} via Owner Mode`;

      const commitResult = await commitContentsEntry(config, formattedJson, commitMessage);
      if (!commitResult.ok) {
        res.status(commitResult.status || 500).json({
          ok: false,
          savedToLocalFile,
          error: commitResult.error,
        });
        return;
      }

      res.json({
        ok: true,
        committedToGitHub: true,
        savedToLocalFile,
        commitSha: commitResult.commitSha,
        commitUrl: commitResult.commitUrl,
        fileSha: commitResult.fileSha,
        updatedAt,
      });
    } catch (err) {
      console.error('Failed to commit data.json:', err);
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'GitHub commit failed.',
      });
    }
  };

  app.put('/api/github-content', handleGitHubCommit);
  app.post('/api/github-content', handleGitHubCommit);

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
