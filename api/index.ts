import type { IncomingMessage, ServerResponse } from 'http';
import { appPromise } from '../server';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    // When Vercel executes rewrites (e.g. /api/(.*) -> /api),
    // Vercel stores the matched destination URL in x-matched-path or x-invoke-path.
    // Ensure req.url reflects the full requested API path so Express routes match seamlessly.
    const matchedPath =
      (req.headers['x-matched-path'] as string) ||
      (req.headers['x-invoke-path'] as string);

    if (matchedPath && req.url !== matchedPath) {
      req.url = matchedPath;
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
