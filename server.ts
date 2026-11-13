import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PUBLISHED_FILE_PATH = path.resolve(process.cwd(), 'src/data/publishedPortfolio.ts');

function readPublishedTimestamp(): number {
  try {
    if (!fs.existsSync(PUBLISHED_FILE_PATH)) return 0;
    const raw = fs.readFileSync(PUBLISHED_FILE_PATH, 'utf-8');
    const match = raw.match(/"?publishedAt"?\s*:\s*(\d+)/);
    return match ? Number(match[1]) || 0 : 0;
  } catch {
    return 0;
  }
}

function formatPublishedPortfolioTs(payload: {
  publishedAt: number;
  projects: unknown;
  profile: unknown;
  siteContent: unknown;
  customSections: unknown;
  resumeMilestones: unknown;
  resumePdf: unknown;
}): string {
  const safePayload = {
    publishedAt: payload.publishedAt,
    projects: payload.projects ?? null,
    profile: payload.profile ?? null,
    siteContent: payload.siteContent ?? null,
    customSections: payload.customSections ?? null,
    resumeMilestones: payload.resumeMilestones ?? null,
    resumePdf: payload.resumePdf ?? null,
  };

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

      const fileContent = formatPublishedPortfolioTs(
        isReset
          ? {
              publishedAt,
              projects: null,
              profile: null,
              siteContent: null,
              customSections: null,
              resumeMilestones: null,
              resumePdf: null,
            }
          : {
              publishedAt,
              projects: Array.isArray(body.projects) ? body.projects : null,
              profile: body.profile && typeof body.profile === 'object' ? body.profile : null,
              siteContent: body.siteContent && typeof body.siteContent === 'object' ? body.siteContent : null,
              customSections: Array.isArray(body.customSections) ? body.customSections : null,
              resumeMilestones: Array.isArray(body.resumeMilestones) ? body.resumeMilestones : null,
              resumePdf:
                body.resumePdf && typeof body.resumePdf === 'object' && body.resumePdf.dataUrl
                  ? body.resumePdf
                  : null,
            }
      );

      const dir = path.dirname(PUBLISHED_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const tempPath = `${PUBLISHED_FILE_PATH}.tmp`;
      await fs.promises.writeFile(tempPath, fileContent, 'utf-8');
      await fs.promises.rename(tempPath, PUBLISHED_FILE_PATH);

      res.json({ ok: true, publishedAt });
    } catch (err) {
      console.error('Failed to write publishedPortfolio.ts:', err);
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Failed to persist portfolio source.',
      });
    }
  });

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
