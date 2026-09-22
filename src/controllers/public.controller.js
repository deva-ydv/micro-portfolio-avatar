const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Link = require("../models/Link");
const redisClient = require("../config/redis");

const PUBLIC_CACHE_PREFIX = "public:profile:";
const CACHE_TTL = parseInt(process.env.PUBLIC_PROFILE_CACHE_TTL, 10) || 60; // seconds

// @desc    Get a public profile page by slug (cached in Redis)
// @route   GET /api/public/:slug
// @access  Public
const getPublicProfile = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const cacheKey = `${PUBLIC_CACHE_PREFIX}${slug}`;

  // 1. Try cache first
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return res.status(200).json({ success: true, cached: true, data: JSON.parse(cached) });
  }

  // 2. Cache miss - hit MongoDB
  const user = await User.findOne({ slug, isPublic: true });
  if (!user) {
    res.status(404);
    throw new Error("Profile not found");
  }

  const links = await Link.find({ user: user._id, isActive: true })
    .sort({ order: 1 })
    .select("title url icon order");

  const payload = { profile: user.toPublicJSON(), links };

  // 3. Populate cache for next request (fire-and-forget style, but awaited for safety)
  await redisClient.set(cacheKey, JSON.stringify(payload), "EX", CACHE_TTL);

  res.status(200).json({ success: true, cached: false, data: payload });
});

// @desc    Redirect to a link's target URL and increment its click count
// @route   GET /api/r/:linkId
// @access  Public
const redirectLink = asyncHandler(async (req, res) => {
  const { linkId } = req.params;

  const link = await Link.findById(linkId).select("url isActive");

  if (!link || !link.isActive) {
    res.status(404);
    throw new Error("Link not found");
  }

  // Redirect immediately, then increment the click count without
  // blocking the response - the visitor shouldn't wait on this write.
  res.redirect(302, link.url);

  Link.findByIdAndUpdate(linkId, { $inc: { clicks: 1 } }).exec((err) => {
    if (err) console.error("Failed to record click:", err.message);
  });
});

module.exports = { getPublicProfile, redirectLink };
