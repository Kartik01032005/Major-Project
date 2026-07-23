import { rateLimit } from "express-rate-limit";

/**
 * General API Rate Limiter
 * Limits each IP to 100 requests per 15-minute window.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes."
  }
});

/**
 * Strict Rate Limiter for Sensitive Routes (Auth & Emergency Requests)
 * Limits each IP to 15 requests per 15-minute window.
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15, // Limit each IP to 15 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many sensitive requests from this IP. Please slow down and try again after 15 minutes."
  }
});
