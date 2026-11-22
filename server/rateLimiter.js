/**
 * In-memory sliding window Rate Limiter for Node.js / Express
 * Prevents bot abuse, multiple voting floods, and brute-force attacks.
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // 1 minute default
    this.max = options.max || 10; // 10 requests per window default
    this.message = options.message || 'חרגת ממגבלת הבקשות (מקסימום 10 בדקה). אנא המתן מעט ונסה שוב.';
    this.keyGenerator = options.keyGenerator || null;
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
      let key;
      if (this.keyGenerator) {
        key = this.keyGenerator(req);
      } else {
        const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'ip-default';
        const sessionId = req.body?.session_id || req.headers['x-session-id'] || '';
        key = sessionId ? `${ip}:${sessionId}` : ip;
      }

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

// 1. Rate limiter for content submission and AI endpoints (10 requests per minute)
export const statementRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'חרגת ממגבלת הפעולות (מקסימום 10 שליחות לדקה). אנא המתן מעט ונסה שוב.'
}).middleware();

// 2. Rate limiter for voting (45 votes per minute per IP/Session - allows natural human browsing while blocking automated spam floods)
export const voteRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  max: 45,
  message: 'קצב ההצבעה מהיר מדי. אנא המתן מספר שניות והמשך.'
}).middleware();

// 3. Rate limiter for Admin Login attempts (5 failed attempts per 15 minutes per IP)
export const adminLoginRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6,
  message: 'נרשמו יותר מדי ניסיונות כניסה כושלים לממשק הניהול. לצורכי אבטחה, הגישה נחסמה זמנית ל-15 דקות.',
  keyGenerator: (req) => {
    return 'admin_login:' + ((req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'ip-default');
  }
}).middleware();
