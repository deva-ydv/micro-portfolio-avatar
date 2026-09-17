const asyncHandler = require("express-async-handler");
const Link = require("../models/Link");
const redisClient = require("../config/redis");

const PUBLIC_CACHE_PREFIX = "public:profile:";

const invalidatePublicCache = async (slug) => {
  await redisClient.del(`${PUBLIC_CACHE_PREFIX}${slug}`);
};

// @desc    Get all links for the logged-in user
// @route   GET /api/links
// @access  Private
const getMyLinks = asyncHandler(async (req, res) => {
  const links = await Link.find({ user: req.user._id }).sort({ order: 1, createdAt: 1 });
  res.status(200).json({ success: true, count: links.length, data: links });
});

// @desc    Create a new link
// @route   POST /api/links
// @access  Private
const createLink = asyncHandler(async (req, res) => {
  const { title, url, icon } = req.body;

  if (!title || !url) {
    res.status(400);
    throw new Error("Title and url are required");
  }

  // New links go to the end of the list by default
  const lastLink = await Link.findOne({ user: req.user._id }).sort({ order: -1 });
  const order = lastLink ? lastLink.order + 1 : 0;

  const link = await Link.create({
    user: req.user._id,
    title,
    url,
    icon,
    order,
  });

  await invalidatePublicCache(req.user.slug);

  res.status(201).json({ success: true, data: link });
});

// @desc    Update a link (title, url, icon, isActive)
// @route   PUT /api/links/:id
// @access  Private
const updateLink = asyncHandler(async (req, res) => {
  const link = await Link.findOne({ _id: req.params.id, user: req.user._id });

  if (!link) {
    res.status(404);
    throw new Error("Link not found");
  }

  const { title, url, icon, isActive } = req.body;
  if (title !== undefined) link.title = title;
  if (url !== undefined) link.url = url;
  if (icon !== undefined) link.icon = icon;
  if (isActive !== undefined) link.isActive = isActive;

  await link.save();
  await invalidatePublicCache(req.user.slug);

  res.status(200).json({ success: true, data: link });
});

// @desc    Delete a link
// @route   DELETE /api/links/:id
// @access  Private
const deleteLink = asyncHandler(async (req, res) => {
  const link = await Link.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!link) {
    res.status(404);
    throw new Error("Link not found");
  }

  await invalidatePublicCache(req.user.slug);

  res.status(200).json({ success: true, data: {} });
});

// @desc    Reorder links (drag-and-drop from frontend)
// @route   PUT /api/links/reorder
// @access  Private
// body: { order: [linkId1, linkId2, linkId3, ...] } - in desired display order
const reorderLinks = asyncHandler(async (req, res) => {
  const { order } = req.body;

  if (!Array.isArray(order) || order.length === 0) {
    res.status(400);
    throw new Error("Provide an 'order' array of link IDs");
  }

  // Bulk update - each link's `order` field set to its index in the array.
  // Scoped to req.user._id so a user can't reorder someone else's links.
  const bulkOps = order.map((linkId, index) => ({
    updateOne: {
      filter: { _id: linkId, user: req.user._id },
      update: { $set: { order: index } },
    },
  }));

  await Link.bulkWrite(bulkOps);
  await invalidatePublicCache(req.user.slug);

  const links = await Link.find({ user: req.user._id }).sort({ order: 1 });
  res.status(200).json({ success: true, data: links });
});

module.exports = { getMyLinks, createLink, updateLink, deleteLink, reorderLinks };
