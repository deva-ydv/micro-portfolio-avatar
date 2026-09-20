const rateLimit = require("express-rate-limit");

// Generous limit for public profile views/redirects - protects against
// scraping/abuse without punishing normal traffic.
const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please slow down.",
  },
});

// Stricter limit for auth endpoints - slows down brute-force login/register attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts, please try again later.",
  },
});

module.exports = { publicLimiter, authLimiter };
