import type { IncomingMessage, ServerResponse } from 'http';
import { appPromise } from '../server';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appPromise;
  return app(req, res);
}
