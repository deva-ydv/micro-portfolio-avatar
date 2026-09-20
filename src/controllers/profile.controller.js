const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const redisClient = require("../config/redis");
const generateUniqueSlug = require("../utils/generateSlug");

const PUBLIC_CACHE_PREFIX = "public:profile:";

// @desc    Get own profile
// @route   GET /api/profile/me
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

// @desc    Update own profile (bio, theme, avatarUrl, isPublic, slug)
// @route   PUT /api/profile/me
// @access  Private
const updateMyProfile = asyncHandler(async (req, res) => {
  const { bio, theme, avatarUrl, isPublic, name, slug } = req.body;
  const user = req.user;
  const oldSlug = user.slug;

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (theme !== undefined) user.theme = theme;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (isPublic !== undefined) user.isPublic = isPublic;

  // Allow explicit slug change, but re-validate uniqueness
  if (slug !== undefined && slug !== oldSlug) {
    const taken = await User.findOne({ slug, _id: { $ne: user._id } }).lean();
    if (taken) {
      res.status(400);
      throw new Error("That slug is already taken");
    }
    user.slug = slug;
  }

  await user.save();

  // Invalidate cached public page(s) for both old and new slug
  await redisClient.del(`${PUBLIC_CACHE_PREFIX}${oldSlug}`);
  if (user.slug !== oldSlug) {
    await redisClient.del(`${PUBLIC_CACHE_PREFIX}${user.slug}`);
  }

  res.status(200).json({ success: true, data: user });
});

// Utility for regenerating slug on demand (not wired to a route by default,
// but handy if the frontend wants a "shuffle my slug" button)
const regenerateSlug = asyncHandler(async (req, res) => {
  const user = req.user;
  const oldSlug = user.slug;
  user.slug = await generateUniqueSlug(user.name);
  await user.save();

  await redisClient.del(`${PUBLIC_CACHE_PREFIX}${oldSlug}`);

  res.status(200).json({ success: true, data: { slug: user.slug } });
});

module.exports = { getMyProfile, updateMyProfile, regenerateSlug };
