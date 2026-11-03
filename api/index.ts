import type { IncomingMessage, ServerResponse } from 'http';
import { appPromise } from '../server';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    // In Vercel serverless functions, identify the authoritative requested path
    const invokePath =
      (req.headers['x-invoke-path'] as string) ||
      (req.headers['x-forwarded-uri'] as string) ||
      (req.headers['x-original-uri'] as string);

    if (invokePath && invokePath !== '/api' && invokePath !== '/api/') {
      req.url = invokePath;
    } else {
      const matchedPath = req.headers['x-matched-path'] as string;
      if (matchedPath && matchedPath !== '/api' && matchedPath !== '/api/' && req.url !== matchedPath) {
        req.url = matchedPath;
      }
    }

    const app = await appPromise;
    return app(req, res);
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
