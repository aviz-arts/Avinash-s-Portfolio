const GIST_FILENAME = 'portfolio-live-sync.json';

function extractCleanGistId(value: unknown): string {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return '';
  const match = trimmed.match(/gist\.github\.com\/(?:[^/]+\/)?([a-f0-9]{16,64})/i);
  if (match) return match[1];
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
}

function isValidSnapshot(candidate: any): boolean {
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

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  const envGistId = extractCleanGistId(
    process.env.PORTFOLIO_GIST_ID || process.env.VITE_CLOUD_SYNC_GIST_ID || ''
  );
  const envToken = (process.env.PORTFOLIO_GITHUB_TOKEN || '').trim();

  if (req.method === 'GET') {
    const isStatusCheck =
      req.query?.status === '1' ||
      (typeof req.url === 'string' && req.url.includes('status=1'));

    if (isStatusCheck) {
      res.status(200).json({
        serverConfigured: Boolean(envToken && envGistId),
        gistId: envGistId || undefined,
      });
      return;
    }

    const requestedGistId = extractCleanGistId(req.query?.gistId) || envGistId;
    if (!requestedGistId) {
      res.status(404).json({
        ok: false,
        notConfigured: true,
        error: 'Cloud Sync Gist ID is not configured.',
      });
      return;
    }

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'avinash-portfolio-cloud-sync',
      };
      if (envToken) {
        headers.Authorization = `Bearer ${envToken}`;
      }

      const gistRes = await fetch(
        `https://api.github.com/gists/${encodeURIComponent(requestedGistId)}?t=${Date.now()}`,
        { method: 'GET', headers }
      );

      if (!gistRes.ok) {
        res.status(gistRes.status).json({
          ok: false,
          error: `GitHub Gist returned HTTP ${gistRes.status}`,
        });
        return;
      }

      const gistData: any = await gistRes.json();
      const fileEntry: any =
        gistData?.files?.[GIST_FILENAME] ||
        (gistData?.files ? Object.values(gistData.files)[0] : null);

      if (!fileEntry) {
        res.status(404).json({ ok: false, error: 'Sync Gist has no portfolio file.' });
        return;
      }

      let rawContent = typeof fileEntry.content === 'string' ? fileEntry.content : '';
      if (fileEntry.truncated && typeof fileEntry.raw_url === 'string') {
        const rawRes = await fetch(`${fileEntry.raw_url}?t=${Date.now()}`);
        if (rawRes.ok) {
          rawContent = await rawRes.text();
        }
      }

      const parsed = JSON.parse(rawContent);
      const snapshot = parsed?.snapshot ?? parsed;
      const publishedAt = Number(parsed?.publishedAt) || 0;

      if (!isValidSnapshot(snapshot)) {
        res.status(422).json({ ok: false, error: 'Invalid Cloud Sync snapshot payload.' });
        return;
      }

      res.status(200).json({
        ok: true,
        publishedAt,
        snapshot,
        gistId: requestedGistId,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Cloud Sync read failed.',
      });
    }
    return;
  }

  if (req.method === 'POST') {
    if (!envToken) {
      res.status(400).json({
        ok: false,
        notConfigured: true,
        error: 'PORTFOLIO_GITHUB_TOKEN is not configured on this server.',
      });
      return;
    }

    try {
      const body =
        typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const snapshot = body?.snapshot;
      if (!isValidSnapshot(snapshot)) {
        res.status(400).json({ ok: false, error: 'Missing valid portfolio snapshot.' });
        return;
      }

      const publishedAt = Number(body.publishedAt) || Date.now();
      const targetGistId = extractCleanGistId(body.gistId) || envGistId;

      const nextSnapshot = targetGistId
        ? {
            ...snapshot,
            siteContent: { ...snapshot.siteContent, cloudSyncGistId: targetGistId },
          }
        : snapshot;

      const contentString = JSON.stringify(
        { version: 1, publishedAt, snapshot: nextSnapshot },
        null,
        2
      );

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
            [GIST_FILENAME]: {
              content: contentString,
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

      const finalGistId = extractCleanGistId(ghData?.id || targetGistId);
      res.status(200).json({
        ok: true,
        gistId: finalGistId,
        publishedAt,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Cloud Sync write failed.',
      });
    }
    return;
  }

  res.status(405).json({ ok: false, error: 'Method not allowed.' });
}
