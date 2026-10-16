import { Request, Response, NextFunction } from 'express';

// ==========================================
// 1. Production Security Headers Middleware
// ==========================================

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent clickjacking - allow framing by AI Studio domain in dev/preview while denying arbitrary third-parties
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // Strict MIME-type sniffing prevention
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection header for legacy browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy: strict privacy preservation on cross-origin requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy: restrict high-privilege device APIs (camera, microphone, geolocation)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');

  // Remove Express identification banner to prevent banner grabbing
  res.removeHeader('X-Powered-By');

  next();
}

// ==========================================
// 2. In-Memory Sliding-Window Rate Limiter
// ==========================================

interface RateLimitRecord {
  timestamps: number[];
}

export class InMemoryRateLimiter {
  private requests: Map<string, RateLimitRecord> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 60) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Periodically clean up expired records every 5 minutes to prevent memory leak
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.requests.entries()) {
        record.timestamps = record.timestamps.filter((t) => now - t < this.windowMs);
        if (record.timestamps.length === 0) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  public check(key: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    let record = this.requests.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.requests.set(key, record);
    }

    // Filter to current sliding window
    record.timestamps = record.timestamps.filter((t) => now - t < this.windowMs);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, this.windowMs - (now - oldest));
      return { allowed: false, remaining: 0, resetMs };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: this.maxRequests - record.timestamps.length,
      resetMs: this.windowMs,
    };
  }
}

// Distinct rate limiters for general APIs and high-sensitivity actions
export const apiRateLimiter = new InMemoryRateLimiter(60000, 120); // 120 requests/minute for standard API calls
export const sensitiveActionLimiter = new InMemoryRateLimiter(60000, 20); // 20 requests/minute for checkout, refunds, management changes

export function rateLimitMiddleware(limiter: InMemoryRateLimiter) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Generate key based on authenticated user ID or remote IP address
    const clientKey =
      (req.headers['x-user-id'] as string) ||
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'anonymous';

    const check = limiter.check(`${req.path}_${clientKey}`);
    res.setHeader('X-RateLimit-Remaining', check.remaining.toString());

    if (!check.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Too Many Requests: Rate limit exceeded. Please retry after a brief delay.',
        retryAfterMs: check.resetMs,
      });
    }

    next();
  };
}

// ==========================================
// 3. Sensitive Input Sanitization & Path Traversal Guards
// ==========================================

export function sanitizePath(input: string): string {
  if (!input) return '';
  // Strip null bytes and normalize directory traversal attempts
  return input
    .replace(/\0/g, '')
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '')
    .trim();
}

export function isValidIdentifier(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  return id.length <= 128 && /^[a-zA-Z0-9_\-]+$/.test(id);
}
