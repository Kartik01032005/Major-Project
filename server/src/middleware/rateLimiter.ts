import { rateLimit } from "express-rate-limit";

const isDev = process.env.NODE_ENV !== "production";

/**
 * General API Rate Limiter
 * Bypassed in development mode; 100 requests per 15-minute window in production.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes."
  }
});

/**
 * Strict Rate Limiter for Sensitive Routes (Auth & Emergency Requests)
 * Bypassed in development mode; skips session verification (/me) in production.
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Bypass in development mode for seamless local DX
    if (isDev) return true;
    // Skip lightweight session verification endpoint in production
    if (req.path === "/me" || req.originalUrl?.includes("/auth/me")) return true;
    return false;
  },
  message: {
    success: false,
    message: "Too many sensitive requests from this IP. Please slow down and try again after 15 minutes."
  }
});
