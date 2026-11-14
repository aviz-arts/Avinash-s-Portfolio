import fs from 'node:fs';
import path from 'node:path';

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
    // Files larger than 1MB omit inline content in Contents API; read via Git Blobs API
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

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');
  const config = resolveGitHubConfig();

  if (req.method === 'GET') {
    const isStatusCheck =
      req.query?.status === '1' ||
      (typeof req.url === 'string' && req.url.includes('status=1'));

    if (isStatusCheck) {
      res.status(200).json({
        ok: true,
        configured: Boolean(config.token && config.owner && config.repo),
        hasToken: Boolean(config.token),
        hasRepo: Boolean(config.owner && config.repo),
        owner: config.owner || null,
        repo: config.repo || null,
        branch: config.branch,
        path: config.filePath,
        canWriteLocal: false,
      });
      return;
    }

    if (config.owner && config.repo) {
      try {
        const remote = await fetchContentsEntry(config);
        if (remote.ok && remote.rawText) {
          const parsed = JSON.parse(remote.rawText);
          if (isValidPortfolioData(parsed)) {
            res.status(200).json({
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
        console.warn('GitHub Contents read failed, checking local fallback:', err);
      }
    }

    try {
      const localPath = path.resolve(process.cwd(), config.filePath);
      if (fs.existsSync(localPath)) {
        const localRaw = fs.readFileSync(localPath, 'utf-8');
        const parsed = JSON.parse(localRaw);
        if (isValidPortfolioData(parsed)) {
          res.status(200).json({
            ok: true,
            source: 'bundled-file',
            updatedAt: Number(parsed.updatedAt) || 0,
            data: parsed,
          });
          return;
        }
      }
    } catch {
      // Ignore fallback error
    }

    res.status(404).json({
      ok: false,
      notConfigured: true,
      error: 'GitHub repository environment variables (GITHUB_TOKEN, GITHUB_REPO) are not configured yet.',
    });
    return;
  }

  if (req.method === 'PUT' || req.method === 'POST') {
    if (!config.token) {
      res.status(400).json({
        ok: false,
        notConfigured: true,
        error: 'GITHUB_TOKEN is not configured in Vercel Environment Variables.',
      });
      return;
    }

    if (!config.owner || !config.repo) {
      res.status(400).json({
        ok: false,
        notConfigured: true,
        error: 'GITHUB_REPO (e.g. username/repo) is not configured in Vercel Environment Variables.',
      });
      return;
    }

    try {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
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
      const commitMessage =
        typeof body?.commitMessage === 'string' && body.commitMessage.trim()
          ? body.commitMessage.trim()
          : `chore(portfolio): update ${config.filePath} via Owner Mode`;

      const commitResult = await commitContentsEntry(config, formattedJson, commitMessage);
      if (!commitResult.ok) {
        res.status(commitResult.status || 500).json({
          ok: false,
          error: commitResult.error,
        });
        return;
      }

      res.status(200).json({
        ok: true,
        committedToGitHub: true,
        commitSha: commitResult.commitSha,
        commitUrl: commitResult.commitUrl,
        fileSha: commitResult.fileSha,
        updatedAt,
      });
      return;
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'GitHub commit failed.',
      });
      return;
    }
  }

  res.status(405).json({ ok: false, error: 'Method not allowed.' });
}
