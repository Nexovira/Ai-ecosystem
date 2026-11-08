import type { IncomingMessage, ServerResponse } from 'http';
import { appPromise } from '../server';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const rawUrl = req.url || '/';

    // 1. Check if Vercel passed __path rewrite query parameter
    let targetPath = '';
    let queryString = '';

    if (rawUrl.includes('?')) {
      const parts = rawUrl.split('?');
      const searchParams = new URLSearchParams(parts[1]);
      const pathParam = searchParams.get('__path');
      if (pathParam) {
        targetPath = `/api/${pathParam.replace(/^\/+/, '')}`;
        searchParams.delete('__path');
        const remainingQuery = searchParams.toString();
        queryString = remainingQuery ? `?${remainingQuery}` : '';
      }
    }

    // 2. Check Vercel routing headers if __path wasn't extracted
    if (!targetPath) {
      const invokePath =
        (req.headers['x-invoke-path'] as string) ||
        (req.headers['x-forwarded-uri'] as string) ||
        (req.headers['x-original-uri'] as string);

      if (invokePath && invokePath !== '/api' && invokePath !== '/api/') {
        targetPath = invokePath;
      } else {
        const matchedPath = req.headers['x-matched-path'] as string;
        if (matchedPath && matchedPath !== '/api' && matchedPath !== '/api/' && req.url !== matchedPath) {
          targetPath = matchedPath;
        }
      }
    }

    // 3. Fallback to rawUrl if it already includes /api/...
    if (!targetPath) {
      targetPath = rawUrl.split('?')[0];
      if (!queryString && rawUrl.includes('?')) {
        queryString = '?' + rawUrl.split('?').slice(1).join('?');
      }
    }

    req.url = targetPath + queryString;

    const app = await appPromise;
    return new Promise<void>((resolve, reject) => {
      res.on('finish', () => resolve());
      res.on('close', () => resolve());
      res.on('error', (err) => reject(err));
      app(req, res);
    });
  } catch (err: unknown) {
    console.error('Vercel API Gateway Error:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : 'Internal Server Error',
          code: 'SERVERLESS_FUNCTION_ERROR',
        })
      );
    }
  }
}
