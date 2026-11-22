/**
 * In-memory sliding window Rate Limiter for Node.js / Express
 * Prevents bot abuse and excessive Gemini API quota consumption.
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // 1 minute default
    this.max = options.max || 10; // 10 requests per window default
    this.message = options.message || 'חרגת ממגבלת הבקשות (מקסימום 10 בדקה). אנא המתן מעט ונסה שוב.';
    this.requests = new Map(); // key -> Array of timestamps

    // Periodic cleanup of expired timestamps every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000).unref();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'ip-default';
      const sessionId = req.body?.session_id || req.headers['x-session-id'] || '';
      const key = sessionId ? `${ip}:${sessionId}` : ip;

      const now = Date.now();
      const userRequests = this.requests.get(key) || [];
      const validRequests = userRequests.filter(t => now - t < this.windowMs);

      if (validRequests.length >= this.max) {
        const oldest = validRequests[0];
        const resetSeconds = Math.ceil((this.windowMs - (now - oldest)) / 1000);
        res.set('Retry-After', String(resetSeconds));
        return res.status(429).json({
          error: this.message,
          retryAfterSeconds: resetSeconds
        });
      }

      validRequests.push(now);
      this.requests.set(key, validRequests);
      next();
    };
  }
}

// 10 submissions per minute per IP / session for content submission and AI endpoints
export const statementRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'חרגת ממגבלת הפעולות (מקסימום 10 שליחות לדקה). אנא המתן מעט ונסה שוב.'
}).middleware();
