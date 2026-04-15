import rateLimit from 'express-rate-limit';
import { ApiResponse } from '@njoum/shared';

// General API limiter — 300 req / 15 min per IP
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const body: ApiResponse = {
      success: false,
      data: null,
      error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
      meta: null,
    };
    res.status(429).json(body);
  },
});

// Strict limiter for auth endpoints — 10 req / min per IP
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const body: ApiResponse = {
      success: false,
      data: null,
      error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Please wait 1 minute.' },
      meta: null,
    };
    res.status(429).json(body);
  },
});
