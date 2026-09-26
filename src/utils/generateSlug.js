const slugify = require("slugify");
const User = require("../models/User");

/**
 * Generates a unique, URL-safe slug from a base string (usually the user's name).
 * Appends a short numeric suffix if the slug is already taken.
 */
const generateUniqueSlug = async (base) => {
  const baseSlug = slugify(base, { lower: true, strict: true }) || "user";
  let slug = baseSlug;
  let attempt = 0;

  // Loop until we find a slug that isn't taken (bounded to avoid infinite loop)
  while (attempt < 20) {
    const exists = await User.findOne({ slug }).lean();
    if (!exists) return slug;
    attempt += 1;
    const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit suffix
    slug = `${baseSlug}-${suffix}`;
  }

  // Fallback: timestamp-based slug (practically guaranteed unique)
  return `${baseSlug}-${Date.now()}`;
};

module.exports = generateUniqueSlug;
